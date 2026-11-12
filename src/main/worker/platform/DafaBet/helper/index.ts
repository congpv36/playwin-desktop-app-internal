import { FH, FT, SPREAD, TOTAL } from '@shared/common/constants'
import { AccountType } from '@shared/common/types'

import {
  EVENTS_API_HASH,
  EVENTS_API_LOCALE,
  getBaseUrl,
  NO_VALUE_DAFABET
} from '@/worker/platform/DafaBet/common/contants'
import {
  EventItem_DafaBet,
  Market_DafaBet,
  OpponentScore_DafaBet,
  Outcome_DafaBet
} from '@/worker/platform/DafaBet/common/types'

export function buildPlatformUrl(account: AccountType, type: string) {
  const url = getBaseUrl(account.loginURL)

  const urlMap: Record<string, string> = {
    LOGIN: `${url}en/api/plugins/component/route/header_login/authenticate`,
    BALANCE: `${url}en/api/plugins/component/route/balance/getdetailedbalances?ignore%5B%5D=7`
  }

  return urlMap[type] ?? url
}

export function buildCouponsUrl(couponId: string | number) {
  return `https://sports.dafabet.com/api/coupons/${couponId}?coupon_info=true&pub=${Math.floor(Date.now() / 1000)}&l=en&mc=web`
}

export function buildEventsUrl() {
  return `https://sports.dafabet.com/xapi/rest/events?hash=${EVENTS_API_HASH}&l=${EVENTS_API_LOCALE}`
}

export function buildBetslipSelectionsUrl() {
  return `https://sports.dafabet.com/xapi/rest/betslips/selections?l=${EVENTS_API_LOCALE}`
}

// TODO: min_amount is copied from the captured browser request, verify its meaning
export function buildPlaceBetUrl(accountId: string | number, uuid: string) {
  return `https://sports.dafabet.com/xapi/rest/accounts/${accountId}/betslips?valid=true&min_amount=4999&uuid=${uuid}&l=${EVENTS_API_LOCALE}`
}

export function buildCheckPlayerUrl() {
  return `https://sports.dafabet.com/xapi/icore/checkplayer?l=${EVENTS_API_LOCALE}`
}

export function getCookieValue(cookie: string, name: string) {
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? match[1] : ''
}

export function buildLiveEventsUrl() {
  const params = new URLSearchParams({
    allBettableEvents: 'true',
    bettable: 'true',
    includeHiddenOutcomes: 'true',
    includeLiveEvents: 'true',
    includeMarkets: 'true',
    lightWeightResponse: 'true',
    liveAboutToStart: 'true',
    liveExcludeLongTermSuspended: 'true',
    liveMarketStatus: 'OPEN,SUSPENDED',
    marketFilter: 'GAME',
    marketStatus: 'OPEN',
    sortMarketsByPriceDifference: 'true',
    sportGroups: 'REGULAR',
    periodType: 'IN_RUNNING',
    eventPathIds: '240',
    liveOnly: 'true',
    marketTypeIds: '1,12,13,350,605,2101,2722,3007,3021,13005,40671624',
    periodTypeIds: '200,201,202',
    excludeLongTermSuspended: 'true',
    excludeMarketByOpponent: 'true',
    maxMarketsPerMarketType: '5',
    maxMarketPerEvent: '100',
    l: EVENTS_API_LOCALE
  })

  return `https://sports.dafabet.com/xapi/rest/events?${params.toString()}`
}

const MS_PER_HOUR = 3_600_000
const VN_OFFSET_MS = 7 * MS_PER_HOUR
const LOOKBACK_HOURS = 2
const MS_PER_DAY = 24 * MS_PER_HOUR

function toVnIsoString(utcMs: number) {
  const d = new Date(utcMs + VN_OFFSET_MS)
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}+07:00`
}

export function buildEventsDateRange(now: Date = new Date()) {
  const lookbackMs = now.getTime() - LOOKBACK_HOURS * MS_PER_HOUR
  const dateFromMs = lookbackMs - (lookbackMs % MS_PER_HOUR)

  const dateToMs = dateFromMs + MS_PER_DAY - 1

  return {
    dateFrom: toVnIsoString(dateFromMs),
    dateTo: toVnIsoString(dateToMs)
  }
}

export function getVnDateKey(date: Date) {
  const vn = new Date(date.getTime() + VN_OFFSET_MS)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${vn.getUTCFullYear()}-${pad(vn.getUTCMonth() + 1)}-${pad(vn.getUTCDate())}`
}

