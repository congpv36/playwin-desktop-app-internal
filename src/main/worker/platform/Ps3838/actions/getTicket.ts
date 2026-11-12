import fetch from 'node-fetch'

import { AccountType, TicketInfoDataBetType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import {
  buildHeadersBalancePs3838,
  buildHeadersPs3838,
  ODD_CODE
} from '@/worker/platform/Ps3838/common/contants'
import { resBalance_Ps3838, TypeGetTickets_Ps3838 } from '@/worker/platform/Ps3838/common/types'
import {
  buildPlatformUrl,
  buildProxyAgent,
  buildTokenHeaders,
  DEBUG_X_APP_DATA,
  parseTokens,
  withDebugCookie
} from '@/worker/platform/Ps3838/helper'

export const getTicket_Ps3838 = async (accountInfo: AccountType, ticket: TicketInfoDataBetType) => {
  if (!ticket.isBetAllowed) {
    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      ticket.betRejectionReason,
      'BetList'
    )
    return {
      ErrorCode: 400,
      Message: 'No Bet By User',
      Hdp_point: ticket.hdp_point,
      HDP: ticket.HDP,
      Odds: ticket.odd || 0,
      Data: null,
      OldsOdd: ticket.odd,
      Min: 0,
      Max: 0
    }
  }
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
    `--------------------[[${`GameType ${ticket.gameType}`}] ${ticket.nameHome} -vs- ${ticket.nameAway}: Bet ${ticket.bet}, ${ticket.number == 0 ? 'FullTime' : '1StHalf'} ${ticket.type}@${ticket.bet.trim() == ticket.nameAway.trim() ? -Number(ticket.hdp_point) : ticket.hdp_point}, Odd: ${ticket.odd} ]--------------------`,
    'BetList'
  )
  await accountLogToFile(accountInfo.platformName, accountInfo.loginID, '', 'BetList')

  try {
    const { proxyAgent } = buildProxyAgent(accountInfo)

    const halfType = ticket.number === 0 ? 'FT' : 'FH'
    const oddType = ticket.specialOdd === 1 ? '' : '0'
    const betType = ticket.typeOdd === 'SPREAD' ? 'HDP' : 'POINT'
    const betSide = ticket.bet === ticket.nameHome || ticket.bet === 'Over' ? 'HOME' : 'AWAY'

    const pointSide = ticket.bet === 'Over' ? 'OVER' : 'UNDER'
    const code =
      ODD_CODE[halfType][betType][oddType + betSide] ||
      ODD_CODE[halfType][betType][oddType + pointSide]

    const type = ticket.bet === 'Over' || ticket.bet === ticket.nameHome ? 0 : 1
    const point = ticket.bet === ticket.nameAway ? -ticket.hdp_point : ticket.hdp_point

    const oddsId = `${ticket.idEvent}|${code}|${point}`
    const selectionId = `${ticket.altLineId}|${oddsId}|${type}`

    const body = JSON.stringify({
      oddsSelections: [
        {
          oddsFormat: 4,
          oddsSelectionsType: 'NORMAL',
          selectionId,
          oddsId
        }
      ]
    })

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Getting Multi Ticket Data: ${ticket.bet}, ${ticket.number == 0 ? 'FullTime' : '1StHalf'} ${ticket.type}@${ticket.bet.trim() == ticket.nameAway.trim() ? -Number(ticket.hdp_point) : ticket.hdp_point}, Odd: ${ticket.odd}`,
      'BetList'
    )

    const tokens = parseTokens(accountInfo.token)
    const resKeepAlive = await fetch(buildPlatformUrl(accountInfo, 'KEEP_ALIVE'), {
      method: 'GET',
      headers: {
        ...buildHeadersBalancePs3838(accountInfo, accountInfo.vHucode),
        ...buildTokenHeaders(tokens),
        Cookie: withDebugCookie(accountInfo.cookie)
      },
      ...(proxyAgent && { agent: proxyAgent })
    })

    const vHucode = resKeepAlive.headers.get('v-hucode')

    if (!vHucode) {
      throw new Error('Ps3838 V-hucode not found')
    }

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Payload: ${body}`,
      'BetList'
    )

    const [resBalance, resGetTickets] = await Promise.all([
      fetch(buildPlatformUrl(accountInfo, 'BALANCE'), {
        method: 'POST',
        headers: {
          ...buildHeadersBalancePs3838(accountInfo, vHucode),
          ...buildTokenHeaders(tokens),
          Cookie: withDebugCookie(accountInfo.cookie)
        },
        body: '',
        ...(proxyAgent && { agent: proxyAgent })
      }),
      fetch(buildPlatformUrl(accountInfo, 'MULTI_TICKET'), {
        method: 'POST',
        headers: {
          ...buildHeadersPs3838(accountInfo, vHucode),
          ...buildTokenHeaders(tokens),
          'x-app-data': DEBUG_X_APP_DATA,
          Cookie: withDebugCookie(accountInfo.cookie)
        },
        ...(proxyAgent && { agent: proxyAgent }),
        body
      })
    ])
    const resBalanceText = await resBalance.text()
    let resDataBalance: resBalance_Ps3838
    try {
      resDataBalance = JSON.parse(resBalanceText)
    } catch {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `Invalid JSON response Balance (status ${resBalance.status}): ${resBalanceText.slice(0, 2000)}`,
        'BetList'
      )
      throw new Error(
        `Invalid JSON response Balance, status ${resBalance.status}: ${resBalanceText.slice(0, 300)}`
      )
    }
    const betAmount = ticket.betAmount_Standard

    if (betAmount !== '' && +betAmount > resDataBalance.betCredit) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `Error: Credit currently [${resDataBalance.betCredit}] less than bet amount setting [${betAmount}]`,
        'BetList'
      )

      return {
        ErrorCode: 1,
        Message: `Error: Credit currently [${resDataBalance.betCredit}] less than bet amount setting [${betAmount}]`,
        Hdp_point: ticket.hdp_point,
        HDP: ticket.HDP,
        Odds: ticket.odd || 0,
        Data: null,
        OldsOdd: ticket.odd,
        Min: 0,
        Max: 0
      }
    }

    const dataMultiTicket: TypeGetTickets_Ps3838[] = await resGetTickets.json()

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Response MultiTicket: ${JSON.stringify(dataMultiTicket)}`,
      'BetList'
    )

    if ('error' in dataMultiTicket && dataMultiTicket.error === 403) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `MultiTicket Error 403: ${JSON.stringify(dataMultiTicket)}`,
        'BetList'
      )
      return {
        ErrorCode: 1,
        Message: 'Error: Get Ticket Forbidden (403)',
        Hdp_point: ticket.hdp_point,
        HDP: ticket.HDP,
        Odds: ticket.odd || 0,
        Data: null,
        OldsOdd: ticket.odd,
        Min: 0,
        Max: 0
      }
    }

    if (dataMultiTicket[0].status != 'OK' && dataMultiTicket[0].status != 'ODDS_CHANGE') {
      return {
        ErrorCode: 1,
        Message: `Error: Ticket status ${dataMultiTicket[0].status}`,
        Hdp_point: ticket.hdp_point,
        HDP: ticket.HDP,
        Odds: ticket.odd || 0,
        Data: null,
        OldsOdd: ticket.odd,
        Min: 0,
        Max: 0
      }
    }

    if (betAmount !== '' && +betAmount < (dataMultiTicket[0].minStake ?? 0)) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `Error: Bet Amount [${betAmount}] less than Min Bet [${dataMultiTicket[0].minStake}]`,
        'BetList'
      )

      return {
        ErrorCode: 1,
        Message: `Error: Bet Amount [${betAmount}] less than Min Bet [${dataMultiTicket[0].minStake}]`,
        Hdp_point: ticket.hdp_point,
        HDP: ticket.HDP,
        Odds: ticket.odd || 0,
        Data: null,
        OldsOdd: ticket.odd,
        Min: 0,
        Max: 0
      }
    }

    return {
      ErrorCode: 0,
      Message: dataMultiTicket[0].status == 'ODDS_CHANGE' ? 'ODDS_CHANGE' : 'OK',
      Hdp_point: ticket.hdp_point,
      HDP: ticket.HDP,
      Odds: Number(dataMultiTicket[0].odds),
      Data: dataMultiTicket[0],
      OldsOdd: ticket.odd,
      Min: dataMultiTicket[0].minStake || 0,
      Max: dataMultiTicket[0].maxStake || 0
    }
  } catch (error) {
    console.log(
      'Fetch Ps3838 Get Ticket Fail:',
      error instanceof Error ? error.message : String(error)
    )

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Get Ticket Fail: ${error instanceof Error ? error.message : String(error)}`,
      'BetList'
    )
    return {
      ErrorCode: 1,
      Message: `Error: Get Ticket Fail ${error instanceof Error ? error.message : 'Unknown Error'}`,
      Hdp_point: ticket.hdp_point,
      HDP: ticket.HDP,
      Odds: ticket.odd || 0,
      Data: null,
      OldsOdd: ticket.odd,
      Min: 0,
      Max: 0
    }
  }
}
