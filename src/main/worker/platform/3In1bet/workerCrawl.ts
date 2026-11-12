/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-constant-condition */
import { setTimeout } from 'timers/promises'
import { parentPort } from 'worker_threads'

import { Account, clearTable, createModel, Setting } from '@db/model'
import dataCrawlByPlatformSchema from '@db/schema/dataCrawlByPlatform'
import { SettingSchemaType } from '@db/schema/setting'
import { HttpsProxyAgent } from 'https-proxy-agent'

import { CONVERT_HDP, GAME_TYPES } from '@shared/common/constants'
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
import {
  exitAccountWithLog,
  logCrawlError,
  updateAccountAndNotify
} from '@/worker/lib/exitAccountWithLog'
import { findActiveAccount } from '@/worker/lib/findActiveAccount'
import { findStandardTeam } from '@/worker/lib/findStandardTeam'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { systemLogToFile } from '@/worker/lib/systemLogToFile'
import {
  DataOddsEarly,
  DataOddsNormal,
  DataOddsResponse,
  UserInfoResponse
} from '@/worker/platform/3In1bet/common/types'
import {
  buildHdpDoubleUrl,
  buildPlatformUrl_3In1Bet,
  createPayload,
  formatStat,
  isArError
} from '@/worker/platform/3In1bet/helper'
import { PLATFORM } from '@/worker/platform/platform.config'

const TABLE_NAME = 'IIIin1Bet'
const PROGRESS_LOG_INTERVAL = 20

let gameType: string | null = null

const port = parentPort
if (!port) throw new Error('IllegalState')

port.on('message', async (action: string) => {
  if (action === 'Start') {
    try {
      await handleCrawlData()
    } catch (error) {
      await systemLogToFile(`Error Handle Crawl Data 3in1Bet: ${JSON.stringify(error)}`, 'Error')
    }
  }
})

