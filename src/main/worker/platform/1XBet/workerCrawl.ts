/* eslint-disable no-constant-condition */
import { setTimeout } from 'timers/promises'
import { parentPort } from 'worker_threads'

import { Account, clearTable, createModel, RecordData, Setting } from '@db/model'
import dataCrawlByPlatformSchema from '@db/schema/dataCrawlByPlatform'
import { SettingSchemaType } from '@db/schema/setting'
import { HttpsProxyAgent } from 'https-proxy-agent'

import { GAME_TYPES } from '@shared/common/constants'
import { AccountType } from '@shared/common/types'
import {
  OPTIONS_PROXY,
  STATUS_ACCOUNT,
  STATUS_LOGIN,
  TYPE_ODD,
  TYPE_ODD_DETAIL
} from '@shared/main/constants'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { isAccountActive } from '@/worker/lib/checkAccount'
import { convertHdpPoint } from '@/worker/lib/convertHdpPoint'
import {
  exitAccountWithLog,
  logCrawlError,
  updateAccountAndNotify
} from '@/worker/lib/exitAccountWithLog'
import { fetchJsonWithTimeoutRetry } from '@/worker/lib/fetchWithTimeoutRetry'
import { findActiveAccount } from '@/worker/lib/findActiveAccount'
import { findStandardTeam } from '@/worker/lib/findStandardTeam'
import { formatName } from '@/worker/lib/formatName'
import { insertRecords } from '@/worker/lib/insertRecords'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { systemLogToFile } from '@/worker/lib/systemLogToFile'
import { getBalance1XBet } from '@/worker/platform/1XBet/actions/getBalance'
import {
  buildAsiaGetGamesUrl1XBet,
  buildCrawlHeaders1XBet,
  buildGameEventsUrl1XBet,
  getTsFrom1XBet,
  ODD_GROUP_1XBET
} from '@/worker/platform/1XBet/common/constant'
import {
  AsiaGetGamesResponse,
  EventGroup,
  GameEvent,
  GameEventsResponse
} from '@/worker/platform/1XBet/common/types'
import { buildLiveStat1XBet } from '@/worker/platform/1XBet/helper'
import { PLATFORM } from '@/worker/platform/platform.config'

const TABLE_NAME = 'IXBET'
const PERIOD = { FULL_TIME: 0, FIRST_HALF: 1 }

const HDP_MARKET_CONFIGS = [
  { GROUP: ODD_GROUP_1XBET.HDP.GROUP, A: ODD_GROUP_1XBET.HDP.HOME, B: ODD_GROUP_1XBET.HDP.AWAY },
  {
    GROUP: ODD_GROUP_1XBET.HDP_ALT.GROUP,
    A: ODD_GROUP_1XBET.HDP_ALT.HOME,
    B: ODD_GROUP_1XBET.HDP_ALT.AWAY
  }
]
const OU_MARKET_CONFIGS = [
  { GROUP: ODD_GROUP_1XBET.OU.GROUP, A: ODD_GROUP_1XBET.OU.OVER, B: ODD_GROUP_1XBET.OU.UNDER },
  {
    GROUP: ODD_GROUP_1XBET.OU_ALT.GROUP,
    A: ODD_GROUP_1XBET.OU_ALT.OVER,
    B: ODD_GROUP_1XBET.OU_ALT.UNDER
  }
]

type MarketEvent = { event: GameEvent; groupId: number }

let gameType: string | null = null

const port = parentPort
if (!port) throw new Error('IllegalState')

port.on('message', async (action: string) => {
  if (action === 'Start') {
    try {
      await handleCrawlData()
    } catch (error) {
      await systemLogToFile(`Error Handle Crawl Data 1XBet: ${JSON.stringify(error)}`, 'Error')
    }
  }
})

const handleCrawlData = async () => {
  while (true) {
    clearTable(PLATFORM['1XBET'])

    const account = Account.findOne({
      platformName: PLATFORM['1XBET'],
      status: STATUS_ACCOUNT.LOGOUT,
      statusLogin: STATUS_LOGIN.SUCCESS,
      orderID: 1
    }) as AccountType

    if (!account) {
      await setTimeout(1000)
      continue
    }

    await fnCrawlData(account)
    await setTimeout(4000)
  }
}

