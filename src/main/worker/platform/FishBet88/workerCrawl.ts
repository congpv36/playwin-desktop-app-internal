/* eslint-disable no-constant-condition */
import { setTimeout } from 'timers/promises'
import { parentPort } from 'worker_threads'

import { Account, clearTable, createModel, Setting } from '@db/model'
import dataCrawlByPlatformSchema from '@db/schema/dataCrawlByPlatform'
import { SettingSchemaType } from '@db/schema/setting'

import { GAME_TYPES } from '@shared/common/constants'
import { AccountType, NameTeamType } from '@shared/common/types'
import { STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { isAccountActive } from '@/worker/lib/checkAccount'
import { logAndNotify } from '@/worker/lib/exitAccountWithLog'
import { findActiveAccount } from '@/worker/lib/findActiveAccount'
import { findStandardTeam } from '@/worker/lib/findStandardTeam'
import { formatName } from '@/worker/lib/formatName'
import { insertRecords } from '@/worker/lib/insertRecords'
import { systemLogToFile } from '@/worker/lib/systemLogToFile'
import {
  getMatchDetailFishBet88,
  getMatchesFishBet88
} from '@/worker/platform/FishBet88/actions/getData'
import { keepAliveFishBet88 } from '@/worker/platform/FishBet88/actions/keepAlive'
import { getLobbySessionFishBet88 } from '@/worker/platform/FishBet88/actions/lobbySession'
import { MARKET_ID_FISHBET88 } from '@/worker/platform/FishBet88/common/constants'
import { OddsRow_FishBet88 } from '@/worker/platform/FishBet88/common/types'
import {
  buildLiveStat,
  buildProxyAgent,
  mapOddsRowToRecords,
  parseDotNetDate,
  ProxyAgent_FishBet88,
  toStepMalayOdds,
  toStepRealOdds
} from '@/worker/platform/FishBet88/helper'
import { PLATFORM } from '@/worker/platform/platform.config'

const port = parentPort
if (!port) throw new Error('IllegalState')

/** The website polls GetBalance every 10s; keep doing it while a long crawl is running. */
const KEEP_ALIVE_INTERVAL_MS = 10_000
const CRAWL_INTERVAL_MS = 5_000
const MATCH_DETAIL_CONCURRENCY = 10
const STRICT_MATCH = { orderID: 1, platformName: PLATFORM.FISHBET88 }

port.on('message', async (action: string) => {
  if (action == 'Start') {
    try {
      await handleCrawlData()
    } catch (error) {
      await systemLogToFile(`Error Handle Crawl Data FishBet88: ${JSON.stringify(error)}`, 'Error')
    }
  }
})

const handleCrawlData = async () => {
  while (true) {
    const account = Account.findOne({
      platformName: PLATFORM.FISHBET88,
      status: STATUS_ACCOUNT.LOGOUT,
      statusLogin: STATUS_LOGIN.SUCCESS,
      orderID: 1
    }) as AccountType

    if (!account) {
      await setTimeout(2000)
      continue
    }

    await fnCrawlData(account)
    await setTimeout(CRAWL_INTERVAL_MS)
  }
}

let lastKeepAliveAt = 0

/** Calls GetBalance at most once per KEEP_ALIVE_INTERVAL_MS. Returns false if the session is unusable. */
const keepAlive = async (account: AccountType, force = false) => {
  if (!force && Date.now() - lastKeepAliveAt < KEEP_ALIVE_INTERVAL_MS) return true

  lastKeepAliveAt = Date.now()
  return keepAliveFishBet88(port, account, isAccountActive)
}

const notifyProgress = (account: AccountType, message: string) =>
  logAndNotify(port, account, message, { strictMatch: STRICT_MATCH })

const notifyCrawlDone = () => {
  port.postMessage({ type: 'CrawlDone', platformName: PLATFORM.FISHBET88 })
}

const logProgram = (account: AccountType, message: string) =>
  accountLogToFile(account.platformName, account.loginID, message, 'Program')

const isCrawlCancelled = async (account: AccountType, gameType: string) => {
  if (!isAccountActive(account.id)) return true

  const currentGameType = (Setting.findAll() as SettingSchemaType[])[0]?.gameType
  if (currentGameType === gameType) return false

  await logProgram(account, 'GameType changed during crawl, stop processing.')
  await notifyProgress(account, 'GameType changed during crawl, stop processing.')
  return true
}

const finishWithMessage = async (account: AccountType, message: string) => {
  await logProgram(account, message)
  await notifyProgress(account, message)
  clearTable(PLATFORM.FISHBET88)
  notifyCrawlDone()
}

const fnCrawlData = async (account: AccountType) => {
  const settings = Setting.findAll() as SettingSchemaType[]
  if (!settings.length) return

  const gameType = settings[0].gameType
  if (!gameType || gameType === GAME_TYPES.NONE) {
    await keepAlive(account)
    return
  }

  const accountInfo = findActiveAccount(account.id)
  if (!accountInfo) return

  if (accountInfo.typeCrawl !== gameType) {
    await logProgram(account, 'GameType changed, refresh to sync.')
    await logAndNotify(port, account, 'GameType changed, check box refresh to sync.', {
      fields: { status: STATUS_ACCOUNT.EXIT }
    })
    clearTable(PLATFORM.FISHBET88)
    return
  }

  if (!(await keepAlive(account, true))) return

  const marketId = MARKET_ID_FISHBET88[gameType]
  if (marketId === undefined) {
    await finishWithMessage(account, `Soccer ${gameType}: not supported yet.`)
    return
  }

  const proxyAgent = buildProxyAgent(account)

  try {
    await logProgram(account, `Get Soccer ${gameType}...`)
    if (!(await notifyProgress(account, `Get Soccer ${gameType}...`))) return

    const timeFetchStart = Date.now()
    const rows = await getMatchesFishBet88(account, marketId, proxyAgent)
    if (await isCrawlCancelled(account, gameType)) return

    const matchIds = [...new Set(rows.map((row) => row.MatchID))]
    await logProgram(
      account,
      `Fetched ${matchIds.length} matches (${rows.length} rows, ${gameType}, ${Date.now() - timeFetchStart}ms).`
    )

    if (!matchIds.length) {
      await finishWithMessage(account, `Soccer ${gameType}: No data.`)
      return
    }

    // Running: API 1 (GetOtherSportOdds) already returns every line with Malay odds, so skip API 2
    // to keep each live cycle short and the odds fresh.
    if (gameType === GAME_TYPES.RUNNING) {
      await handleData(account, gameType, rows, matchIds.length)
      return
    }

    const stepOddsCal = await getStepOddsCal(account, proxyAgent)

    const timeDetailStart = Date.now()
    const detailRows = await fetchMatchDetails(account, gameType, matchIds, marketId, proxyAgent)
    if (!detailRows) return

    await logProgram(
      account,
      `Fetched ${detailRows.length} odds rows of ${matchIds.length} matches (${Date.now() - timeDetailStart}ms).`
    )

    await handleData(account, gameType, detailRows, matchIds.length, stepOddsCal)
  } catch (error) {
    // The odds feed is public (no token): a failure here is a network/feed issue, not a logged-out
    // session, so don't relogin (that would ask for a captcha). Retry on the next cycle.
    const message = error instanceof Error ? error.message : String(error)
    console.error('Error Crawl Data FishBet88:', message)
    await logProgram(account, `[ERROR] Crawl Data FishBet88: ${message}`)
    await notifyProgress(account, `[ERROR] Crawl Data FishBet88: ${message}`)
    clearTable(PLATFORM.FISHBET88)
  }
}

/**
 * Fetches every match's lines (API 2) in small batches. Matches whose request fails are skipped:
 * API 1 only has decimal odds, which don't match the Malay odds the site actually bets on.
 * Returns null when the crawl was cancelled or the session was lost.
 */
const fetchMatchDetails = async (
  account: AccountType,
  gameType: string,
  matchIds: number[],
  marketId: number,
  proxyAgent: ProxyAgent_FishBet88
) => {
  const detailRows: OddsRow_FishBet88[] = []
  let failedCount = 0

  for (let i = 0; i < matchIds.length; i += MATCH_DETAIL_CONCURRENCY) {
    if (await isCrawlCancelled(account, gameType)) return null
    if (!(await keepAlive(account))) return null

    const chunk = matchIds.slice(i, i + MATCH_DETAIL_CONCURRENCY)
    const results = await Promise.allSettled(
      chunk.map((matchId) => getMatchDetailFishBet88(account, matchId, marketId, proxyAgent))
    )

    for (const result of results) {
      if (result.status === 'fulfilled') detailRows.push(...result.value)
      else failedCount++
    }

    await notifyProgress(
      account,
      `Fetched match details ${Math.min(i + chunk.length, matchIds.length)}/${matchIds.length}...`
    )
  }

  if (failedCount) {
    await logProgram(account, `Fetch match details failed: ${failedCount}/${matchIds.length}.`)
  }

  return detailRows
}

/**
 * Today / Early are bet on the lobby STEP page, where every odds gets `SSportStepOddsCal` (e.g. -0.02).
 * Read it from the lobby session (cached per AccessToken) so the stored odds are the ones that can
 * really be bet. Falls back to 0 (raw feed odds) when the lobby can't be opened.
 */
const getStepOddsCal = async (account: AccountType, proxyAgent: ProxyAgent_FishBet88) => {
  try {
    const { stepOddsCal } = await getLobbySessionFishBet88(account, proxyAgent)
    return stepOddsCal
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await logProgram(account, `[WARN] Get SSportStepOddsCal failed, use raw odds: ${message}`)
    return 0
  }
}

const buildBase = (row: OddsRow_FishBet88, gameType: string) => {
  const nameLeague = row.LeagueName?.trim()
  const nameHome = row.HomeTeamName?.trim()
  const nameAway = row.AwayTeamName?.trim()
  if (!nameLeague || !nameHome || !nameAway) return null

  const standardHomeName = findStandardTeam({
    nameTeam: formatName(nameHome),
    nameLeague: formatName(nameLeague),
    platform: PLATFORM.FISHBET88
  }) as NameTeamType

  const standardAwayName = findStandardTeam({
    nameTeam: formatName(nameAway),
    nameLeague: formatName(nameLeague),
    platform: PLATFORM.FISHBET88
  }) as NameTeamType

  const kickOff = parseDotNetDate(row.KickOffDateTime)
  const isRunning = gameType === GAME_TYPES.RUNNING

  return {
    gameType,
    platform: PLATFORM.FISHBET88,
    idLeague: row.LeagueID,
    nameLeague,
    idEvent: row.MatchID,
    nameHome,
    nameAway,
    isHomeStrong: Number(row.FTFav === 1),
    league: standardHomeName?.league || nameLeague,
    home: standardHomeName?.team || nameHome,
    away: standardAwayName?.team || nameAway,
    date: kickOff?.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }) ?? null,
    time: kickOff?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) ?? null,
    score: isRunning ? `${row.HomeScore ?? 0}-${row.AwayScore ?? 0}` : null,
    redCard: isRunning ? `${row.HomeRedCard ?? 0}-${row.AwayRedCard ?? 0}` : null,
    stat: isRunning ? buildLiveStat(row) : null
  }
}

const handleData = async (
  account: AccountType,
  gameType: string,
  rows: OddsRow_FishBet88[],
  matchesCount: number,
  stepOddsCal = 0
) => {
  if (await isCrawlCancelled(account, gameType)) return

  const timeStart = Date.now()
  // Today / Early are bet on the STEP page: feed odds -> real lobby odds -> + SSportStepOddsCal.
  const isStep = gameType !== GAME_TYPES.RUNNING
  const convertOdd = (malay: number) =>
    isStep ? toStepMalayOdds(toStepRealOdds(malay), stepOddsCal) : malay
  const records = rows.flatMap((row) => {
    const base = buildBase(row, gameType)
    return base ? mapOddsRowToRecords(row, base, convertOdd) : []
  })
  const recordsCount = records.length

  clearTable(PLATFORM.FISHBET88)
  if (recordsCount) {
    insertRecords(records, createModel(PLATFORM.FISHBET88, dataCrawlByPlatformSchema))
  }
  notifyCrawlDone()

  const message = `Handle Data Odds Done All. (${recordsCount} odds, ${matchesCount} matches, stepOddsCal ${stepOddsCal}, ${Date.now() - timeStart}ms)`
  await logProgram(account, message)
  await notifyProgress(account, message)
}
