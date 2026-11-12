/* eslint-disable no-constant-condition */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { setTimeout } from 'timers/promises'
import { parentPort } from 'worker_threads'

import Model, {
  Account,
  clearTable,
  createModel,
  EventSbobet,
  LeagueSbobet,
  NameLeague,
  Setting
} from '@db/model'
import dataCrawlByPlatformSchema from '@db/schema/dataCrawlByPlatform'
import { EventSbobetType } from '@db/schema/eventSbobet'
import { SettingSchemaType } from '@db/schema/setting'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'

import { CONVERT_HDP, GAME_TYPES } from '@shared/common/constants'
import { SPREAD, TOTAL } from '@shared/common/constants'
import { AccountType, DataCrawlType, LeagueType, NameLeagueType } from '@shared/common/types'
import { OPTIONS_PROXY, STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { isAccountActive } from '@/worker/lib/checkAccount'
import { logAndNotify, logAndTriggerRelogin } from '@/worker/lib/exitAccountWithLog'
import { findStandardTeam } from '@/worker/lib/findStandardTeam'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { systemLogToFile } from '@/worker/lib/systemLogToFile'
import { toPositiveNumber } from '@/worker/lib/toPositiveNumber'
import { PLATFORM } from '@/worker/platform/platform.config'
import { getBalanceSbobet } from '@/worker/platform/Sbobet/actions/getBalance'
import { SBO_CONFIG, SBO_CONFIG_TYPE_ODD } from '@/worker/platform/Sbobet/common/constants'
import {
  checkCloudflare,
  getDataPreset,
  getMatchMinute,
  parseGraphQLResponse
} from '@/worker/platform/Sbobet/helper'

let gameType: string | null = null

const port = parentPort
if (!port) throw new Error('IllegalState')

port.on('message', async (action: string) => {
  if (action == 'Start') {
    try {
      await handleCrawlData()
    } catch (error) {
      await systemLogToFile(`Error Handle Crawl Data Sbobet: ${JSON.stringify(error)}`, 'Error')
    }
  }
})

const handleCrawlData = async () => {
  while (true) {
    const account = Account.findOne({
      platformName: PLATFORM.SBOBET,
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
    clearTable('EventSbobet')
    clearTable('LeagueSbobet')
    clearTable(PLATFORM.SBOBET)
  }
}
const fnCrawlData = async (account: AccountType) => {
  const settings = Setting.findAll() as SettingSchemaType[]
  if (!settings.length) return

  gameType = settings[0].gameType
  if (!gameType || gameType === 'None') return

  await logAndNotify(port, account, `Data Scraping In Progress... (${gameType})`)

  const accountRefresh = Account.findOne({
    id: account.id,
    orderID: 1,
    status: STATUS_ACCOUNT.LOGOUT,
    statusLogin: STATUS_LOGIN.SUCCESS
  }) as AccountType
  if (!accountRefresh) return

  if (accountRefresh.typeCrawl !== gameType) {
    await logAndNotify(port, account, 'GameType changed, check box refresh to sync.', {
      fields: { status: STATUS_ACCOUNT.EXIT }
    })

    clearTable(PLATFORM.SBOBET)
    return
  }

  const { status, data } = isProxyConfigValid(account)
  const { newIpAddress, newPort, newUsername, newPassword } = data
  const proxyUrl =
    status && account.proxyScope !== OPTIONS_PROXY.NONE
      ? `http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`
      : undefined

  const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

  const { ErrorCode, Message, credit, cashBalance, outstanding, givenCredit, currency } =
    (await getBalanceSbobet(account)) as any

  if (ErrorCode != 0) {
    await logAndTriggerRelogin(port, account, `Get balance failed: ${Message}`)

    return
  }
  await logAndNotify(port, account, `Balance updated: ${credit} ${currency}`, {
    fields: { credit, cashBalance, outstanding, givenCredit, currency }
  })

  try {
    const timeStart = new Date().getTime()
    await logAndNotify(port, account, `Get Soccer ${gameType}...`)

    const fetchTokenUrl = `${account.host}${SBO_CONFIG.FETCH_TOKEN}`
    const headersGetToken = {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
      Connection: 'keep-alive',
      'Content-Length': '0',
      Referer: account.host,
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      Cookie: account.cookie,
      ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
    }

    const resToken = await fetch(fetchTokenUrl, {
      method: 'GET',
      headers: headersGetToken,
      ...(proxyAgent && { agent: proxyAgent })
    })

    const tokenData = await resToken.json()
    const authToken = tokenData.authToken
    const oddsToken = tokenData.oddsToken

    const headers = {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
      authorization: authToken,
      'content-type': 'application/json',
      referer: account.host,
      'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
    }

    const DataPreset = getDataPreset(gameType)
    if (Object.keys(DataPreset).length === 0) return

    const variablesString = encodeURIComponent(
      JSON.stringify({
        query: {
          sport: 'Soccer',
          filter: DataPreset,
          oddsCategory: 'All',
          eventIds: [],
          tournamentIds: [],
          tournamentNames: [],
          timeZone: 'UTC__4'
        }
      })
    )

    const fetchEventsQuery = `${new URL(SBO_CONFIG.FETCH_EVENT)}?operationName=EventsQuery&variables=${variablesString}&extensions=${encodeURIComponent(
      JSON.stringify({
        persistedQuery: {
          version: 1,
          sha256Hash: SBO_CONFIG.SHA256_HASH_EVENTS_QUERY
        }
      })
    )}`

    const fetchEventResultsQuery = `${new URL(SBO_CONFIG.FETCH_EVENT)}?operationName=EventResultsQuery&variables=${variablesString}&extensions=${encodeURIComponent(
      JSON.stringify({
        persistedQuery: {
          version: 1,
          sha256Hash: SBO_CONFIG.SHA256_HASH_EVENTS_RESULTS_QUERY
        }
      })
    )}`

    const fetchOptions = {
      method: 'GET',
      headers,
      ...(proxyAgent && { agent: proxyAgent })
    }

    const [resEventsQuery, resEventResultsQuery] = await Promise.all([
      fetch(fetchEventsQuery, fetchOptions),
      fetch(fetchEventResultsQuery, fetchOptions)
    ])

    await checkCloudflare(resEventsQuery, account)
    await checkCloudflare(resEventResultsQuery, account)

    const parsedEventsQuery = await parseGraphQLResponse(resEventsQuery, 'EventsQuery')
    if (parsedEventsQuery.error) throw parsedEventsQuery.error

    const dataSbobet = parsedEventsQuery
    const parsedEventResultsQuery = await parseGraphQLResponse(
      resEventResultsQuery,
      'EventResultsQuery'
    )
    if (parsedEventResultsQuery.error) throw parsedEventResultsQuery.error
    const dataSbobetEvent = parsedEventResultsQuery

    if (dataSbobet?.data?.events?.length === 0) return
    if (dataSbobetEvent?.data?.events?.length === 0) return

    const hasLeagueData = await handleDataLeague({ dataSbobet, account })
    if (hasLeagueData) {
      await handleDataSbobetEvent({ dataSbobetEvent, account })
      await handleDataSbobetOdds({ dataSbobetEvent, account, oddsToken, authToken, proxyAgent })
    }

    const settings = Setting.findAll() as SettingSchemaType[]
    if (gameType != settings[0].gameType) return

    port.postMessage({
      type: 'CrawlDone',
      platformName: PLATFORM.SBOBET
    })

    const timeEnd = new Date().getTime()
    await logAndNotify(port, account, `Handle Data Sbobet Done. (${timeEnd - timeStart}ms)`)
  } catch (error) {
    const errorMessage =
      'Unable to connect to the server. Please check your network connection or try again later.'
    const message = error instanceof Error ? error.message : errorMessage

    console.error('Error Crawl Data Sbobet:', message)

    await logAndTriggerRelogin(port, account, `[ERROR] Crawl Data Sbobet: ${message}`, {
      clearTablePlatform: PLATFORM.SBOBET
    })

    return
  }
}

const checkGameType = () => {
  const settingInfo = Setting.findAll()
  const currentGameType = settingInfo[0]?.gameType

  if (!currentGameType || gameType !== currentGameType) {
    clearTable('PerMatchLimit')
    clearTable(PLATFORM.SBOBET)
    return false
  }

  return true
}

const insertRecords = (records: any, Sbobet: Model) => {
  Sbobet.insertMany(records)
  records.length = 0
}

const handleDataLeague = async ({ dataSbobet, account }) => {
  await logAndNotify(port, account, `Start Handle Data League... (${gameType})`)

  const Sbobet = createModel('Sbobet', dataCrawlByPlatformSchema)
  const timeStart = new Date().getTime()

  const filteredEvents = dataSbobet.data.events.filter((event) => {
    const tournamentName = event.tournament.tournamentName[0].value.toLowerCase()
    return !tournamentName.includes('e-') && !tournamentName.includes('corners')
  })

  if (!filteredEvents.length) {
    await logAndNotify(port, account, `Soccer ${gameType}: No data.`, {
      strictMatch: { orderID: 1, platformName: PLATFORM.SBOBET }
    })

    return false
  }

  const eventsLength = filteredEvents.length

  for (const event of filteredEvents) {
    if (!isAccountActive(account.id)) return false
    if (!checkGameType()) {
      await logAndNotify(port, account, 'GameType changed during crawl, stop processing.')
      return false
    }

    const tournament = event.tournament
    const tournamentId = tournament.id
    const tournamentName = tournament.tournamentName[0].value

    let leagueSbobetData = LeagueSbobet.findOne({ idLeague: tournamentId }) as LeagueType

    if (!leagueSbobetData) {
      const dataLeagueSbobet = NameLeague.findAll({ platform: 'Sbobet' }) as NameLeagueType[]
      const standardLeagueName = dataLeagueSbobet.find(
        (leagueSbobet) => leagueSbobet.nameLeague === tournamentName
      )

      const newLeague = {
        idLeague: tournamentId,
        nameLeague: tournamentName,
        league: standardLeagueName?.league || tournamentName
      }

      LeagueSbobet.create(newLeague)
      leagueSbobetData = newLeague as LeagueType
    }
    const existingEvent = EventSbobet.findOne({ idEvent: event.id }) as EventSbobetType

    if (existingEvent) {
      const updatedFields: Partial<EventSbobetType> = {}
      const newHomeScore = event.mainMarketEventResult?.extraInfo?.homeScore ?? 0
      const newAwayScore = event.mainMarketEventResult?.extraInfo?.awayScore ?? 0
      const newPeriod = event.mainMarketEventResult?.extraInfo?.period ?? 1
      updatedFields.livetimer = getMatchMinute(
        event.mainMarketEventResult?.extraInfo?.periodStartTime,
        event.mainMarketEventResult?.extraInfo?.period
      )
      if (existingEvent.livehomescore !== newHomeScore) {
        updatedFields.livehomescore = newHomeScore
      }

      if (existingEvent.liveawayscore !== newAwayScore) {
        updatedFields.liveawayscore = newAwayScore
      }

      if (existingEvent.liveperiod !== newPeriod) {
        updatedFields.liveperiod = newPeriod
      }

      const ishtValue = newPeriod === 1 && event.isLive === false ? 'HT' : ''
      if (existingEvent.isht !== ishtValue) {
        updatedFields.isht = ishtValue
      }

      const nameHome = event.homeTeam.teamName.find((n) => n.language === 'EN')?.value ?? ''
      const nameAway = event.awayTeam.teamName.find((n) => n.language === 'EN')?.value ?? ''

      if (existingEvent.nameHome !== nameHome) {
        updatedFields.nameHome = nameHome
      }

      if (existingEvent.nameAway !== nameAway) {
        updatedFields.nameAway = nameAway
      }

      if (existingEvent.nameLeague !== leagueSbobetData?.nameLeague) {
        updatedFields.nameLeague = leagueSbobetData?.nameLeague ?? ''
      }

      if (existingEvent.league !== leagueSbobetData?.league) {
        updatedFields.league = leagueSbobetData?.league ?? ''
      }

      if (Object.keys(updatedFields).length > 0) {
        EventSbobet.update({ idEvent: event.id }, updatedFields)
      }
    } else {
      const leagueSbobet = leagueSbobetData as LeagueType
      const [standardHomeName, standardAwayName] = [
        findStandardTeam({
          nameTeam: event?.homeTeam?.teamName.find((n) => n.language === 'EN')?.value.trim(),
          nameLeague: leagueSbobet.nameLeague,
          platform: 'Sbobet'
        }),
        findStandardTeam({
          nameTeam: event?.awayTeam?.teamName.find((n) => n.language === 'EN')?.value.trim(),
          nameLeague: leagueSbobet.nameLeague,
          platform: 'Sbobet'
        })
      ]

      const nameHome = event.homeTeam.teamName.find((n) => n.language === 'EN')?.value ?? ''
      const nameAway = event.awayTeam.teamName.find((n) => n.language === 'EN')?.value ?? ''
      const showTime = event.showTime

      const newEvent = {
        idEvent: event.id,
        nameLeague: leagueSbobet.nameLeague ?? '',
        league: leagueSbobet.league ?? '',
        nameHome,
        nameAway,
        home: standardHomeName?.team || nameHome,
        away: standardAwayName?.team || nameAway,
        showTime,
        idLeague: leagueSbobet.idLeague ?? tournamentId,
        liveawayscore: event.mainMarketEventResult?.extraInfo?.awayScore ?? 0,
        livehomescore: event.mainMarketEventResult?.extraInfo?.homeScore ?? 0,
        livetimer: getMatchMinute(
          event.mainMarketEventResult?.extraInfo?.periodStartTime,
          event.mainMarketEventResult?.extraInfo?.period
        ),
        liveHandicapType: event.mainMarketEventResult?.liveHandicapType,
        nonLiveHandicapType: event.mainMarketEventResult?.nonLiveHandicapType,
        awayred: null,
        homered: null,

        liveperiod: event.mainMarketEventResult?.extraInfo?.period ?? 1,
        isht:
          event.mainMarketEventResult?.extraInfo?.period === 1 && event.isLive === false ? 'HT' : ''
      }
      Sbobet.delete({ idEvent: event.id })
      EventSbobet.create(newEvent)
    }
  }

  if (!isAccountActive(account.id) || !checkGameType()) return false

  const timeEnd = new Date().getTime()
  await logAndNotify(
    port,
    account,
    `Handle Data League Done. (${eventsLength}, ${timeEnd - timeStart}ms)`
  )

  return true
}

const handleDataSbobetEvent = async ({ dataSbobetEvent, account }) => {
  await logAndNotify(port, account, `Start Handle Data Events... (${gameType})`)

  const timeStart = new Date().getTime()
  const eventsLength = dataSbobetEvent.data.events.length

  for (const event of dataSbobetEvent.data.events) {
    if (!isAccountActive(account.id)) return
    if (!checkGameType()) {
      await logAndNotify(port, account, 'GameType changed during crawl, stop processing.')
      return
    }
    const existingEvent = EventSbobet.findOne({ idEvent: event.id }) as EventSbobetType
    if (existingEvent) {
      const updatedFields: Partial<EventSbobetType> = {}
      const scoreResult = Array.isArray(event?.eventResults)
        ? event?.eventResults.find((result) => result.marketGroup?.id === 0)
        : null

      if (scoreResult) {
        const liveHomeScore = scoreResult.liveHomeScore
        const liveAwayScore = scoreResult.liveAwayScore

        const newHomeRedCards = scoreResult.extraInfo?.homeRedCards ?? 0
        const newAwayRedCards = scoreResult.extraInfo?.awayRedCards ?? 0

        if (existingEvent.livehomescore !== liveHomeScore) {
          updatedFields.livehomescore = liveHomeScore
        }

        if (existingEvent.liveawayscore !== liveAwayScore) {
          updatedFields.liveawayscore = liveAwayScore
        }

        if (existingEvent.awayred !== newAwayRedCards) {
          updatedFields.awayred = newAwayRedCards
        }

        if (existingEvent.homered !== newHomeRedCards) {
          updatedFields.homered = newHomeRedCards
        }

        if (Object.keys(updatedFields).length > 0) {
          EventSbobet.update({ idEvent: event.id }, updatedFields)
        }
      }
    }
  }

  if (!isAccountActive(account.id) || !checkGameType()) return
  const timeEnd = new Date().getTime()
  await logAndNotify(
    port,
    account,
    `Handle Data Event Done. (${eventsLength}, ${timeEnd - timeStart}ms)`
  )
}

const handleDataSbobetOdds = async ({
  dataSbobetEvent,
  account,
  oddsToken,
  authToken,
  proxyAgent
}) => {
  await logAndNotify(port, account, `Start Handle Data Odds... (${gameType})`)

  const Sbobet = createModel('Sbobet', dataCrawlByPlatformSchema)
  const BATCH_SIZE: number = 50
  const records: any[] = []

  const timeStart = new Date().getTime()
  let eventsLength = dataSbobetEvent.data.events.length

  for (const event of dataSbobetEvent.data.events) {
    const settings = Setting.findAll() as SettingSchemaType[]
    if (gameType != settings[0].gameType) {
      await logAndNotify(port, account, 'GameType changed during crawl, stop processing.')
      return
    }

    const timeStart = new Date().getTime()
    eventsLength--

    if (!isAccountActive(account.id)) return
    if (!checkGameType()) {
      await logAndNotify(port, account, 'GameType changed during crawl, stop processing.')
      return
    }

    const presetFilter = gameType === 'Running' ? 'Live' : 'NonLive'
    const variablesString = encodeURIComponent(
      JSON.stringify({
        query: {
          id: event.id,
          filter: presetFilter,
          marketGroupIds: SBO_CONFIG.MARKET_GROUP_IDS,
          excludeMarketGroupIds: null,
          oddsCategory: 'All',
          priceStyle: 'Malay',
          oddsToken: oddsToken
        }
      })
    )
    const headers = {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
      authorization: authToken,
      'content-type': 'application/json',
      referer: account.host,
      'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      Cookie: 'INGRESSCOOKIE=' + account.cookie,
      ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
    }
    const fetchResultUrl = `${new URL(SBO_CONFIG.FETCH_EVENT)}?operationName=OddsQuery&variables=${variablesString}&extensions=${encodeURIComponent(
      JSON.stringify({
        persistedQuery: {
          version: 1,
          sha256Hash: SBO_CONFIG.SHA256_HASH_ODDS_QUERY
        }
      })
    )}`

    const resOddsQuery = await fetch(fetchResultUrl, {
      method: 'GET',
      headers: headers,
      ...(proxyAgent && { agent: proxyAgent })
    })

    await checkCloudflare(resOddsQuery, account)

    const parsedOddsQuery = await parseGraphQLResponse(resOddsQuery, 'OddsQuery')
    if (parsedOddsQuery.error) throw parsedOddsQuery.error
    const dataSbobet = parsedOddsQuery

    if (dataSbobet?.errors?.some((e) => e.extensions?.code === 'UNAUTHENTICATED')) {
      await logAndTriggerRelogin(port, account, 'Session unauthenticated, triggering re-login.')
      return
    }

    const matchInfo = (await EventSbobet.findOne({
      idEvent: event.id
    })) as any

    if (!matchInfo?.league) continue
    Sbobet.delete({ idEvent: event.id })
    for (const oddsEvent of dataSbobet.data.eventOdds) {
      if (
        !oddsEvent.marketType.includes('Handicap') &&
        !oddsEvent.marketType.includes('OverUnder')
      ) {
        continue
      }
      let checkField = ''
      if (presetFilter === 'Live') {
        checkField = matchInfo.liveHandicapType
      } else {
        checkField = matchInfo.nonLiveHandicapType
      }
      const oddsOffset =
        gameType === GAME_TYPES.TODAY || gameType === GAME_TYPES.RUNNING ? 0.02 : 0.01

      let hdp_point = 0
      if (checkField === 'Away' && oddsEvent.point < 0) {
        hdp_point = Math.abs(oddsEvent.point)
      } else {
        hdp_point = oddsEvent.point * -1
      }

      const findTicket = Sbobet.findOne({
        altLineId: oddsEvent?.id
      }) as DataCrawlType

      if (!findTicket) {
        const dateObj = new Date(matchInfo.showTime)
        const date = dateObj.toLocaleDateString('en-US', {
          day: '2-digit',
          month: '2-digit'
        })

        const time = dateObj.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })

        const dataSave = {
          gameType,
          date,
          time,
          platform: 'Sbobet',
          idLeague: matchInfo?.idLeague ?? '',
          nameLeague: matchInfo?.nameLeague ?? '',
          idEvent: event?.id,
          nameHome: matchInfo?.nameHome,
          nameAway: matchInfo?.nameAway,
          number: oddsEvent.marketType.includes('FH') ? 1 : 0,
          altLineId: oddsEvent.id,
          hdp_point: oddsEvent.marketType.includes('Handicap') ? hdp_point : Math.abs(hdp_point),
          home_over:
            Number(oddsEvent.prices[0].price) == -1
              ? Number(oddsEvent.prices[0].price) * -1 - oddsOffset
              : Number(oddsEvent.prices[0].price) - oddsOffset,
          away_under:
            Number(oddsEvent.prices[1].price) == -1
              ? Number(oddsEvent.prices[1].price) * -1 - oddsOffset
              : Number(oddsEvent.prices[1].price) - oddsOffset,
          redCard:
            gameType == GAME_TYPES.RUNNING
              ? `${matchInfo?.homered ?? 0}-${matchInfo?.awayred ?? 0}`
              : null,
          score:
            gameType == GAME_TYPES.RUNNING
              ? `${matchInfo?.livehomescore ?? 0}-${matchInfo?.liveawayscore ?? 0}`
              : null,
          stat: matchInfo.livetimer ?? '',
          typeOdd: oddsEvent.marketType.includes('Handicap') ? SPREAD : TOTAL,
          type: oddsEvent.marketType.includes('Handicap') ? 'HDP' : 'OU',
          bettype: oddsEvent.isLive ? 1 : 0,
          HDP: CONVERT_HDP[toPositiveNumber(Math.abs(oddsEvent.point))],
          specialOdd: SBO_CONFIG_TYPE_ODD[oddsEvent.marketType],
          league: matchInfo.league,
          home: matchInfo.home,
          away: matchInfo.away
        }

        records.push(dataSave)
        if (records.length >= BATCH_SIZE) {
          insertRecords(records, Sbobet)
        }
      }

      if (records.length > 0) {
        insertRecords(records, Sbobet)
      }
    }

    port.postMessage({
      type: 'CrawlDone',
      platformName: PLATFORM.SBOBET
    })
    const timeEnd = new Date().getTime()

    await logAndNotify(
      port,
      account,
      `Handle Data Odds Done. (${eventsLength}, ${timeEnd - timeStart}ms)`
    )
  }

  if (!isAccountActive(account.id) || !checkGameType()) return
  const timeEnd = new Date().getTime()
  await logAndNotify(
    port,
    account,
    `Handle Data Odds Done All. (${eventsLength}, ${timeEnd - timeStart}ms)`
  )
}
