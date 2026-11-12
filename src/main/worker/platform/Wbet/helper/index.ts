import zlib from 'zlib'

import fetch from 'node-fetch'

import { GAME_TYPES } from '@shared/common/constants'
import { AccountType } from '@shared/common/types'
import { TYPE_ODD, TYPE_ODD_DETAIL } from '@shared/main/constants'

import { checkGameType } from '@/worker/lib/checkGameType'
import { logAndNotify } from '@/worker/lib/exitAccountWithLog'
import { findStandardTeam } from '@/worker/lib/findStandardTeam'
import { PLATFORM } from '@/worker/platform/platform.config'
import {
  ARGUMENTS_UX_MARKET,
  ARGUMENTS_UX_MATCH,
  REVERSE_CONVERT_ODDS,
  TYPE_ODD_HDP,
  TYPE_ODD_OU
} from '@/worker/platform/Wbet/common/constants'

const TYPE_CONFIG = {
  AUTH: { sub: 'app', path: '/userlogin' },
  BALANCE: { sub: 'app', path: '/userbalance' },
  BET_CHECK: { sub: 'app', path: '/bet/betcheck' },
  BET_SINGLE: { sub: 'app', path: '/bet/betsingle' },
  UX_MARKET: { sub: 'odds', path: '/uxmarket' },
  UX_MATCH: { sub: 'odds', path: '/uxmatch' }
} as const

export function buildPlatformUrl_WBet(account: AccountType, type: string) {
  const { protocol, hostname } = new URL(account.loginURL)
  const config = TYPE_CONFIG[type]

  return `${protocol}//${config.sub}.${hostname}${config.path}`
}

export const buildBodyBalance = (account: AccountType) => {
  return {
    account_id: account.loginID,
    session_token: account.cookie
  }
}

export const buildBodyMarket = (gameType: string, account: AccountType) => {
  return {
    account_id: account.loginID,
    session_token: account.cookie,
    arguments: ARGUMENTS_UX_MARKET[gameType]
  }
}

export const buildBodyMatch = (gameType: string, account: AccountType, matchs) => {
  return {
    account_id: account.loginID,
    session_token: account.cookie,
    arguments: ARGUMENTS_UX_MATCH[gameType],
    ids: matchs.map((match) => match[0]).join('|'),
    mmo: 'ODDS'
  }
}

export async function fetchJsonWithDecompress(url: string, account: AccountType, options) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'accept-encoding': 'gzip, deflate, br',
      'content-type': 'application/json',
      origin: account.loginURL,
      referer: account.loginURL,
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
    }
  })

  const buffer = Buffer.from(await response.arrayBuffer())
  const text = buffer.toString('utf-8')

  // 🟢 TH1: thử parse trực tiếp JSON
  try {
    return JSON.parse(text)
  } catch {
    // không phải JSON → có thể là base64 gzip
  }

  // 🟢 TH2: nếu bắt đầu bằng "H4sI" thì decode base64 rồi gunzip
  if (text.startsWith('H4sI')) {
    const gzBuffer = Buffer.from(text, 'base64')
    const decompressed = zlib.gunzipSync(gzBuffer).toString('utf-8')
    return JSON.parse(decompressed)
  }

  // 🟢 TH3: fallback inflate
  try {
    const inflated = zlib.inflateSync(buffer).toString('utf-8')
    return JSON.parse(inflated)
  } catch {
    throw new Error('Response is not valid JSON or gzip/base64 JSON: ' + text.slice(0, 200))
  }
}

function round(value: number, decimals = 2): number {
  return Number(value.toFixed(decimals))
}

