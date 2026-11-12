/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-constant-condition */
import { setTimeout } from 'timers/promises'
import { parentPort } from 'worker_threads'

import { Account, clearTable, createModel, Setting } from '@db/model'
import dataCrawlByPlatformSchema from '@db/schema/dataCrawlByPlatform'
import { SettingSchemaType } from '@db/schema/setting'
import fetch from 'node-fetch'

import {
  FH,
  FT,
  GAME_TYPES,
  HDP_FH,
  HDP_FT,
  OU_FH,
  OU_FT,
  SPREAD,
  TOTAL
} from '@shared/common/constants'
import { CONVERT_HDP } from '@shared/common/constants'
import { AccountType } from '@shared/common/types'
import { STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { isAccountActive } from '@/worker/lib/checkAccount'
import { checkGameType } from '@/worker/lib/checkGameType'
import { logAndNotify, logAndTriggerRelogin, logCrawlError } from '@/worker/lib/exitAccountWithLog'
import { findActiveAccount } from '@/worker/lib/findActiveAccount'
import { findStandardTeam } from '@/worker/lib/findStandardTeam'
import { formatName } from '@/worker/lib/formatName'
import { insertRecords } from '@/worker/lib/insertRecords'
import { logTime } from '@/worker/lib/logTime'
import { systemLogToFile } from '@/worker/lib/systemLogToFile'
import { toPositiveNumber } from '@/worker/lib/toPositiveNumber'
import { PLATFORM } from '@/worker/platform/platform.config'
import { getBalancePs3838 } from '@/worker/platform/Ps3838/actions/getBalance'
import {
  buildHeadersBalancePs3838,
  buildHeadersPs3838,
  gameTypeMapPs3838
} from '@/worker/platform/Ps3838/common/contants'
import {
  buildPlatformUrl,
  buildProxyAgent,
  buildTokenHeaders,
  parseTokens
} from '@/worker/platform/Ps3838/helper'

let gameType: string | null = null

// event[8][period][sub] holds the odds lines for one market; index positions come from the Ps3838 payload shape.
const ODD_LINE_CONFIGS = [
  {
    period: '0',
    sub: 0,
    number: FT,
    type: 'HDP',
    typeOdd: SPREAD,
    betType: HDP_FT,
    skipZeroOdds: true,
    altLineIndex: 7,
    pointIndex: 1,
    overIndex: 3,
    underIndex: 4,
    specialOddIndex: 8
  },
  {
    period: '0',
    sub: 1,
    number: FT,
    type: 'OU',
    typeOdd: TOTAL,
    betType: OU_FT,
    skipZeroOdds: true,
    altLineIndex: 4,
    pointIndex: 1,
    overIndex: 2,
    underIndex: 3,
    specialOddIndex: 5
  },
  {
    period: '1',
    sub: 0,
    number: FH,
    type: 'HDP',
    typeOdd: SPREAD,
    betType: HDP_FH,
    skipZeroOdds: false,
    altLineIndex: 7,
    pointIndex: 1,
    overIndex: 3,
    underIndex: 4,
    specialOddIndex: 8
  },
  {
    period: '1',
    sub: 1,
    number: FH,
    type: 'OU',
    typeOdd: TOTAL,
    betType: OU_FH,
    skipZeroOdds: false,
    altLineIndex: 4,
    pointIndex: 1,
    overIndex: 2,
    underIndex: 3,
    specialOddIndex: 5
  }
] as const

const port = parentPort
if (!port) throw new Error('IllegalState')

port.on('message', async (action: string) => {
  if (action == 'Start') {
    try {
      await handleCrawlData()
    } catch (error) {
      await systemLogToFile(`Error Handle Crawl Data Ps3838: ${JSON.stringify(error)}`, 'Error')
    }
  }
})

const handleCrawlData = async () => {
  while (true) {
    clearTable(PLATFORM.PS3838)

    const account = Account.findOne({
      platformName: PLATFORM.PS3838,
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
    await logAndNotify(port, account, 'GameType changed, check box refresh to sync.', {
      fields: { status: STATUS_ACCOUNT.EXIT }
    })

    clearTable(PLATFORM.PS3838)
    return
  }

  const { proxyAgent } = buildProxyAgent(account)

  const { ErrorCode, Message, cashBalance, outstanding, givenCredit, credit, currency } =
    await getBalancePs3838(account)

  if (ErrorCode !== 0) {
    await logAndTriggerRelogin(port, account, `Get balance failed: ${Message}`)
    return
  }

  await logAndNotify(port, account, `Balance updated: ${cashBalance} ${currency}`, {
    fields: { cashBalance, outstanding, givenCredit, credit, currency }
  })

  try {
    const tokens = parseTokens(accountInfo.token)
    const resKeepAlive = await fetch(buildPlatformUrl(accountInfo, 'KEEP_ALIVE'), {
      method: 'GET',
      headers: {
        ...buildHeadersBalancePs3838(accountInfo, accountInfo.vHucode),
        ...buildTokenHeaders(tokens),
        Cookie: accountInfo.cookie
      },
      ...(proxyAgent && { agent: proxyAgent })
    })

    const vHucode = resKeepAlive.headers.get('v-hucode')

    if (!vHucode) {
      throw new Error('V-hucode not found')
    }

    const mk: number = gameTypeMapPs3838[gameType] //(0-Early;1-Today;2-Live)

    if (
      !(await logAndNotify(port, account, `Get Soccer ${gameType}...`, {
        strictMatch: { orderID: 1, platformName: PLATFORM.PS3838 }
      }))
    )
      return

    const url = `${account.loginURL}sports-service/sv/odds/events?mk=${mk}&sp=29&ot=4&btg=1&o=1&lg=&ev=&d=&l=100&v=0&me=0&more=false&c=MY&tm=0&g=QQ%3D%3D&pa=0&cl=100&_g=0&wm=dz&_=${Date.now()}&locale=en_US`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        ...buildHeadersPs3838(account, vHucode),
        ...buildTokenHeaders(tokens),
        'x-app-data':
          'dpAOW=q9pmurY_jhI_X;pctag=dc821180-c6c2-4fe5-adaa-5fd0e6fcce72;directusToken=TwEdnphtyxsfMpXoJkCkWaPsL2KJJ3lo;PCTR=1947977955312;BrowserSessionId=d4f68c87-aaba-4d2c-a108-403d6a0331ea;_og=QQ%3D%3D;_ulp=aEJSR05ZdTBuUjZxYldBTUhPQm0wZzFPcXdVbnd5dnhDZ3cwa040QUtlKzc1eHpJMlJOYUx3TG5FZitRcGdrcWJmbk5GWkltSDNQWEJPVkVDR0Npd3c9PXwyOTA2N2ZjNTRkNTk0ZDZlMWEzMzQzOTNiMjkxNDMyMA%3D%3D;custid=id%3DBCB3700234%26login%3D202609232059%26roundTrip%3D202609232059%26hash%3D09ED7967BCBEEBF58E94F9A79D74C272;_userDefaultView=COMPACT;__prefs=W251bGwsNCwxLDAsMSxudWxsLGZhbHNlLDAuMDAwMCxmYWxzZSx0cnVlLCJBTEwiLC0xLG51bGwsdHJ1ZSx0cnVlLGZhbHNlLGZhbHNlLG51bGwsbnVsbCx0cnVlLCJTTUFMTCIsMSx0cnVlXQ%3D%3D;lang=en_US',
        Cookie: account.cookie
      },
      ...(proxyAgent && { agent: proxyAgent })
    })

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await res.text()
      console.error(`${logTime()}Response is not JSON:`, text)
      throw new Error('Received non-JSON response')
    }

    const resData = await res.json()

    let dataPs3838: any
    if (mk === 0 || mk === 1) {
      dataPs3838 = resData.n[0][2]
    } else if (mk === 2) {
      dataPs3838 = resData.l[0][2]
    }

    if (!dataPs3838.length) {
      await logAndNotify(port, account, `Soccer ${gameType}: No data.`, {
        strictMatch: { orderID: 1, platformName: PLATFORM.PS3838 }
      })

      clearTable(PLATFORM.PS3838)

      port.postMessage({
        type: 'CrawlDone',
        platformName: PLATFORM.PS3838
      })
      return
    }

    await handleData({ dataPs3838, account })
  } catch (error) {
    await logCrawlError(port, account, error, 'Crawl Data Ps3838', {
      clearTablePlatform: PLATFORM.PS3838
    })
  }
}

