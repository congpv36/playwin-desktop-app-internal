import { HttpsProxyAgent } from 'https-proxy-agent'

import { GAME_TYPES, OVER } from '@shared/common/constants'
import { AccountType, TicketInfoDataBetType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { handleBetError, handleBetSuccess } from '@/worker/lib/handleLogBet'
import { isOddInRange } from '@/worker/lib/isOddInRange'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { BET_TYPE_MAP, ODDS_COL_MAP } from '@/worker/platform/Wbet/common/constants'
import { BetCheckResponse, TypeGetTickets_WBet } from '@/worker/platform/Wbet/common/types'
import { buildPlatformUrl_WBet, fetchJsonWithDecompress } from '@/worker/platform/Wbet/helper'

export const placeBet_WBet = async (
  ticket: TicketInfoDataBetType,
  accountInfo: AccountType,
  dataGetTicketInfo: TypeGetTickets_WBet
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
  } = await bettingProcessBet__WBet(accountInfo, ticket, dataGetTicketInfo)

  return {
    ErrorCode: ErrorCode_ProcessBet, // 0: Success, 1: Fail, 2: Retry
    Data: {
      info: String(Info),
      receiptID,
      receiptStatus: ErrorCode_ProcessBet == 0 ? 'Success' : 'Fail'
    }
  }
}

async function bettingProcessBet__WBet(
  accountInfo: AccountType,
  ticket: TicketInfoDataBetType,
  dataGetTicketInfo: TypeGetTickets_WBet
) {
  const { platformName, loginID } = accountInfo

  try {
    const { status: statusProxyConfigValid, data } = isProxyConfigValid(accountInfo)
    const { newIpAddress, newPort, newUsername, newPassword } = data

    const proxyUrl =
      statusProxyConfigValid && accountInfo.proxyScope !== 'None'
        ? `http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`
        : undefined

    const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

    const isHome = ticket.bet === ticket.nameHome || ticket.bet === OVER

    const stake = ticket.betAmount_Standard
    const bet_type = BET_TYPE_MAP[ticket.type]?.[ticket.number]
    const bet_team_id = isHome
      ? ticket.marketSelectionId_home_over
      : ticket.marketSelectionId_away_under
    const home_away = isHome ? 1 : 2
    const odds_col = ODDS_COL_MAP[ticket.type]?.[isHome ? 'home' : 'away']

    const odds_check_detail = dataGetTicketInfo.odds_check_details[0]
    const odds_display_new = odds_check_detail.odds_display_new
    const odds_new = odds_check_detail.odds_new
    const odds_change = odds_check_detail.odds_change == true

    const odds_display = odds_change ? odds_display_new : ticket.odd
    const odds_mo = odds_change ? odds_new : Number((Number(ticket.odd) / 0.1).toFixed(2))
    const market_type =
      ticket.gameType == GAME_TYPES.EARLY ? 1 : ticket.gameType == GAME_TYPES.TODAY ? 2 : 3

    const body = JSON.stringify({
      odds_type: 1,
      market_type,
      account_id: accountInfo.loginID,
      session_token: accountInfo.cookie,
      parent_id: accountInfo.parent_id,
      odds_id: ticket.altLineId,
      submatch_id: ticket.submatch_id,
      match_id: ticket.idEvent,
      bet_type,
      bet_member: String(stake),
      bet_team_id,
      home_away,
      odds_col,
      accept_better_odds: 'false',
      ball_display: ticket.HDP,
      operator_type: null,
      odds_mo,
      odds_display
    })
    await accountLogToFile(
      platformName,
      loginID,
      `Betting Info: ${ticket.bet}, ${ticket.number == 0 ? 'FullTime' : '1StHalf'} ${ticket.type}@${ticket.bet.trim() == ticket.nameAway.trim() ? -Number(ticket.hdp_point) : ticket.hdp_point}, Odd: ${ticket.odd}`,
      'BetList'
    )
    await accountLogToFile(platformName, loginID, `Payload: ${body}`, 'BetList')

    const dataBetSingle: BetCheckResponse = await fetchJsonWithDecompress(
      buildPlatformUrl_WBet(accountInfo, 'BET_SINGLE'),
      accountInfo,
      {
        method: 'POST',
        body,
        ...(proxyAgent && { agent: proxyAgent })
      }
    )

    await accountLogToFile(
      platformName,
      loginID,
      `Response BET_PLACEMENT: ${JSON.stringify(dataBetSingle)}`,
      'BetList'
    )

    if (dataBetSingle.status == 1 && dataBetSingle.statusdesc == 'OK') {
      return await handleBetSuccess(platformName, loginID, dataBetSingle.bet_id)
    } else {
      return await handleBetError(
        platformName,
        loginID,
        dataBetSingle.statusdesc || `Unknown Error`
      )
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('WBet BET_PLACEMENT Fail:', errorMessage)
    return await handleBetError(platformName, loginID, `${errorMessage}`)
  }
}
