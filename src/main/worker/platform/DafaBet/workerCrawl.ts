/* eslint-disable no-constant-condition */
import { setTimeout } from 'timers/promises'
import { parentPort } from 'worker_threads'

import { Account, clearTable, createModel, Setting } from '@db/model'
import dataCrawlByPlatformSchema from '@db/schema/dataCrawlByPlatform'
import { SettingSchemaType } from '@db/schema/setting'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch, { RequestInit } from 'node-fetch'

import { GAME_TYPES } from '@shared/common/constants'
import { AccountType } from '@shared/common/types'
import { OPTIONS_PROXY, STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { isAccountActive } from '@/worker/lib/checkAccount'
import { convertHdpPoint } from '@/worker/lib/convertHdpPoint'
import { logAndNotify, logAndTriggerRelogin, logCrawlError } from '@/worker/lib/exitAccountWithLog'
import { findActiveAccount } from '@/worker/lib/findActiveAccount'
import { findStandardTeam } from '@/worker/lib/findStandardTeam'
import { formatName } from '@/worker/lib/formatName'
import { insertRecords } from '@/worker/lib/insertRecords'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { systemLogToFile } from '@/worker/lib/systemLogToFile'
import { getBalanceDafaBet } from '@/worker/platform/DafaBet/actions/getBalance'
import {
  buildHeadersCoupons,
  buildHeadersEvents,
  buildHeadersLiveEvents
} from '@/worker/platform/DafaBet/common/contants'
import { CouponsResponse_DafaBet, EventItem_DafaBet } from '@/worker/platform/DafaBet/common/types'
import {
  buildCouponsUrl,
  buildEventsDateRange,
  buildEventsPayload,
  buildEventsUrl,
  buildHdpPoint,
  buildLiveEventsUrl,
  buildLiveRedCard,
  buildLiveScore,
  buildLiveStat,
  convertDecimalToMalay,
  getMarketOddInfo,
  getVnDateKey
} from '@/worker/platform/DafaBet/helper'
import { PLATFORM } from '@/worker/platform/platform.config'

const TEMP_COUPON_ID = 628
const STRICT_MATCH = { orderID: 1, platformName: PLATFORM.DAFABET }

const port = parentPort
if (!port) throw new Error('IllegalState')

port.on('message', async (action: string) => {
  if (action == 'Start') {
    try {
      await handleCrawlData()
    } catch (error) {
      await systemLogToFile(`Error Handle Crawl Data DafaBet: ${JSON.stringify(error)}`, 'Error')
    }
  }
})

const handleCrawlData = async () => {
  while (true) {
    const account = Account.findOne({
      platformName: PLATFORM.DAFABET,
      status: STATUS_ACCOUNT.LOGOUT,
      statusLogin: STATUS_LOGIN.SUCCESS,
      orderID: 1
    }) as AccountType

    if (!account) {
      await setTimeout(2000)
      continue
    }

    await fnCrawlData(account)
    await setTimeout(5000)
  }
}

const buildProxyAgent = (account: AccountType) => {
  const { status, data } = isProxyConfigValid(account)
  if (!status || account.proxyScope === OPTIONS_PROXY.NONE) return undefined

  const { newIpAddress, newPort, newUsername, newPassword } = data
  return new HttpsProxyAgent(`http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`)
}

const fetchJson = async <T>(
  url: string,
  init: RequestInit,
  account: AccountType,
  proxyAgent?: HttpsProxyAgent<string>
): Promise<T> => {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init.headers as Record<string, string>), Cookie: account.cookie },
    ...(proxyAgent && { agent: proxyAgent })
  })

  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} - ${url}`)

  return (await res.json()) as T
}

const notifyCrawlDone = () => {
  port.postMessage({
    type: 'CrawlDone',
    platformName: PLATFORM.DAFABET
  })
}

const notifyProgress = (account: AccountType, message: string) =>
  logAndNotify(port, account, message, { strictMatch: STRICT_MATCH })

const isGameTypeUnchanged = (gameType: string) => {
  const currentSettings = Setting.findAll() as SettingSchemaType[]
  return currentSettings[0]?.gameType === gameType
}

const finishWithNoData = async (account: AccountType, gameType: string) => {
  await accountLogToFile(
    account.platformName,
    account.loginID,
    `Soccer ${gameType}: No data.`,
    'Program'
  )
  await notifyProgress(account, `Soccer ${gameType}: No data.`)
  clearTable(PLATFORM.DAFABET)
  notifyCrawlDone()
}

const fetchLiveEvents = async (account: AccountType, proxyAgent?: HttpsProxyAgent<string>) => {
  const data = await fetchJson<EventItem_DafaBet[]>(
    buildLiveEventsUrl(),
    { method: 'GET', headers: buildHeadersLiveEvents(account) },
    account,
    proxyAgent
  )

  return Array.isArray(data) ? data : []
}

const fetchPreMatchEvents = async (account: AccountType, proxyAgent?: HttpsProxyAgent<string>) => {
  const coupons = await fetchJson<CouponsResponse_DafaBet>(
    buildCouponsUrl(TEMP_COUPON_ID),
    { method: 'GET', headers: buildHeadersCoupons(account) },
    account,
    proxyAgent
  )

  const eventPathIds = coupons?.event_path_ids ?? []
  if (!eventPathIds.length) return []

  const eventPathIdsStr = eventPathIds.join(',')

  const dateRange = buildEventsDateRange()
  const headers = buildHeadersEvents(account)

  if (!isAccountActive(account.id)) return null

  const url = buildEventsUrl()
  const body = JSON.stringify(buildEventsPayload(eventPathIdsStr, 1, dateRange))

  const events = await fetchJson<EventItem_DafaBet[]>(
    url,
    {
      method: 'POST',
      headers,
      body
    },
    account,
    proxyAgent
  )

  if (!Array.isArray(events) || !events.length) return []

  await notifyProgress(account, `Fetched ${events.length} events...`)

  return events
}

const fnCrawlData = async (account: AccountType) => {
  const settings = Setting.findAll() as SettingSchemaType[]
  if (!settings.length) return

  const gameType = settings[0].gameType
  if (!gameType || gameType === GAME_TYPES.NONE) return

  const accountInfo = findActiveAccount(account.id)
  if (!accountInfo) return

  if (accountInfo.typeCrawl !== gameType) {
    await accountLogToFile(
      account.platformName,
      account.loginID,
      'GameType changed, refresh to sync.',
      'Program'
    )
    await logAndNotify(port, account, 'GameType changed, check box refresh to sync.', {
      fields: { status: STATUS_ACCOUNT.EXIT }
    })

    clearTable(PLATFORM.DAFABET)
    return
  }

  const { ErrorCode, Message, cashBalance, outstanding, givenCredit, credit, currency } =
    await getBalanceDafaBet(account)

  if (ErrorCode !== 0) {
    await logAndTriggerRelogin(port, account, `Get balance failed: ${Message}`, {
      clearTablePlatform: PLATFORM.DAFABET
    })
    return
  }

  const balanceUpdated = await logAndNotify(
    port,
    account,
    `Balance updated: ${cashBalance} ${currency}`,
    { fields: { cashBalance, outstanding, givenCredit, credit, currency } }
  )
  if (!balanceUpdated) return

  const proxyAgent = buildProxyAgent(account)

  try {
    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Get Soccer ${gameType}...`,
      'Program'
    )
    if (!(await notifyProgress(account, `Get Soccer ${gameType}...`))) return

    const timeFetchStart = Date.now()
    const dataEvents =
      gameType === GAME_TYPES.RUNNING
        ? await fetchLiveEvents(account, proxyAgent)
        : await fetchPreMatchEvents(account, proxyAgent)

    if (!dataEvents) return

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Fetched ${dataEvents.length} events (${gameType}, ${Date.now() - timeFetchStart}ms).`,
      'Program'
    )

    if (!dataEvents.length) {
      await finishWithNoData(account, gameType)
      return
    }

    await handleData({ dataEvents, account, gameType })
  } catch (error) {
    await logCrawlError(port, account, error, 'Crawl Data DafaBet', {
      clearTablePlatform: PLATFORM.DAFABET
    })
  }
}

const isEventInGameType = (event: EventItem_DafaBet, gameType: string, todayKey: string) => {
  if (gameType === GAME_TYPES.RUNNING) return true

  const eventKey = getVnDateKey(new Date(event.eventDate))
  return gameType === GAME_TYPES.EARLY ? eventKey !== todayKey : eventKey === todayKey
}

const mapEventToRecords = (event: EventItem_DafaBet, gameType: string) => {
  const records: Record<string, unknown>[] = []

  const country = event.eventPaths?.[1]
  const league = event.eventPaths?.[2]
  const [homeOpponent, awayOpponent] = event.opponents ?? []

  const nameLeague = `${country?.description ?? ''} - ${league?.description ?? ''}`
  const nameHome = homeOpponent?.description ?? ''
  const nameAway = awayOpponent?.description ?? ''

  if (!country?.description || !league?.description || !nameHome || !nameAway) return records

  const standardHomeName = findStandardTeam({
    nameTeam: formatName(nameHome),
    nameLeague: formatName(nameLeague),
    platform: PLATFORM.DAFABET
  })

  const standardAwayName = findStandardTeam({
    nameTeam: formatName(nameAway),
    nameLeague: formatName(nameLeague),
    platform: PLATFORM.DAFABET
  })

  const dateEvent = new Date(event.eventDate)
  const isRunning = gameType === GAME_TYPES.RUNNING

  const base = {
    gameType,
    platform: PLATFORM.DAFABET,
    idLeague: league?.id ?? 0,
    nameLeague,
    idEvent: event.id,
    nameHome,
    nameAway,
    league: standardHomeName?.league || nameLeague,
    home: standardHomeName?.team || nameHome,
    away: standardAwayName?.team || nameAway,
    date: dateEvent.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
    time: dateEvent.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    score: isRunning ? buildLiveScore(event, homeOpponent?.id, awayOpponent?.id) : null,
    redCard: isRunning ? buildLiveRedCard(event, homeOpponent?.id, awayOpponent?.id) : null,
    stat: isRunning ? buildLiveStat(event) : null
  }

  for (const market of event.markets ?? []) {
    const oddInfo = getMarketOddInfo(market)
    if (!oddInfo) continue

    const [homeOutcome, awayOutcome] = market.outcomes ?? []
    if (!homeOutcome || !awayOutcome) continue

    const hdpPoint = buildHdpPoint(homeOutcome)

    records.push({
      ...base,
      number: oddInfo.number,
      type: oddInfo.type,
      typeOdd: oddInfo.typeOdd,
      altLineId: market.id,
      betType: market.marketTypeId ?? null,
      marketSelectionId_home_over: homeOutcome.id,
      marketSelectionId_away_under: awayOutcome.id,
      hdp_point: hdpPoint,
      HDP: convertHdpPoint(hdpPoint),
      home_over: convertDecimalToMalay(homeOutcome.consolidatedPrice.currentPrice.decimal),
      away_under: convertDecimalToMalay(awayOutcome.consolidatedPrice.currentPrice.decimal)
    })
  }

  return records
}

const handleData = async ({
  dataEvents,
  account,
  gameType
}: {
  dataEvents: EventItem_DafaBet[]
  account: AccountType
  gameType: string
}) => {
  if (!isAccountActive(account.id)) return

  if (!isGameTypeUnchanged(gameType)) {
    await accountLogToFile(
      account.platformName,
      account.loginID,
      'GameType changed during crawl, stop processing.',
      'Program'
    )
    await notifyProgress(account, 'GameType changed during crawl, stop processing.')
    return
  }

  const eventsLength = dataEvents.length
  const timeStart = Date.now()

  await notifyProgress(account, `Processing ${eventsLength} Soccer events...`)

  const todayKey = getVnDateKey(new Date())
  const filteredEvents = dataEvents.filter((event) => isEventInGameType(event, gameType, todayKey))
  const records = filteredEvents.flatMap((event) => mapEventToRecords(event, gameType))
  const recordsCount = records.length

  clearTable(PLATFORM.DAFABET)
  if (recordsCount) {
    insertRecords(records, createModel(PLATFORM.DAFABET, dataCrawlByPlatformSchema))
  }
  notifyCrawlDone()

  const message = `Handle Data Odds Done All. (${recordsCount} odds, ${filteredEvents.length}/${eventsLength} events, ${Date.now() - timeStart}ms)`
  await accountLogToFile(account.platformName, account.loginID, message, 'Program')
  await notifyProgress(account, message)
}