const handleData = async ({ dataPs3838, account }) => {
  clearTable(PLATFORM.PS3838)

  if (!gameType || gameType === GAME_TYPES.NONE) return
  const Ps3838 = createModel(PLATFORM.PS3838, dataCrawlByPlatformSchema)

  const timeStart = new Date().getTime()
  const records: any[] = []
  const eventsLength = dataPs3838.length

  for (const [leagueIndex, league] of dataPs3838.entries()) {
    if (!isAccountActive(account.id)) return
    if (!checkGameType(account.platformName, gameType)) {
      await logAndNotify(port, account, 'GameType changed during crawl, stop processing.')
      return
    }

    const timeLeagueStart = new Date().getTime()
    const [id, name, events] = league

    const hasCorners = name.toLowerCase().includes('corners')
    if (hasCorners) continue

    for (const event of events) {
      if (!isAccountActive(account.id) || !checkGameType(account.platformName, gameType)) return

      const idEvent = event[0]
      const home = event[1].trim()
      const away = event[2].trim()

      const dateEvent = new Date(event[4])

      const date = dateEvent.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit'
      })

      const time = dateEvent.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      })

      const standardHomeName = findStandardTeam({
        nameTeam: formatName(home),
        nameLeague: formatName(name),
        platform: PLATFORM.PS3838
      })

      const standardAwayName = findStandardTeam({
        nameTeam: formatName(away),
        nameLeague: formatName(name),
        platform: PLATFORM.PS3838
      })

      const hasValidData = event[9] && event[10] && event[16]

      const score = hasValidData ? `${event[9][0]}-${event[9][1]}` : null
      const redCard = hasValidData ? `${event[10][0]}-${event[10][1]}` : null
      const stat = hasValidData ? `${event[16] || ''} ${event[15] || ''}`.trim() : null

      if (gameType == GAME_TYPES.RUNNING && !score && !redCard && !stat) continue

      for (const oddConfig of ODD_LINE_CONFIGS) {
        const lines = event[8]?.[oddConfig.period]?.[oddConfig.sub]
        if (!lines) continue
        if (!isAccountActive(account.id) || !checkGameType(account.platformName, gameType)) return
        if (!lines.length) continue

        for (const line of lines) {
          if (!isAccountActive(account.id) || !checkGameType(account.platformName, gameType)) return

          const homeOver = +line[oddConfig.overIndex]
          const awayUnder = +line[oddConfig.underIndex]
          if (oddConfig.skipZeroOdds && (homeOver === 0 || awayUnder === 0)) continue

          records.push({
            gameType,
            date,
            time,
            platform: PLATFORM.PS3838,
            idLeague: id,
            nameLeague: name,
            idEvent,
            nameHome: home,
            nameAway: away,
            number: oddConfig.number,
            score,
            redCard,
            stat,
            type: oddConfig.type,
            altLineId: line[oddConfig.altLineIndex],
            hdp_point: line[oddConfig.pointIndex],
            home_over: homeOver,
            away_under: awayUnder,
            typeOdd: oddConfig.typeOdd,
            league: standardHomeName?.league || name,
            home: standardHomeName?.team || home,
            away: standardAwayName?.team || away,
            specialOdd: line[oddConfig.specialOddIndex],
            betType: oddConfig.betType,
            HDP: CONVERT_HDP[toPositiveNumber(line[oddConfig.pointIndex])]
          })

          insertRecords(records, Ps3838)
        }
      }

      if (!isAccountActive(account.id) || !checkGameType(account.platformName, gameType)) return
    }

    const timeLeagueEnd = new Date().getTime()
    await logAndNotify(
      port,
      account,
      `Handle Data League Done. (${leagueIndex + 1}/${eventsLength}, ${timeLeagueEnd - timeLeagueStart}ms)`
    )
  }

  if (records.length > 0) {
    insertRecords(records, Ps3838)
  }

  if (!isAccountActive(account.id) || !checkGameType(account.platformName, gameType)) return

  port.postMessage({
    type: 'CrawlDone',
    platformName: PLATFORM.PS3838
  })
  const timeEnd = new Date().getTime()
  await logAndNotify(
    port,
    account,
    `Handle Data Event Done All. Total (${eventsLength}/${timeEnd - timeStart}ms)`,
    { strictMatch: { orderID: 1, platformName: PLATFORM.PS3838 } }
  )
}
