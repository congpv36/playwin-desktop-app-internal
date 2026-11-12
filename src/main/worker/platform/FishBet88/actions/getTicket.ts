import fetch from 'node-fetch'

import { FH, GAME_TYPES, OVER, SPREAD } from '@shared/common/constants'
import { AccountType, TicketInfoDataBetType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { getBalanceFishBet88 } from '@/worker/platform/FishBet88/actions/getBalance'
import { getMatchDetailFishBet88 } from '@/worker/platform/FishBet88/actions/getData'
import {
  getLobbySessionFishBet88,
  invalidateLobbySessionFishBet88
} from '@/worker/platform/FishBet88/actions/lobbySession'
import {
  BET_CODES_FISHBET88,
  buildHeadersLobby,
  MARKET_ID_FISHBET88,
  ODDS_LINES_FISHBET88,
  SPORT_ID_SOCCER_FISHBET88
} from '@/worker/platform/FishBet88/common/constants'
import {
  LobbySession_FishBet88,
  TicketData_FishBet88
} from '@/worker/platform/FishBet88/common/types'
import {
  buildLobbyBetUrl,
  buildProxyAgent,
  euroToMalayOdds,
  isLobbyLoggedOut,
  parsePlaceBetInfo,
  toStepEuroOdds,
  toStepRealOdds
} from '@/worker/platform/FishBet88/helper'

const REQUEST_TIMEOUT_MS = 15_000

const logBet = (account: AccountType, message: string) =>
  accountLogToFile(account.platformName, account.loginID, message, 'BetList')

export const getTicket_FishBet88 = async (
  accountInfo: AccountType,
  ticket: TicketInfoDataBetType
) => {
  const buildFail = (Message: string, ErrorCode = 1) => ({
    ErrorCode,
    Message,
    Hdp_point: ticket.hdp_point,
    HDP: ticket.HDP,
    Odds: ticket.odd || 0,
    Data: null as TicketData_FishBet88 | null,
    OldsOdd: ticket.odd,
    Min: 0,
    Max: 0
  })

  if (!ticket.isBetAllowed) {
    await logBet(accountInfo, ticket.betRejectionReason)
    return buildFail('No Bet By User', 400)
  }

  const betLine = `${ticket.bet}, ${ticket.number == FH ? '1StHalf' : 'FullTime'} ${ticket.type}@${ticket.bet.trim() == ticket.nameAway.trim() ? -Number(ticket.hdp_point) : ticket.hdp_point}, Odd: ${ticket.odd}`

  await logBet(accountInfo, '')
  await logBet(
    accountInfo,
    `------------------------------------------------------------------------------------------------------------------------------------------`
  )
  await logBet(
    accountInfo,
    `--------------------[[GameType ${ticket.gameType}] ${ticket.nameHome} -vs- ${ticket.nameAway}: Bet ${betLine} ]--------------------`
  )
  await logBet(accountInfo, '')

  try {
    const marketId = MARKET_ID_FISHBET88[ticket.gameType]
    if (marketId === undefined) throw new Error(`GameType ${ticket.gameType} not supported`)

    const line = ODDS_LINES_FISHBET88.find(
      (item) => item.number == ticket.number && item.typeOdd === ticket.typeOdd
    )
    if (!line) throw new Error(`Line ${ticket.typeOdd} / ${ticket.number} not supported`)
    if (!ticket.altLineId) throw new Error('RowID (altLineId) not found')

    const proxyAgent = buildProxyAgent(accountInfo)
    const isHomeOver = ticket.bet === ticket.nameHome || ticket.bet === OVER
    const isSpread = line.typeOdd === SPREAD
    const isRunning = ticket.gameType === GAME_TYPES.RUNNING

    await logBet(accountInfo, `Getting Ticket Data: ${betLine}`)

    // The odds row gives the live odds, the favourite side (ftFav / fhFav) and the running score.
    // eslint-disable-next-line prefer-const
    let [resBalance, session, rows] = await Promise.all([
      getBalanceFishBet88(accountInfo),
      getLobbySessionFishBet88(accountInfo, proxyAgent),
      getMatchDetailFishBet88(accountInfo, ticket.idEvent, marketId, proxyAgent)
    ])

    if (resBalance.ErrorCode !== 0) throw new Error(`Get balance failed: ${resBalance.Message}`)

    const row = rows.find((item) => String(item.RowID) === String(ticket.altLineId))
    if (!row) return buildFail('Error: Odds line not found (closed or removed)')

    const point = row[line.point]
    const malayOdd = isHomeOver ? row[line.home] : row[line.away]
    if (typeof point !== 'number' || typeof malayOdd !== 'number' || !malayOdd) {
      return buildFail('Error: Odds line closed')
    }

    // Same sign rule as the crawl (mapOddsRowToRecords): negative when home gives the handicap.
    const fav = isSpread ? (line.number == FH ? row.FHFav : row.FTFav) : 0
    const hdpPoint = isSpread && fav === 1 && point !== 0 ? -point : point
    if (hdpPoint !== Number(ticket.hdp_point)) {
      return buildFail(`Error: Handicap changed [${ticket.hdp_point} -> ${hdpPoint}]`)
    }

    // Today / Early are bet on the STEP page, Running as a single bet (no step odds adjustment).
    const isStep = !isRunning
    const stepOddsCal = () => (isStep ? session.stepOddsCal : 0)

    // Board odds: decimal (+ SSportStepOddsCal on a STEP page), see Betfred_bet.js -> showPlaceBet.
    // On a STEP page the lobby answers the feed odds - 0.01 (STEP_FEED_ODDS_DIFF_FISHBET88).
    const boardOdds = toStepEuroOdds(isStep ? toStepRealOdds(malayOdd) : malayOdd, stepOddsCal())
    const isMMKOddsMatch = /^true$/i.test(String(row.IsMMKOddsMatch ?? '')) ? 'True' : 'False'
    const rowId = String(row.RowID)
    const { gameType, eventCode, betType } = BET_CODES_FISHBET88

    // Shared by GetPlaceBetInfo2 and PlaceBetfredBet (same names / values as the website).
    const baseParams: Record<string, string> = {
      sportId: String(SPORT_ID_SOCCER_FISHBET88),
      rowid: rowId,
      odds: boardOdds,
      gameType: isSpread ? gameType.HDP : gameType.OU,
      betType: isSpread
        ? isHomeOver
          ? betType.home
          : betType.away
        : isHomeOver
          ? betType.over
          : betType.under,
      marketID: String(row.MarketID ?? marketId),
      eventCode: line.number == FH ? eventCode.FH : eventCode.FT,
      matchId: String(row.MatchID),
      oddsCat: 'EU',
      // The page always sends the FT favourite (list.FTFav), also for 1st half lines.
      ftFav: String(row.FTFav ?? 0),
      matchHalfTime: isRunning ? String(row.MatchTimeHalf ?? '') : '',
      betHomeScore: String(isRunning ? (row.HomeScore ?? 0) : 0),
      betAwayScore: String(isRunning ? (row.AwayScore ?? 0) : 0),
      specialGame: '0',
      page: 'hdp',
      isMMKOddsMatch,
      dBRowID: rowId
    }

    const requestInfo = async (lobby: LobbySession_FishBet88) => {
      const url = buildLobbyBetUrl('GetPlaceBetInfo2', {
        ...baseParams,
        authToken: lobby.authToken,
        userId: lobby.userId,
        ts: String(lobby.ts),
        o: String(Math.random()),
        // The page reads `list.fhFav` (lower case, never set), so it always sends 0.
        fhFav: '0',
        isPen: 'false',
        isParlay: String(isStep),
        isStep: String(isStep),
        // Single bet only (Betfred_bet.js, non parlay BetData).
        ...(!isStep && {
          LeagueId: String(row.LeagueID ?? ''),
          vipValue: '0',
          specialRowId: '0',
          isMMKOddsRow: 'False'
        })
      })
      await logBet(
        accountInfo,
        `Request GetPlaceBetInfo2: ${url.replace(lobby.authToken, '***').replace(encodeURIComponent(lobby.authToken), '***')}`
      )

      return fetch(url, {
        method: 'GET',
        headers: buildHeadersLobby(accountInfo, lobby),
        redirect: 'manual',
        timeout: REQUEST_TIMEOUT_MS,
        ...(proxyAgent && { agent: proxyAgent })
      })
    }

    let resInfo = await requestInfo(session)

    // Another worker (crawl / bet) may have opened a newer lobby session: reopen once and retry.
    if (isLobbyLoggedOut(resInfo)) {
      await logBet(accountInfo, 'Lobby session expired, reopening...')
      invalidateLobbySessionFishBet88(accountInfo)
      session = await getLobbySessionFishBet88(accountInfo, proxyAgent, { force: true })
      resInfo = await requestInfo(session)

      if (isLobbyLoggedOut(resInfo)) {
        invalidateLobbySessionFishBet88(accountInfo)
        return buildFail('Error: Lobby session expired')
      }
    }

    const raw = await resInfo.text()
    await logBet(accountInfo, `Response GetTicket: Status ${resInfo.status}, ${raw.slice(0, 500)}`)

    const info = parsePlaceBetInfo(raw)
    if (!resInfo.ok || info.parts.length < 13 || info.rowId !== rowId) {
      return buildFail(`Error: Ticket unavailable ${raw.slice(0, 200)}`)
    }

    if (!info.odds) return buildFail('Error: Odds closed')

    if (Number(info.handicap) !== Math.abs(point)) {
      return buildFail(`Error: Handicap changed [${Math.abs(point)} -> ${info.handicap}]`)
    }

    const betAmount = ticket.betAmount_Standard
    const credit = Number(resBalance.credit)
    const min = Number.isFinite(info.minBet) ? info.minBet : 0
    const max = Number.isFinite(info.maxBet) ? info.maxBet : 0

    if (betAmount !== '' && +betAmount > credit) {
      const message = `Error: Credit currently [${credit}] less than bet amount setting [${betAmount}]`
      await logBet(accountInfo, message)
      return buildFail(message)
    }

    if (betAmount !== '' && +betAmount < min) {
      const message = `Error: Bet Amount [${betAmount}] less than Min Bet [${min}]`
      await logBet(accountInfo, message)
      return buildFail(message)
    }

    // Single bet: parts[16] = isMMKOddsRow; the page refuses MMK rows for non MMK currencies.
    const isMMKOddsRow = info.parts[16] === 'True' ? 'True' : 'False'
    if (!isStep && isMMKOddsRow === 'True') return buildFail('Error: Odds closed (MMK odds row)')

    // parts[1] is the server odds (Malay). The lobby only accepts the odds it computes itself
    // ($ConvertOdds -> decimal, + SSportStepOddsCal on a STEP page); anything else answers 701.
    const betOdds = toStepEuroOdds(info.odds, stepOddsCal())
    const betMalayOdd = isStep ? euroToMalayOdds(Number(betOdds)) : info.odds
    await logBet(
      accountInfo,
      `Odds: feed ${malayOdd} (${boardOdds}) -> lobby ${info.odds} -> bet EU ${betOdds} (Malay ${betMalayOdd})`
    )

    const sessionParams = {
      authToken: session.authToken,
      userId: session.userId,
      ts: String(session.ts)
    }

    // Same params as confirmPlaceBet (Betfred_bet.js). STEP: `odds` = adjusted decimal odds.
    // Single bet: `odds` = raw server odds (parts[1]), `ftFav` = parts[7] (updated by the page).
    const betParams: Record<string, string> = isStep
      ? {
          ...baseParams,
          odds: betOdds,
          oddsAfterConvert: betOdds,
          vipValue: '0',
          ...sessionParams
        }
      : {
          ...baseParams,
          odds: info.parts[1],
          ftFav: info.parts[7] || baseParams.ftFav,
          // parts[4] / parts[5] = server score (a stale score answers 703 "score changed").
          ...(/^\d+$/.test(info.parts[4] ?? '') && { betHomeScore: info.parts[4] }),
          ...(/^\d+$/.test(info.parts[5] ?? '') && { betAwayScore: info.parts[5] }),
          oddsAfterConvert: betOdds,
          vipValue: '0',
          isMMKOddsRow,
          ...sessionParams
        }

    const data: TicketData_FishBet88 = {
      session,
      placePath: isStep ? 'PlaceBetfredBet' : 'PlaceBet',
      betParams,
      info
    }

    return {
      ErrorCode: 0,
      Message: betMalayOdd !== Number(ticket.odd) ? 'ODDS_CHANGE' : 'OK',
      Hdp_point: hdpPoint,
      HDP: ticket.HDP,
      // Same unit as the crawl (Malay); the decimal odds sent to the lobby are in Data.betParams.odds.
      Odds: betMalayOdd,
      Data: data,
      OldsOdd: ticket.odd,
      Min: min,
      Max: max
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.log('Fetch FishBet88 Get Ticket Fail:', errorMessage)

    await logBet(accountInfo, `Get Ticket Fail: ${errorMessage}`)
    return buildFail(`Error: Get Ticket Fail ${errorMessage}`)
  }
}
