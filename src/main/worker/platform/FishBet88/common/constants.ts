import { FH, FT, GAME_TYPES, SPREAD, TOTAL } from '@shared/common/constants'

// API host is shared by the white-label frontend (see fishbet88.com/Scripts/settings/env.prod.js -> apiHost)
export const API_HOST_FISHBET88 = 'https://api2.linkv2.com'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'

type HeaderAccount = { customIP?: string | null; loginURL: string }

const buildBaseHeaders = (account: HeaderAccount) => {
  const origin = account.loginURL.replace(/\/$/, '')

  return {
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'User-Agent': USER_AGENT,
    Origin: origin,
    Referer: `${origin}/`,
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Fetch-Mode': 'cors',
    ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
  }
}

export const buildHeadersApi = (account: HeaderAccount, accessToken?: string) => ({
  ...buildBaseHeaders(account),
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Sec-Fetch-Dest': 'empty',
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
})

export const buildHeadersCaptcha = (account: HeaderAccount) => ({
  ...buildBaseHeaders(account),
  Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Sec-Fetch-Dest': 'image'
})

// Odds feed used by the sportsbook lobby (lobby.sspv2.com). Public endpoints: no token / uid needed.
export const ODDS_HOST_FISHBET88 = 'https://hv2.link333.com'
export const LOBBY_ORIGIN_FISHBET88 = 'https://lobby.sspv2.com'

/** `marketID` of the odds feed per game type. */
export const MARKET_ID_FISHBET88: Partial<Record<string, number>> = {
  [GAME_TYPES.TODAY]: 0,
  [GAME_TYPES.RUNNING]: 1,
  [GAME_TYPES.EARLY]: 2
}

export const MARKET_ID_RUNNING_FISHBET88 = 1

export const SPORT_ID_SOCCER_FISHBET88 = 1

export const buildHeadersOdds = (account: { customIP?: string | null }) => ({
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'User-Agent': USER_AGENT,
  Origin: LOBBY_ORIGIN_FISHBET88,
  Referer: `${LOBBY_ORIGIN_FISHBET88}/`,
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'cross-site',
  ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
})

/**
 * Lines read from each odds row. `fav` is the favourite side of a handicap line
 * (1 = home, 2 = away); totals have none.
 */
export const ODDS_LINES_FISHBET88 = [
  {
    typeOdd: SPREAD,
    type: 'HDP',
    number: FT,
    point: 'FTHDP',
    home: 'FTH',
    away: 'FTA',
    fav: 'FTFav'
  },
  { typeOdd: TOTAL, type: 'OU', number: FT, point: 'FTOU', home: 'FTO', away: 'FTU' },
  {
    typeOdd: SPREAD,
    type: 'HDP',
    number: FH,
    point: 'FHHDP',
    home: 'FHH',
    away: 'FHA',
    fav: 'FHFav'
  },
  { typeOdd: TOTAL, type: 'OU', number: FH, point: 'FHOU', home: 'FHO', away: 'FHU' }
] as const

/** `POST /api/play/login` returns the URL of the sportsbook lobby (see global-setting.js -> vendor_login_url). */
export const OPEN_GAME_HOST_FISHBET88 = 'https://opengameapi.linkv2.com'

/** `ts` of the lobby is the current time in GMT+8, in seconds. */
export const LOBBY_TS_OFFSET_SECONDS_FISHBET88 = 8 * 3600

/** Headers of the lobby `/Bet/*` calls (same-origin XHR from the lobby page). */
export const buildHeadersLobby = (
  account: { customIP?: string | null },
  session: { cookie: string; lobbyUrl: string }
) => ({
  Accept: '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'User-Agent': USER_AGENT,
  Referer: session.lobbyUrl,
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'X-Requested-With': 'XMLHttpRequest',
  ...(session.cookie ? { Cookie: session.cookie } : {}),
  ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
})

/**
 * Codes of the lobby bet API per line.
 * Confirmed from a real bet: FT handicap home = gameType `hd`, eventCode `f`, betType `h`.
 * The others (`ou`, `h` for 1st half, `a` / `o` / `u`) follow the same naming and still need a real capture to confirm.
 */
export const BET_CODES_FISHBET88 = {
  gameType: { HDP: 'hd', OU: 'ou' },
  eventCode: { FT: 'f', FH: 'h' },
  betType: { home: 'h', away: 'a', over: 'o', under: 'u' }
} as const

/**
 * GetPlaceBetInfo2 on the STEP page (isParlay / isStep) always answers a real odds 0.01 (Malay) lower
 * than the public feed (GetNewMoreBetOdds), e.g. feed 0.90 -> lobby 0.89, feed -0.97 -> lobby -0.98.
 * Applied to the feed odds of Today / Early so the crawl shows the odds that can really be bet.
 */
export const STEP_FEED_ODDS_DIFF_FISHBET88 = -0.01
