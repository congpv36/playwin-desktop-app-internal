import { HttpsProxyAgent } from 'https-proxy-agent'

import { OVER } from '@shared/common/constants'
import { TicketInfoDataBetType } from '@shared/common/types'
import { AccountType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { BET_TYPE_MAP, ODDS_COL_MAP } from '@/worker/platform/Wbet/common/constants'
import {
  buildBodyBalance,
  buildPlatformUrl_WBet,
  fetchJsonWithDecompress
} from '@/worker/platform/Wbet/helper'

export const getTicket_WBet = async (accountInfo: AccountType, ticket: TicketInfoDataBetType) => {
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
    const { status, data } = isProxyConfigValid(accountInfo)

    const { newIpAddress, newPort, newUsername, newPassword } = data
    const proxyUrl =
      status && accountInfo.proxyScope !== 'None'
        ? `http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`
        : undefined

    const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

    const isHome = ticket.bet === ticket.nameHome || ticket.bet === OVER

    const bet_type = BET_TYPE_MAP[ticket.type]?.[ticket.number]
    const bet_team_id = isHome
      ? ticket.marketSelectionId_home_over
      : ticket.marketSelectionId_away_under
    const home_away = isHome ? 1 : 2
    const odds_col = ODDS_COL_MAP[ticket.type]?.[isHome ? 'home' : 'away']

    const oddValue = Number(ticket.odd)

    const body = JSON.stringify({
      sports_type: 1,
      odds_type: 1,
      account_id: accountInfo.loginID,
      session_token: accountInfo.cookie,
      parlay: false,
      odds_id: ticket.altLineId,
      submatch_id: ticket.submatch_id,
      bet_type,
      bet_team_id,
      home_away,
      odds_display: oddValue,
      odds_mo: oddValue / 0.1,
      ball_display: ticket.HDP,
      odds_col
    })

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Payload: ${body}`,
      'BetList'
    )
    const [dataBalance, dataGetTicket] = await Promise.all([
      await fetchJsonWithDecompress(buildPlatformUrl_WBet(accountInfo, 'BALANCE'), accountInfo, {
        method: 'POST',
        body: JSON.stringify(buildBodyBalance(accountInfo)),
        ...(proxyAgent && { agent: proxyAgent })
      }),
      await fetchJsonWithDecompress(buildPlatformUrl_WBet(accountInfo, 'BET_CHECK'), accountInfo, {
        method: 'POST',
        body,
        ...(proxyAgent && { agent: proxyAgent })
      })
    ])

    if (!dataBalance || dataBalance.status == -500) {
      throw new Error(`Error fetching balance: ${dataBalance.statusdesc || 'Unknown error'}`)
    }

    const betAmount = ticket.betAmount_Standard
    if (betAmount !== '' && +betAmount > Number(dataBalance.balance)) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `Error: Credit currently [${dataBalance.balance}] less than bet amount setting [${betAmount}]`,
        'BetList'
      )

      return {
        ErrorCode: 1,
        Message: `Error: Credit currently [${dataBalance.balance}] less than bet amount setting [${betAmount}]`,
        Hdp_point: ticket.hdp_point,
        HDP: ticket.HDP,
        Odds: ticket.odd || 0,
        Data: null,
        OldsOdd: ticket.odd,
        Min: 0,
        Max: 0
      }
    }

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Response GetTicket: ${JSON.stringify(dataGetTicket)}`,
      'BetList'
    )

    if (dataGetTicket.status === 313) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `MultiTicket Error 313: ${JSON.stringify(dataGetTicket)}`,
        'BetList'
      )
      return {
        ErrorCode: 1,
        Message: 'Error: Get Ticket invalidOdds (313)',
        Hdp_point: ticket.hdp_point,
        HDP: ticket.HDP,
        Odds: ticket.odd || 0,
        Data: null,
        OldsOdd: ticket.odd,
        Min: 0,
        Max: 0
      }
    }

    if (dataGetTicket.status === 1 && dataGetTicket.statusdesc == 'OK') {
      const odds_check_detail = dataGetTicket.odds_check_details[0]
      const min_bet = odds_check_detail.min_bet
      const max_bet = odds_check_detail.max_bet
      const odds_change = odds_check_detail.odds_change == true
      const odds_display_new = odds_check_detail.odds_display_new

      if (betAmount !== '' && +betAmount < Number(min_bet)) {
        await accountLogToFile(
          accountInfo.platformName,
          accountInfo.loginID,
          `Error: Bet Amount [${betAmount}] less than Min Bet [${min_bet}]`,
          'BetList'
        )

        return {
          ErrorCode: 1,
          Message: `Error: Bet Amount [${betAmount}] less than Min Bet [${min_bet}]`,
          Hdp_point: ticket.hdp_point,
          HDP: ticket.HDP,
          Odds: ticket.odd || 0,
          Data: null,
          OldsOdd: ticket.odd,
          Min: 0,
          Max: 0
        }
      }

      if (betAmount !== '' && +betAmount > Number(max_bet)) {
        await accountLogToFile(
          accountInfo.platformName,
          accountInfo.loginID,
          `Error: Bet Amount [${betAmount}] more than Max Bet [${max_bet}]`,
          'BetList'
        )

        return {
          ErrorCode: 1,
          Message: `Error: Bet Amount [${betAmount}] more than Max Bet [${max_bet}]`,
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
        Message: odds_change ? 'ODDS_CHANGE' : 'OK',
        Hdp_point: ticket.hdp_point,
        HDP: ticket.HDP,
        Odds: odds_change ? Number(odds_display_new) : ticket.odd,
        Data: dataGetTicket,
        OldsOdd: ticket.odd,
        Min: +min_bet,
        Max: +max_bet
      }
    } else {
      throw new Error(`Error: ${dataGetTicket.statusdesc || 'Unknown error'}`)
    }
  } catch (error) {
    console.log(
      'Fetch WBet Get Ticket Fail:',
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