export function getMarketOddInfo(market: Market_DafaBet) {
  if (market.status !== 'open') return null

  const period = market.period?.fullAbbreviation

  if (market.description === 'Asian Handicap') {
    if (period === 'FT') return { type: 'HDP', typeOdd: SPREAD, number: FT }
    if (period === '1H') return { type: 'HDP', typeOdd: SPREAD, number: FH }
    return null
  }

  if (market.description === 'Over/Under') {
    if (period === 'FT') return { type: 'OU', typeOdd: TOTAL, number: FT }
    if (period === '1H') return { type: 'OU', typeOdd: TOTAL, number: FH }
    return null
  }

  return null
}

export function convertDecimalToMalay(decimal: number) {
  const malay = decimal >= 2 ? -1 / (decimal - 1) : decimal - 1
  return Number(malay.toFixed(3))
}

export function convertMalayToDecimal(malay: number) {
  const decimal = malay >= 0 ? 1 + malay : 1 - 1 / malay
  return Number(decimal.toFixed(3))
}

export function buildHdpPoint(outcome: Outcome_DafaBet) {
  const key1 = Number(outcome.extraKey1)
  if (outcome.extraKey2 === NO_VALUE_DAFABET) return key1

  return (key1 + Number(outcome.extraKey2)) / 2
}

export const EVENTS_PER_PAGE = 100

export function buildEventsPayload(
  eventPathIds: string,
  page: number = 1,
  { dateFrom, dateTo } = buildEventsDateRange()
) {
  return {
    allBettableEvents: true,
    bettable: true,
    includeHiddenOutcomes: true,
    includeMarkets: true,
    lightWeightResponse: true,
    marketFilter: 'GAME',
    marketStatus: 'OPEN',
    sportGroups: 'REGULAR',
    sortMarketsByPriceDifference: true,
    periodType: 'PRE_MATCH',
    includeHiddenMarkets: false,
    eventType: 'GAME',
    eventPathIds,
    eventsPerPage: EVENTS_PER_PAGE,
    page,
    dateFrom,
    dateTo,
    sortByEventpath: true,
    sortByEventpathIds: eventPathIds,
    excludeLongTermSuspended: true,
    excludeMarketByOpponent: true,
    maxMarketsPerMarketType: 5,
    maxMarketPerEvent: 100,
    marketTypeIds: '1,12,13,350,605,2101,2722,3007,3021,13005,40671624',
    periodTypeIds: '100,102'
  }
}

const findOpponentScore = (list: OpponentScore_DafaBet[] | null | undefined, opponentId?: number) =>
  list?.find((item) => item.opponentId === opponentId)

export function buildLiveScore(event: EventItem_DafaBet, homeId?: number, awayId?: number) {
  const scoreList = event.scores?.score
  const home = findOpponentScore(scoreList, homeId)?.formattedPoints ?? '0'
  const away = findOpponentScore(scoreList, awayId)?.formattedPoints ?? '0'
  return `${home}-${away}`
}

export function buildLiveRedCard(event: EventItem_DafaBet, homeId?: number, awayId?: number) {
  const home = findOpponentScore(event.match, homeId)?.redCards ?? 0
  const away = findOpponentScore(event.match, awayId)?.redCards ?? 0
  return `${home}-${away}`
}

export function buildLiveStat(event: EventItem_DafaBet) {
  const period =
    `${event.currentPeriod ?? ''} ${event.currentPeriodAbbreviation ?? ''}`.toLowerCase()
  if (period.includes('half time') || period.includes('halftime') || /\bht\b/.test(period)) {
    return 'HT'
  }

  const periodNumber = event.currentPeriodNumber
  const minutes = event.clock?.minutes
  if ((periodNumber === 1 || periodNumber === 2) && typeof minutes === 'number') {
    return `${periodNumber}H ${minutes}'`
  }

  return 'LIVE'
}
