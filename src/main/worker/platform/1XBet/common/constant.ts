import { v4 as uuidv4 } from 'uuid'

import { GAME_TYPES } from '@shared/common/constants'
import { AccountType } from '@shared/common/types'

export const API_BASE_URL = 'https://1xbetjap.com'

export const API_ENDPOINTS = {
  AUTH: `${API_BASE_URL}/web-api/user/auth`,
  BALANCE: `${API_BASE_URL}/account-api/user/balance`,
  FATMAN_FC: `${API_BASE_URL}/fatman-api/a6f69e4388362d761ee5bb073edb23ae3d9341fb/fc`,
  WELCOME_BONUSES: `${API_BASE_URL}/web-api/api/v3/bonuses/welcome-bonuses`,
  SECURE: `${API_BASE_URL}/web-api/user/secure`,
  VERIFY: `${API_BASE_URL}/hd-api/external/verify`,
  HD_EXTERNAL_SCRIPT: () => `${API_BASE_URL}/hd-api/external/${uuidv4()}.js`,
  ASIA_GET_GAMES_LINE: `${API_BASE_URL}/service-api/LineFeed/Asia/AsiaGetGames`,
  ASIA_GET_GAMES_LIVE: `${API_BASE_URL}/service-api/LiveFeed/Asia/AsiaGetGames`,
  GAME_EVENTS: `${API_BASE_URL}/service-api/main-line-feed/v3/gameEvents`,
  GAME_EVENTS_LIVE: `${API_BASE_URL}/service-api/main-live-feed/v3/gameEvents`,
  UPDATE_COUPON: `${API_BASE_URL}/service-api/LiveBet-update/Open/UpdateCoupon`,
  MAKE_BET: `${API_BASE_URL}/service-api/LiveBet/Secure/MakeBetWeb`
}

export const ODD_GROUP_1XBET = {
  HDP: { GROUP: 2, HOME: 7, AWAY: 8 },
  HDP_ALT: { GROUP: 2854, HOME: 3829, AWAY: 3830 },
  OU: { GROUP: 17, OVER: 9, UNDER: 10 },
  OU_ALT: { GROUP: 99, OVER: 3827, UNDER: 3828 }
} as const

const TIMEZONE_OFFSET_HOURS = 7

export const getTsFrom1XBet = (gameType: string) => {
  const offsetMs = TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000
  const shifted = new Date(Date.now() + offsetMs)
  const localMidnightUtcMs = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate()
  )
  const localMidnightRealMs = localMidnightUtcMs - offsetMs
  const daysAhead = gameType === GAME_TYPES.EARLY ? 1 : 0

  return Math.floor(localMidnightRealMs / 1000) + daysAhead * 86400
}

export const buildAsiaGetGamesUrl1XBet = (gameType: string, tsFrom: number, count = 40) => {
  const params = new URLSearchParams({
    item: gameType === GAME_TYPES.RUNNING ? '0' : '1',
    sports: '1',
    count: String(count),
    cfview: '16',
    partner: '1',
    lng: 'en',
    country: '218',
    gr: '1195',
    sportList: '1'
  })

  if (gameType === GAME_TYPES.EARLY || gameType === GAME_TYPES.TODAY) {
    params.set('isSubGames', 'true')
  }

  if (gameType !== GAME_TYPES.RUNNING) {
    params.set('tsFrom', String(tsFrom))
    params.set('tsTo', String(tsFrom + 86400))
  }

  const endpoint =
    gameType === GAME_TYPES.RUNNING
      ? API_ENDPOINTS.ASIA_GET_GAMES_LIVE
      : API_ENDPOINTS.ASIA_GET_GAMES_LINE

  return `${endpoint}?${params.toString()}`
}

export const buildGameEventsUrl1XBet = (gameId: number, gameType?: string) => {
  const params = new URLSearchParams({
    cfView: '16',
    countEvents: '250',
    country: '43',
    fcountry: '218',
    gameId: String(gameId),
    gr: '1195',
    grMode: '4',
    lng: 'en',
    marketType: '1',
    ref: '1'
  })

  const endpoint =
    gameType === GAME_TYPES.RUNNING ? API_ENDPOINTS.GAME_EVENTS_LIVE : API_ENDPOINTS.GAME_EVENTS

  return `${endpoint}?${params.toString()}`
}

export const X_FC = '2d818a035184d49138c48abfb68279a27f5f21cccc62629214947ec755e9cc6d'

const BASE_HEADERS_1XBET = {
  'Content-Type': 'application/json',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',

  'X-Requested-With': 'XMLHttpRequest',
  'Is-Srv': 'false',

  'Sec-CH-UA-Platform': '"Linux"',
  'Sec-CH-UA': '"Not;A=Brand";v="8", "Chromium";v="150"',
  'Sec-CH-UA-Mobile': '?0',

  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',

  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36'
} as const

const buildAccountHeaders1XBet = (account: AccountType) => ({
  ...(account?.customIP ? { 'X-Forwarded-For': account.customIP } : {}),
  ...(account?.cookie ? { Cookie: account.cookie } : {}),
  ...(account?.hdToken ? { 'X-Hd': account.hdToken } : {})
})

export const buildHeaders1XBet = (account: AccountType) => ({
  ...BASE_HEADERS_1XBET,

  'X-App-N': '__WELCOME_APP__',
  'X-Svc-Source': '__WELCOME_APP__',

  Origin: 'https://1xbetjap.com',
  Referer: 'https://1xbetjap.com/en',

  ...buildAccountHeaders1XBet(account),
  ...(account?.token ? { 'X-Auth': `Bearer ${account.token}` } : {})
})

export const buildCrawlHeaders1XBet = (account: AccountType) => ({
  ...BASE_HEADERS_1XBET,

  'X-App-N': '__BETTING_APP__',
  'X-Svc-Source': '__BETTING_APP__',
  'X-Mobile-Project-Id': '0',

  Referer: 'https://1xbetjap.com/en/line/football',

  ...buildAccountHeaders1XBet(account)
})
