import fetch from 'node-fetch'

import { FH } from '@shared/common/constants'
import { AccountType, TicketInfoDataBetType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { handleBetError, handleBetSuccess } from '@/worker/lib/handleLogBet'
import { isOddInRange } from '@/worker/lib/isOddInRange'
import { invalidateLobbySessionFishBet88 } from '@/worker/platform/FishBet88/actions/lobbySession'
import { buildHeadersLobby } from '@/worker/platform/FishBet88/common/constants'
import {
  PlaceBetResponse_FishBet88,
  TicketData_FishBet88
} from '@/worker/platform/FishBet88/common/types'
import {
  buildLobbyBetUrl,
  buildProxyAgent,
  isLobbyLoggedOut,
  isPlaceBetInfoResponse,
  LOBBY_STATUS_MESSAGES_FISHBET88,
  parsePlaceBetInfo
} from '@/worker/platform/FishBet88/helper'

const REQUEST_TIMEOUT_MS = 30_000

// 701 odds changed, 703 score changed, 710 temp odds close.
const RETRYABLE_LOBBY_CODES_FISHBET88 = ['701', '703', '710']

/** Hides the auth token in logged URLs (URLSearchParams encodes it, e.g. `+` -> `%2B`). */
const maskToken = (url: string, token: string) =>
  url.replace(token, '***').replace(encodeURIComponent(token), '***')

const reject = (info: string) => ({
  ErrorCode: 400,
  Data: { info, receiptID: '', receiptStatus: '' }
})

export const placeBet_FishBet88 = async (
  ticket: TicketInfoDataBetType,
  accountInfo: AccountType,
  dataGetTicketInfo: TicketData_FishBet88
) => {
  if (!ticket.isBetAllowed) {
    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      ticket.betRejectionReason,
      'BetList'
    )
    return reject(ticket.betRejectionReason)
  }

  if (ticket.checkOdd == 1 && !isOddInRange(ticket.oddFrom, ticket.oddTo, String(ticket.odd))) {
    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Error: CheckOdd setting do not match.`,
      'BetList'
    )
    return reject(`Error: CheckOdd setting do not match.`)
  }

  const {
    ErrorCode: ErrorCode_ProcessBet,
    Info,
    receiptID
  } = await bettingProcessBet_FishBet88(accountInfo, ticket, dataGetTicketInfo)

  return {
    ErrorCode: ErrorCode_ProcessBet, // 0: Success, 1: Fail
    Data: {
      info: String(Info),
      receiptID: String(receiptID),
      receiptStatus: ErrorCode_ProcessBet == 0 ? 'Success' : 'Fail'
    }
  }
}

async function bettingProcessBet_FishBet88(
  accountInfo: AccountType,
  ticket: TicketInfoDataBetType,
  dataGetTicketInfo: TicketData_FishBet88
) {
  const { platformName, loginID } = accountInfo

  try {
    const { session, betParams, placePath } = dataGetTicketInfo ?? {}
    if (!session || !betParams || !placePath) throw new Error('FishBet88 ticket data not found')

    const amount = Number(ticket.betAmount_Standard)
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(`Invalid bet amount [${ticket.betAmount_Standard}]`)
    }

    const url = buildLobbyBetUrl(placePath, { ...betParams, amount: String(amount) })

    await accountLogToFile(
      platformName,
      loginID,
      `Betting Info: ${ticket.bet}, ${ticket.number == FH ? '1StHalf' : 'FullTime'} ${ticket.type}@${ticket.bet.trim() == ticket.nameAway.trim() ? -Number(ticket.hdp_point) : ticket.hdp_point}, Odd: ${ticket.odd} (EU ${betParams.oddsAfterConvert}), Amount: ${amount}`,
      'BetList'
    )
    await accountLogToFile(
      platformName,
      loginID,
      `Request ${placePath}: ${maskToken(url, session.authToken)}`,
      'BetList'
    )

    const proxyAgent = buildProxyAgent(accountInfo)
    const res = await fetch(url, {
      method: 'GET',
      headers: buildHeadersLobby(accountInfo, session),
      redirect: 'manual',
      timeout: REQUEST_TIMEOUT_MS,
      ...(proxyAgent && { agent: proxyAgent })
    })

    if (isLobbyLoggedOut(res)) {
      invalidateLobbySessionFishBet88(accountInfo)
      return await handleBetError(platformName, loginID, 'Lobby session expired')
    }

    const raw = await res.text()
    await accountLogToFile(
      platformName,
      loginID,
      `Response BET_PLACEMENT: Status ${res.status}, ${raw.slice(0, 2000)}`,
      'BetList'
    )

    // Rejected bets come back as `<status>|<odds>|...` (Betfred_bet.js -> confirmPlaceBet).
    if (isPlaceBetInfoResponse(raw)) {
      const info = parsePlaceBetInfo(raw)
      const reason = LOBBY_STATUS_MESSAGES_FISHBET88[info.code] ?? `Status ${info.code}`
      const detail =
        info.code === '701'
          ? `: sent EU ${betParams.oddsAfterConvert}, lobby now ${info.odds} / handicap ${info.handicap}`
          : ''
      const result = await handleBetError(
        platformName,
        loginID,
        `[${info.code}] ${reason}${detail}`
      )
      // Odds / score moved or odds briefly closed (common on Running): ErrorCode 2 lets the
      // worker re-bet (handleReBetTicket -> fresh GetPlaceBetInfo2 + PlaceBet) instead of failing.
      return RETRYABLE_LOBBY_CODES_FISHBET88.includes(info.code)
        ? { ...result, ErrorCode: 2 }
        : result
    }

    let data: PlaceBetResponse_FishBet88 | null = null
    try {
      data = JSON.parse(raw)
    } catch {
      // Errors are expected to come back as plain text; the message is used as is.
      return await handleBetError(
        platformName,
        loginID,
        `${raw.trim().slice(0, 300) || 'Empty response'} (status ${res.status})`
      )
    }

    if (!res.ok || !data?.TicketNo) {
      return await handleBetError(
        platformName,
        loginID,
        data?.Message || data?.ErrorMessage || `Ticket not created (status ${res.status})`
      )
    }

    return await handleBetSuccess(platformName, loginID, data.TicketNo)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('FishBet88 BET_PLACEMENT Fail:', errorMessage)
    return await handleBetError(platformName, loginID, errorMessage)
  }
}