const fnCrawlData = async (account: AccountType) => {
  const settings = Setting.findAll() as SettingSchemaType[]
  if (!settings.length) return

  gameType = settings[0].gameType
  if (!gameType || gameType === GAME_TYPES.NONE) return

  const accountInfo = findActiveAccount(account.id)
  if (!accountInfo) return

  if (accountInfo.typeCrawl !== gameType) {
    await accountLogToFile(
      account.platformName,
      account.loginID,
      `GameType changed, refresh to sync.`,
      'Program'
    )

    exitAccountWithLog(port, account.id, 'GameType changed, check box refresh to sync.')

    return
  }

  const { status, data } = isProxyConfigValid(account)
  const { newIpAddress, newPort, newUsername, newPassword } = data

  const proxyUrl =
    status && account.proxyScope !== OPTIONS_PROXY.NONE
      ? `http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`
      : undefined

  const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

  const { ErrorCode, Message, cashBalance, outstanding, givenCredit, credit, currency } =
    await getBalance1XBet(account)

  if (ErrorCode !== 0) {
    await accountLogToFile(account.platformName, account.loginID, `${Message}`, 'Program')

    const dataAccount = findActiveAccount(account.id)
    if (!dataAccount) return

    updateAccountAndNotify(
      port,
      account.id,
      {
        statusLogin: STATUS_LOGIN.FAIL,
        textLog: 'Get balance failed, logging in again...',
        currency: null,
        credit: '0',
        cashBalance: '0',
        outstanding: '0',
        givenCredit: '0',
        cookie: null,
        host: null,
        socketUrl: null
      },
      'LoggedAgain'
    )
  }

  updateAccountAndNotify(port, account.id, {
    cashBalance,
    outstanding,
    givenCredit,
    credit,
    currency
  })

  if (!isAccountActive(account.id)) return
  updateAccountAndNotify(port, account.id, { textLog: `Get Soccer ${gameType}...` })

  try {
    const url = buildAsiaGetGamesUrl1XBet(gameType, getTsFrom1XBet(gameType))

    const headers = buildCrawlHeaders1XBet(account)

    const resData = await fetchJsonWithTimeoutRetry<AsiaGetGamesResponse>(url, {
      method: 'GET',
      headers,
      ...(proxyAgent && { agent: proxyAgent })
    })

    if (!resData.Success) {
      throw new Error(`AsiaGetGames returned Success=false`)
    }

    clearTable(TABLE_NAME)
    const IXBet = createModel(TABLE_NAME, dataCrawlByPlatformSchema)
    const records: RecordData[] = []

    const games = resData.Value ?? []

    if (!games.length) {
      await accountLogToFile(
        account.platformName,
        account.loginID,
        `Soccer ${gameType}: No data.`,
        'Program'
      )
      updateAccountAndNotify(port, account.id, { textLog: `Soccer ${gameType}: No data.` })

      port.postMessage({
        type: 'CrawlDone',
        platformName: PLATFORM['1XBET']
      })
      return
    }

    const eventsLength = games.length
    const timeStart = new Date().getTime()

    const MAX_CONSECUTIVE_SKIPS = 5
    let consecutiveSkips = 0

    for (const [gameIndex, game] of games.entries()) {
      const timeGameStart = new Date().getTime()

      const currentSettings = Setting.findAll() as SettingSchemaType[]
      const currentGameType = currentSettings[0]?.gameType
      if (currentGameType !== gameType) {
        await accountLogToFile(
          account.platformName,
          account.loginID,
          `GameType changed during crawl, stop processing.`,
          'Program'
        )
        updateAccountAndNotify(port, account.id, {
          textLog: `GameType changed during crawl, stop processing.`
        })
        return
      }

      const gameEventsUrl = buildGameEventsUrl1XBet(game.I, gameType)

      let gameEventsData: GameEventsResponse
      try {
        gameEventsData = await fetchJsonWithTimeoutRetry<GameEventsResponse>(gameEventsUrl, {
          method: 'GET',
          headers,
          ...(proxyAgent && { agent: proxyAgent })
        })
        consecutiveSkips = 0
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        consecutiveSkips++

        await accountLogToFile(
          account.platformName,
          account.loginID,
          `Skip game ${game.I}: ${message}`,
          'Program'
        )

        if (consecutiveSkips >= MAX_CONSECUTIVE_SKIPS) {
          throw new Error(
            `Too many consecutive game fetch failures (${consecutiveSkips}), last error: ${message}`
          )
        }

        continue
      }

      const findMarketSides = (
        eventGroups: EventGroup[],
        marketConfigs: { GROUP: number; A: number; B: number }[]
      ) => {
        const sideAEvents: MarketEvent[] = []
        const sideBEvents: MarketEvent[] = []

        for (const marketConfig of marketConfigs) {
          const marketGroup = eventGroups.find((group) => group.groupId === marketConfig.GROUP)
          if (!marketGroup) continue

          const aEvents =
            marketGroup.events.find((events) => events[0]?.type === marketConfig.A) ?? []
          const bEvents =
            marketGroup.events.find((events) => events[0]?.type === marketConfig.B) ?? []

          sideAEvents.push(...aEvents.map((event) => ({ event, groupId: marketGroup.groupId })))
          sideBEvents.push(...bEvents.map((event) => ({ event, groupId: marketGroup.groupId })))
        }

        return { sideAEvents, sideBEvents }
      }

      const hdpFullTime = findMarketSides(gameEventsData.eventGroups, HDP_MARKET_CONFIGS)
      const hdpFirstHalf = findMarketSides(
        (gameEventsData.subGamesForMainGame ?? []).flatMap((subGame) => subGame.eventGroups),
        HDP_MARKET_CONFIGS
      )
      const ouFullTime = findMarketSides(gameEventsData.eventGroups, OU_MARKET_CONFIGS)
      const ouFirstHalf = findMarketSides(
        (gameEventsData.subGamesForMainGame ?? []).flatMap((subGame) => subGame.eventGroups),
        OU_MARKET_CONFIGS
      )

      const firstHalfSubGame = (gameEventsData.subGamesForMainGame ?? []).find(
        (subGame) => subGame.subGameName === '1st half'
      )

      if (
        !hdpFullTime.sideAEvents.length &&
        !hdpFirstHalf.sideAEvents.length &&
        !ouFullTime.sideAEvents.length &&
        !ouFirstHalf.sideAEvents.length
      ) {
        continue
      }

      const nameHome = game.O1
      const nameAway = game.O2
      const nameLeague = game.L

      const standardHomeName = findStandardTeam({
        nameTeam: formatName(nameHome),
        nameLeague: formatName(nameLeague),
        platform: PLATFORM['1XBET']
      })

      const standardAwayName = findStandardTeam({
        nameTeam: formatName(nameAway),
        nameLeague: formatName(nameLeague),
        platform: PLATFORM['1XBET']
      })

      const dateEvent = new Date(game.S * 1000)
      const date = dateEvent.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })

      const isRunning = gameType === GAME_TYPES.RUNNING
      const score = isRunning ? `${game.SC?.FS?.S1 ?? 0}-${game.SC?.FS?.S2 ?? 0}` : null
      const time = dateEvent.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      const stat = isRunning ? buildLiveStat1XBet(game.SC) : null

      const pushOddRecords = (
        sideAEvents: MarketEvent[],
        sideBEvents: MarketEvent[],
        number: number,
        type: string,
        typeOdd: string
      ) => {
        sideAEvents.forEach((sideA, index) => {
          const sideB = sideBEvents[index]
          if (!sideB) return

          const sideAEvent = sideA.event
          const sideBEvent = sideB.event
          const hdp_point = sideAEvent.parameter ?? 0
          const betType = sideAEvent.type
          const altLineId = sideA.groupId

          records.push({
            gameType,
            platform: PLATFORM['1XBET'],
            idLeague: game.LI,
            nameLeague,
            idEvent: game.I,
            submatch_id: number === PERIOD.FIRST_HALF ? (firstHalfSubGame?.id ?? game.I) : game.I,
            nameHome,
            nameAway,

            number,
            date,
            time,
            stat,
            score,
            type,
            hdp_point,

            marketSelectionId_home_over: Number(sideAEvent.cf),
            home_over: Number(sideAEvent.cfView),
            type_home_over: Number(sideAEvent.type),

            marketSelectionId_away_under: Number(sideBEvent.cf),
            away_under: Number(sideBEvent.cfView),
            type_away_under: Number(sideBEvent.type),

            typeOdd,
            league: standardHomeName?.league || nameLeague,
            home: standardHomeName?.team || nameHome,
            away: standardAwayName?.team || nameAway,
            betType,
            altLineId,
            HDP: convertHdpPoint(hdp_point)
          })

          insertRecords(records, IXBet)
        })
      }

      pushOddRecords(
        hdpFullTime.sideAEvents,
        hdpFullTime.sideBEvents,
        PERIOD.FULL_TIME,
        TYPE_ODD.HDP,
        TYPE_ODD_DETAIL.HDP
      )
      pushOddRecords(
        hdpFirstHalf.sideAEvents,
        hdpFirstHalf.sideBEvents,
        PERIOD.FIRST_HALF,
        TYPE_ODD.HDP,
        TYPE_ODD_DETAIL.HDP
      )
      pushOddRecords(
        ouFullTime.sideAEvents,
        ouFullTime.sideBEvents,
        PERIOD.FULL_TIME,
        TYPE_ODD.OU,
        TYPE_ODD_DETAIL.OU
      )
      pushOddRecords(
        ouFirstHalf.sideAEvents,
        ouFirstHalf.sideBEvents,
        PERIOD.FIRST_HALF,
        TYPE_ODD.OU,
        TYPE_ODD_DETAIL.OU
      )

      const timeGameEnd = new Date().getTime()
      updateAccountAndNotify(port, account.id, {
        textLog: `Handle Data Odds Done Game. (${gameIndex + 1}/${eventsLength}, ${timeGameEnd - timeGameStart}ms)`
      })

      port.postMessage({
        type: 'CrawlDone',
        platformName: PLATFORM['1XBET']
      })
    }

    port.postMessage({
      type: 'CrawlDone',
      platformName: PLATFORM['1XBET']
    })

    const timeEnd = new Date().getTime()
    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Handle Data Odds Done All. (${eventsLength}, ${timeEnd - timeStart}ms)`,
      'Program'
    )
    updateAccountAndNotify(port, account.id, {
      textLog: `Handle Data Odds Done All. (${eventsLength}, ${timeEnd - timeStart}ms)`
    })
  } catch (error) {
    await logCrawlError(port, account, error, 'Crawl Data 1XBet')
  }
}