export async function handleDataOdds_HDP(
  dataOdds_HDP,
  leagues,
  matchs,
  gameType,
  WBet,
  port,
  account
) {
  const timeStart = new Date().getTime()

  for (const key in dataOdds_HDP) {
    if (!checkGameType(PLATFORM.WBET, gameType)) {
      await logAndNotify(port, account, 'GameType changed during crawl, stop processing.')
      return
    }

    const arr = dataOdds_HDP[key]

    await logAndNotify(
      port,
      account,
      `Handle Data Odds.(${key}/${new Date().getTime() - timeStart}ms)`,
      { strictMatch: { orderID: 1, platformName: PLATFORM.WBET } }
    )

    for (const item of arr) {
      const idLeague = item[0]
      const idEvent = item[1]

      const submatch_id = item[2]
      const altLineId = item[3]
      const time_odd = item[4]
      const index = item[7]
      const odd =
        index == 1 ? -Number(REVERSE_CONVERT_ODDS[item[8]]) : Number(REVERSE_CONVERT_ODDS[item[8]])

      const homeIndex = index === 1 ? 10 : 9
      const awayIndex = index === 1 ? 9 : 10

      const price_home = round(Number(item[homeIndex]) * 0.1)
      const price_away = round(Number(item[awayIndex]) * 0.1)

      //Tên giải đấu
      const league = leagues.find((league) => league[0] === idLeague)
      const nameLeague = league ? league[4] : 'Unknown League'

      // Tên trận đấu
      const match = matchs.find((match) => match[0] === idEvent)
      const nameHome = match ? match[5] : 'Unknown Home Team'
      const nameAway = match ? match[6] : 'Unknown Away Team'

      if (nameLeague?.includes('-')) continue
      if (
        [nameLeague, nameHome, nameAway].some((name) => !name || String(name).includes('Unknown'))
      )
        continue

      const standardHomeName = findStandardTeam({
        nameTeam: nameHome,
        nameLeague: nameLeague,
        platform: PLATFORM.WBET
      })

      const standardAwayName = findStandardTeam({
        nameTeam: nameAway,
        nameLeague: nameLeague,
        platform: PLATFORM.WBET
      })

      const scoreRaw = GAME_TYPES.RUNNING == gameType ? match[11] : null
      const score = scoreRaw ? scoreRaw.replace(/\s*-\s*/g, '-') : null

      const stat = GAME_TYPES.RUNNING == gameType ? match[12] : null

      const marketSelectionId_home_over = match[22]
      const marketSelectionId_away_under = match[23]

      const dateObj = new Date(match[8])

      const date = dateObj.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit'
      })

      const time = dateObj.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })

      WBet.create({
        gameType,
        date,
        time,
        platform: PLATFORM.WBET,
        idLeague,
        nameLeague,
        idEvent,
        nameHome,
        nameAway,
        league: standardHomeName?.league || nameLeague,
        home: standardHomeName?.team || nameHome,
        away: standardAwayName?.team || nameAway,
        number: TYPE_ODD_HDP[time_odd],
        score,
        stat,
        hdp_point: Number(odd),
        home_over: price_home,
        away_under: price_away,
        type: TYPE_ODD.HDP,
        typeOdd: TYPE_ODD_DETAIL.HDP,
        HDP: item[8],
        marketSelectionId_home_over,
        marketSelectionId_away_under,
        altLineId,
        submatch_id,
        specialOdd: 5
      })
    }
  }
}

export async function handleDataOdds_OU(
  dataOdds_OU,
  leagues,
  matchs,
  gameType,
  WBet,
  port,
  account
) {
  const timeStart = new Date().getTime()

  for (const key in dataOdds_OU) {
    if (!checkGameType(PLATFORM.WBET, gameType)) {
      await logAndNotify(port, account, 'GameType changed during crawl, stop processing.')
      return
    }

    const arr = dataOdds_OU[key]

    await logAndNotify(
      port,
      account,
      `Handle Data Odds.(${key}/${new Date().getTime() - timeStart}ms)`,
      { strictMatch: { orderID: 1, platformName: PLATFORM.WBET } }
    )

    for (const item of arr) {
      const idLeague = item[0]
      const idEvent = item[1]
      const submatch_id = item[2]
      const altLineId = item[3]
      const time_odd = item[4]
      const odd = Number(REVERSE_CONVERT_ODDS[item[8]])

      const price_home = round(Number(item[12]) * 0.1)
      const price_away = round(Number(item[11]) * 0.1)

      //Tên giải đấu
      const league = leagues.find((league) => league[0] === idLeague)
      const nameLeague = league ? league[4] : 'Unknown League'
      // Tên trận đấu
      const match = matchs.find((match) => match[0] === idEvent)
      const nameHome = match ? match[5] : 'Unknown Home Team'
      const nameAway = match ? match[6] : 'Unknown Away Team'

      if (nameLeague?.includes('-')) continue
      if (
        [nameLeague, nameHome, nameAway].some((name) => !name || String(name).includes('Unknown'))
      )
        continue

      const standardHomeName = findStandardTeam({
        nameTeam: nameHome,
        nameLeague: nameLeague,
        platform: PLATFORM.WBET
      })

      const standardAwayName = findStandardTeam({
        nameTeam: nameAway,
        nameLeague: nameLeague,
        platform: PLATFORM.WBET
      })

      const scoreRaw = GAME_TYPES.RUNNING == gameType ? match[11] : null
      const score = scoreRaw ? scoreRaw.replace(/\s*-\s*/g, '-') : null

      const stat = GAME_TYPES.RUNNING == gameType ? match[12] : null

      const marketSelectionId_home_over = match[22]
      const marketSelectionId_away_under = match[23]

      const dateObj = new Date(match[8])

      const date = dateObj.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit'
      })

      const time = dateObj.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })

      WBet.create({
        gameType,
        date,
        time,
        platform: PLATFORM.WBET,
        idLeague,
        nameLeague,
        idEvent,
        nameHome,
        nameAway,
        league: standardHomeName?.league || nameLeague,
        home: standardHomeName?.team || nameHome,
        away: standardAwayName?.team || nameAway,
        number: TYPE_ODD_OU[time_odd],
        score,
        stat,
        hdp_point: Number(odd),
        home_over: price_home,
        away_under: price_away,
        type: TYPE_ODD.OU,
        typeOdd: TYPE_ODD_DETAIL.OU,
        HDP: item[8],
        marketSelectionId_home_over,
        marketSelectionId_away_under,
        altLineId,
        submatch_id,
        specialOdd: 7
      })
    }
  }
}