const handleCrawlData = async () => {
  while (true) {
    const account = Account.findOne({
      platformName: PLATFORM['3IN1BET'],
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

    clearTable(TABLE_NAME)
    return
  }

  const { status, data } = isProxyConfigValid(account)
  const { newIpAddress, newPort, newUsername, newPassword } = data

  const proxyUrl =
    status && account.proxyScope !== OPTIONS_PROXY.NONE
      ? `http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`
      : undefined

  const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined
  const payload = new URLSearchParams(createPayload(gameType))

  try {
    updateAccountAndNotify(port, account.id, { textLog: 'Connecting to 3in1bet...' })

    const arRes = await fetch(buildPlatformUrl_3In1Bet(account, 'AR'), {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Origin: account.loginURL,
        Referer: account.loginURL + 'main/index.aspx',
        Cookie: account.cookie,
        ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
      },
      ...(proxyAgent && { agent: proxyAgent }),
      body: JSON.stringify({
        a: '',
        r: ''
      })
    })

    if (!arRes.ok) {
      throw new Error(`Request failed ${arRes.status}`)
    }
    const arResJson: unknown = await arRes.json()

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `ArResJson: ${JSON.stringify(arResJson)}`,
      'Program'
    )

    if (isArError(arResJson) && arResJson.Au === 0) {
      throw new Error(`Your account has been log off due to multiple login.`)
    }

    updateAccountAndNotify(port, account.id, { textLog: 'Fetching account balance...' })

    const userInfoRes = await fetch(buildPlatformUrl_3In1Bet(account, 'USER_INFO_PANEL_HOST'), {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Origin: account.loginURL,
        Referer: account.loginURL + 'main/index.aspx',
        Cookie: account.cookie,
        ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
      },
      ...(proxyAgent && { agent: proxyAgent })
    })
    if (!userInfoRes.ok) {
      throw new Error(`Request failed ${userInfoRes.status}`)
    }

    const userInfoJson: unknown = await userInfoRes.json()
    const userInfo = userInfoJson as Partial<UserInfoResponse>

    if (!userInfo || !('BetCredit' in userInfo)) {
      throw new Error('Data userInfo is invalid or missing BetCredit property')
    }

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `BetCredit: ${JSON.stringify(userInfo)}`,
      'Program'
    )

    updateAccountAndNotify(port, account.id, {
      currency: userInfo.Currency || 'USD',
      cashBalance: String(userInfo.Balance ?? '0'),
      outstanding: String(userInfo.Outstanding ?? '0'),
      givenCredit: String(userInfo.GivenCredit ?? '0'),
      credit: String(userInfo.BetCredit ?? '0'),
      textLog: `Balance updated: ${userInfo.Balance ?? '0'} ${userInfo.Currency || 'USD'}`
    })

    if (!isAccountActive(account.id)) return

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Get Soccer ${gameType}...`,
      'Program'
    )
    updateAccountAndNotify(port, account.id, { textLog: `Get Soccer ${gameType}...` })

    const res = await fetch(buildPlatformUrl_3In1Bet(account, 'DATA_ODDS'), {
      method: 'POST',
      ...(proxyAgent && { agent: proxyAgent }),
      headers: {
        accept: 'application/json, text/javascript, */*',
        'accept-language': 'vi,en-US;q=0.9,en;q=0.8,ko;q=0.7',
        'content-type': 'application/json; charset=UTF-8',
        cookie: account.cookie,
        origin: account.loginURL,
        referer: buildHdpDoubleUrl(gameType, account.loginURL),
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'x-requested-with': 'XMLHttpRequest',
        ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
      },
      body: payload.toString()
    })

    if (!res.ok) {
      throw new Error(`Request failed ${res.status}`)
    }

    const text = await res.text()

    if (text === 'TimeOut') {
      throw new Error('DATA_ODDS_TIMEOUT')
    }

    const data = JSON.parse(text) as DataOddsResponse

    const dataOdds = [GAME_TYPES.EARLY, GAME_TYPES.TODAY].includes(gameType)
      ? ((data as DataOddsEarly).today ?? [])
      : ((data as DataOddsNormal).data ?? [])

    await handleData({ dataOdds, account })
  } catch (error) {
    await logCrawlError(port, account, error, 'Crawl Data 3in1Bet', {
      clearTablePlatform: TABLE_NAME
    })
  }
}

const handleData = async ({ dataOdds, account }) => {
  clearTable(TABLE_NAME)
  if (!gameType || gameType === GAME_TYPES.NONE) return
  const IIIin1Bet = createModel(TABLE_NAME, dataCrawlByPlatformSchema)

  const eventsLength = dataOdds.length

  if (eventsLength === 0) {
    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Soccer ${gameType}: No data.`,
      'Program'
    )
    updateAccountAndNotify(port, account.id, { textLog: `Soccer ${gameType}: No data.` })

    port.postMessage({
      type: 'CrawlDone',
      platformName: PLATFORM['3IN1BET']
    })
    return
  }

  await accountLogToFile(
    account.platformName,
    account.loginID,
    `Processing ${eventsLength} Soccer events...`,
    'Program'
  )
  updateAccountAndNotify(port, account.id, {
    textLog: `Processing ${eventsLength} Soccer events...`
  })
  await setTimeout(1000)

  const timeStart = new Date().getTime()
  let processedCount = 0

  for (const dataOdd of dataOdds) {
    if (!isAccountActive(account.id)) return

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

    if (dataOdd[4] !== 'Soccer') continue

    // Giải đấu
    const idLeague = dataOdd[3]
    const uuidLeague = dataOdd[34]
    const nameLeague = dataOdd[37] || 'Unknown League'

    // Trận đấu
    const idEvent = dataOdd[0]
    const nameHome = dataOdd[38] || 'Unknown Home Team'
    const nameAway = dataOdd[39] || 'Unknown Away Team'
    const date = dataOdd[56]
    const time = dataOdd[53]

    if (dataOdd[37]?.includes('-')) continue

    if ([nameLeague, nameHome, nameAway].some((name) => name.includes('Unknown'))) continue

    const standardHomeName = findStandardTeam({
      nameTeam: nameHome,
      nameLeague: nameLeague,
      platform: PLATFORM['3IN1BET']
    })

    const standardAwayName = findStandardTeam({
      nameTeam: nameAway,
      nameLeague: nameLeague,
      platform: PLATFORM['3IN1BET']
    })

    // index check đội nào mạnh
    const indexCheck = dataOdd[24]

    // Cấu hình các loại kèo
    const configs = [
      {
        number: 0,
        score: GAME_TYPES.RUNNING == gameType ? `${dataOdd[7]}-${dataOdd[8]}` : null,
        stat: GAME_TYPES.RUNNING == gameType ? dataOdd[53] : null,
        hdp_point: indexCheck === 0 ? dataOdd[10] : dataOdd[10] * -1,
        home_over: dataOdd[40],
        away_under: dataOdd[41],
        type: TYPE_ODD.HDP,
        typeOdd: TYPE_ODD_DETAIL.HDP,
        HDP: CONVERT_HDP[dataOdd[10]]
      },
      {
        number: 0,
        score: GAME_TYPES.RUNNING == gameType ? `${dataOdd[7]}-${dataOdd[8]}` : null,
        stat: GAME_TYPES.RUNNING == gameType ? dataOdd[53] : null,
        hdp_point: dataOdd[12],
        home_over: dataOdd[42],
        away_under: dataOdd[43],
        type: TYPE_ODD.OU,
        typeOdd: TYPE_ODD_DETAIL.OU,
        HDP: CONVERT_HDP[dataOdd[12]]
      },
      {
        number: 1,
        score: GAME_TYPES.RUNNING == gameType ? `${dataOdd[7]}-${dataOdd[8]}` : null,
        stat: GAME_TYPES.RUNNING == gameType ? dataOdd[53] : null,
        hdp_point: indexCheck === 0 ? dataOdd[14] : dataOdd[14] * -1,
        home_over: dataOdd[44],
        away_under: dataOdd[45],
        type: TYPE_ODD.HDP,
        typeOdd: TYPE_ODD_DETAIL.HDP,
        HDP: CONVERT_HDP[dataOdd[14]]
      },
      {
        number: 1,
        score: GAME_TYPES.RUNNING == gameType ? `${dataOdd[7]}-${dataOdd[8]}` : null,
        stat: GAME_TYPES.RUNNING == gameType ? dataOdd[53] : null,
        hdp_point: dataOdd[16],
        home_over: dataOdd[46],
        away_under: dataOdd[47],
        type: TYPE_ODD.OU,
        typeOdd: TYPE_ODD_DETAIL.OU,
        HDP: CONVERT_HDP[dataOdd[16]]
      }
    ]

    // Lọc bỏ config có chứa -999
    const validConfigs = configs.filter((cfg) => {
      return cfg.hdp_point !== -999 && cfg.home_over !== -999 && cfg.away_under !== -999
    })

    // Map ra dữ liệu insert
    const records = validConfigs.map((cfg) => ({
      gameType,
      platform: PLATFORM['3IN1BET'],
      idLeague,
      uuidLeague,
      nameLeague,
      idEvent,
      isHomeStrong: indexCheck,
      nameHome,
      nameAway,
      league: standardHomeName?.league || nameLeague,
      home: standardHomeName?.team || nameHome,
      away: standardAwayName?.team || nameAway,
      redCard: GAME_TYPES.RUNNING == gameType ? '0-0' : null,
      date,
      time,
      score: cfg?.score || null,
      stat: formatStat(cfg?.stat || null),
      number: cfg.number,
      hdp_point: cfg.hdp_point,
      home_over: cfg.home_over,
      away_under: cfg.away_under,
      type: cfg.type,
      typeOdd: cfg.typeOdd,
      HDP: cfg.HDP
    }))

    if (records.length !== 0) {
      IIIin1Bet.insertMany(records)
    }

    processedCount++
    if (processedCount % PROGRESS_LOG_INTERVAL === 0) {
      const timeNow = new Date().getTime()
      updateAccountAndNotify(port, account.id, {
        textLog: `Handle Data Odds Progress. (${processedCount}/${eventsLength}, ${timeNow - timeStart}ms)`
      })
    }
  }
  port.postMessage({
    type: 'CrawlDone',
    platformName: PLATFORM['3IN1BET']
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
}
