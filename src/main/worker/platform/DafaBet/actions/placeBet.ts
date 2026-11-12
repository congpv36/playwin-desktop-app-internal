import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'
import { v4 as uuidv4 } from 'uuid'

import { AccountType, TicketInfoDataBetType } from '@shared/common/types'
import { OPTIONS_PROXY } from '@shared/main/constants'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { handleBetError, handleBetSuccess } from '@/worker/lib/handleLogBet'
import { isOddInRange } from '@/worker/lib/isOddInRange'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { buildHeadersBetslip } from '@/worker/platform/DafaBet/common/contants'
import {
  BetslipResponse_DafaBet,
  PlaceBetResponse_DafaBet
} from '@/worker/platform/DafaBet/common/types'
import { buildPlaceBetUrl, getCookieValue } from '@/worker/platform/DafaBet/helper'

// Dafabet stakes are sent in units of 1000 (VND "K")
const STAKE_MULTIPLIER = 1000

export const placeBet_DafaBet = async (
  ticket: TicketInfoDataBetType,
  accountInfo: AccountType,
  dataGetTicketInfo: BetslipResponse_DafaBet
) => {
  if (!ticket.isBetAllowed) {
    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      ticket.betRejectionReason,
      'BetList'
    )
    return {
      ErrorCode: 400,
      Data: {
        info: ticket.betRejectionReason,
        receiptID: '',
        receiptStatus: ''
      }
    }
  }

  if (ticket.checkOdd == 1) {
    if (!isOddInRange(ticket.oddFrom, ticket.oddTo, String(ticket.odd))) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `Error: CheckOdd setting do not match.`,
        'BetList'
      )
      return {
        ErrorCode: 400,
        Data: {
          info: `Error: CheckOdd setting do not match.`,
          receiptID: '',
          receiptStatus: ''
        }
      }
    }
  }

  const {
    ErrorCode: ErrorCode_ProcessBet,
    Info,
    receiptID
  } = await bettingProcessBet__DafaBet(accountInfo, ticket, dataGetTicketInfo)

  return {
    ErrorCode: ErrorCode_ProcessBet, // 0: Success, 1: Fail, 2: Retry
    Data: {
      info: String(Info),
      receiptID: String(receiptID),
      receiptStatus: ErrorCode_ProcessBet == 0 ? 'Success' : 'Fail'
    }
  }
}

async function bettingProcessBet__DafaBet(
  accountInfo: AccountType,
  ticket: TicketInfoDataBetType,
  dataGetTicketInfo: BetslipResponse_DafaBet
) {
  const { platformName, loginID, cookie } = accountInfo

  try {
    const { status, data } = isProxyConfigValid(accountInfo)
    const { newIpAddress, newPort, newUsername, newPassword } = data
    const proxyAgent =
      status && accountInfo.proxyScope !== OPTIONS_PROXY.NONE
        ? new HttpsProxyAgent(`http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`)
        : undefined

    const token = getCookieValue(cookie, 'extToken')
    if (!token) throw new Error('DafaBet extToken not found in cookie')

    const accountId = accountInfo.parent_id
    if (!accountId) throw new Error('DafaBet parent_id (accountId) not found')

    const model = dataGetTicketInfo?.model
    const single = model?.singles?.[0]
    if (!single) throw new Error('DafaBet ticket data not found')

    const unitStake = Number(ticket.betAmount_Standard) * STAKE_MULTIPLIER

    const body = JSON.stringify({
      accountId: Number(accountId),
      betslipKind: null,
      model: {
        ...model,
        singles: [{ ...single, unitStake }]
      },
      ref: null
    })

    await accountLogToFile(
      platformName,
      loginID,
      `Betting Info: ${ticket.bet}, ${ticket.number == 0 ? 'FullTime' : '1StHalf'} ${ticket.type}@${ticket.bet.trim() == ticket.nameAway.trim() ? -Number(ticket.hdp_point) : ticket.hdp_point}, Odd: ${ticket.odd}`,
      'BetList'
    )
    await accountLogToFile(platformName, loginID, `Payload: ${body}`, 'BetList')

    const url = buildPlaceBetUrl(accountId, uuidv4())
    const resBetPlacement = await fetch(url, {
      method: 'POST',
      headers: {
        ...buildHeadersBetslip(accountInfo, token),
        Cookie: cookie
      },
      ...(proxyAgent && { agent: proxyAgent }),
      body
    })

    const resBetPlacementText = await resBetPlacement.text()
    let dataBetPlacement: PlaceBetResponse_DafaBet
    try {
      dataBetPlacement = JSON.parse(resBetPlacementText)
    } catch {
      await accountLogToFile(
        platformName,
        loginID,
        `Invalid JSON response BET_PLACEMENT (status ${resBetPlacement.status}): ${resBetPlacementText.slice(0, 2000)}`,
        'BetList'
      )
      return await handleBetError(
        platformName,
        loginID,
        `Invalid JSON response, status ${resBetPlacement.status}: ${resBetPlacementText.slice(0, 300)}`
      )
    }
    await accountLogToFile(
      platformName,
      loginID,
      `Response BET_PLACEMENT: ${JSON.stringify(dataBetPlacement)}`,
      'BetList'
    )

    const resModel = dataBetPlacement?.model
    const errors = resModel?.errors ?? dataBetPlacement?.errors ?? []
    const resSingle = resModel?.singles?.[0]

    if (!resBetPlacement.ok || errors.length || resSingle?.messageCode) {
      return await handleBetError(
        platformName,
        loginID,
        `${resSingle?.messageCode ?? ''} ${resSingle?.message ?? ''} ${errors.length ? JSON.stringify(errors) : ''} ${dataBetPlacement?.message ?? ''}`.trim() ||
          `status ${resBetPlacement.status}`
      )
    }

    const receiptID = resModel?.reference || resModel?.betSlipId
    if (!receiptID) {
      return await handleBetError(platformName, loginID, 'Bet reference not found')
    }

    return await handleBetSuccess(platformName, loginID, receiptID)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('DafaBet BET_PLACEMENT Fail:', errorMessage)
    return await handleBetError(platformName, loginID, `${errorMessage}`)
  }
}
