import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'

import { OVER } from '@shared/common/constants'
import { AccountType, TicketInfoDataBetType } from '@shared/common/types'
import { OPTIONS_PROXY } from '@shared/main/constants'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { getBalanceDafaBet } from '@/worker/platform/DafaBet/actions/getBalance'
import { buildHeadersBetslip } from '@/worker/platform/DafaBet/common/contants'
import { BetslipResponse_DafaBet } from '@/worker/platform/DafaBet/common/types'
import { buildBetslipSelectionsUrl, getCookieValue } from '@/worker/platform/DafaBet/helper'

const OUTCOME_STATE_OPEN = 'O'
const STAKE_DIVISOR = 1000

const toDisplayStake = (value: string) => {
  const stake = Number(value) / STAKE_DIVISOR
  return Number.isFinite(stake) ? Math.floor(stake * 100) / 100 : 0
}

export const getTicket_DafaBet = async (
  accountInfo: AccountType,
  ticket: TicketInfoDataBetType
) => {
  const buildFail = (Message: string, ErrorCode = 1) => ({
    ErrorCode,
    Message,
    Hdp_point: ticket.hdp_point,
    HDP: ticket.HDP,
    Odds: ticket.odd || 0,
    Data: null,
    OldsOdd: ticket.odd,
    Min: 0,
    Max: 0
  })

  if (!ticket.isBetAllowed) {
    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      ticket.betRejectionReason,
      'BetList'
    )
    return buildFail('No Bet By User', 400)
  }

  const betLine = `${ticket.bet}, ${ticket.number == 0 ? 'FullTime' : '1StHalf'} ${ticket.type}@${ticket.bet.trim() == ticket.nameAway.trim() ? -Number(ticket.hdp_point) : ticket.hdp_point}, Odd: ${ticket.odd}`

  await accountLogToFile(accountInfo.platformName, accountInfo.loginID, '', 'BetList')
  await accountLogToFile(
    accountInfo.platformName,
    accountInfo.loginID,
    `------------------------------------------------------------------------------------------------------------------------------------------`,
    'BetList'
  )
  await accountLogToFile(
    accountInfo.platformName,
    accountInfo.loginID,
    `--------------------[[${`GameType ${ticket.gameType}`}] ${ticket.nameHome} -vs- ${ticket.nameAway}: Bet ${betLine} ]--------------------`,
    'BetList'
  )
  await accountLogToFile(accountInfo.platformName, accountInfo.loginID, '', 'BetList')

  try {
    const { status, data } = isProxyConfigValid(accountInfo)
    const { newIpAddress, newPort, newUsername, newPassword } = data
    const proxyAgent =
      status && accountInfo.proxyScope !== OPTIONS_PROXY.NONE
        ? new HttpsProxyAgent(`http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`)
        : undefined

    const token = getCookieValue(accountInfo.cookie, 'extToken')
    if (!token) throw new Error('DafaBet extToken not found in cookie')

    const isHomeOver = ticket.bet === ticket.nameHome || ticket.bet === OVER
    const outcomeId = isHomeOver
      ? ticket.marketSelectionId_home_over
      : ticket.marketSelectionId_away_under
    const price = isHomeOver ? String(ticket.home_over) : String(ticket.away_under)

    if (!outcomeId || !ticket.altLineId) throw new Error('DafaBet outcomeId/marketId not found')

    const oddValue = Number(ticket.odd)

    const body = JSON.stringify({
      model: {
        delay: 0,
        betSlipId: 0,
        reference: null,
        singles: [
          {
            ref: 'sel1',
            outcomeId,
            price
          }
        ],
        userAcceptOdds: 'D',
        originId: '3'
      }
    })

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Getting Ticket Data: ${betLine}`,
      'BetList'
    )
    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Payload: ${body}`,
      'BetList'
    )

    const [resBalance, resTicket] = await Promise.all([
      getBalanceDafaBet(accountInfo),
      fetch(buildBetslipSelectionsUrl(), {
        method: 'PUT',
        headers: {
          ...buildHeadersBetslip(accountInfo, token),
          Cookie: accountInfo.cookie
        },
        ...(proxyAgent && { agent: proxyAgent }),
        body
      })
    ])

    const dataTicket: BetslipResponse_DafaBet = await resTicket.json()

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Response GetTicket: ${JSON.stringify(dataTicket)}`,
      'BetList'
    )

    if (resBalance.ErrorCode !== 0) {
      throw new Error(`Get balance failed: ${resBalance.Message}`)
    }

    const betAmount = ticket.betAmount_Standard
    const credit = Number(resBalance.credit)

    if (betAmount !== '' && +betAmount > credit) {
      const message = `Error: Credit currently [${credit}] less than bet amount setting [${betAmount}]`
      await accountLogToFile(accountInfo.platformName, accountInfo.loginID, message, 'BetList')
      return buildFail(message)
    }

    const single = dataTicket?.model?.singles?.[0]
    const errors = dataTicket?.model?.errors ?? []

    if (!single) {
      return buildFail(`Error: Ticket not found ${JSON.stringify(errors)}`)
    }

    if (
      errors.length ||
      !single.enabled ||
      !single.singleEnabled ||
      single.outcomeState !== OUTCOME_STATE_OPEN ||
      single.messageCode
    ) {
      return buildFail(
        `Error: Ticket unavailable [state ${single.outcomeState}] ${single.messageCode ?? ''} ${single.message ?? ''} ${errors.length ? JSON.stringify(errors) : ''}`.trim()
      )
    }

    const min = toDisplayStake(single.minBetStake)
    const max = toDisplayStake(single.maxBetStake)

    if (betAmount !== '' && +betAmount < min) {
      const message = `Error: Bet Amount [${betAmount}] less than Min Bet [${min}]`
      await accountLogToFile(accountInfo.platformName, accountInfo.loginID, message, 'BetList')
      return buildFail(message)
    }

    const newOdd = Number(single.price)

    return {
      ErrorCode: 0,
      Message: newOdd !== oddValue ? 'ODDS_CHANGE' : 'OK',
      Hdp_point: ticket.hdp_point,
      HDP: ticket.HDP,
      Odds: newOdd,
      Data: dataTicket,
      OldsOdd: ticket.odd,
      Min: min,
      Max: max
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.log('Fetch DafaBet Get Ticket Fail:', errorMessage)

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Get Ticket Fail: ${errorMessage}`,
      'BetList'
    )
    return buildFail(`Error: Get Ticket Fail ${errorMessage}`)
  }
}
