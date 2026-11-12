import { DataCrawlType } from '@shared/common/types'

import { checkBetLimitPlatform } from '@/worker/lib/checkBetLimitPlatform'
import { checkMatchLeagueFilterRule } from '@/worker/lib/checkMatchLeagueFilterRule'

export function isValidData(data: DataCrawlType): boolean {
  if (!data?.league || !data?.home || !data?.away) return false
  if (checkMatchLeagueFilterRule(data.league)) return false
  if (
    checkBetLimitPlatform({
      league: data.league,
      home: data.home,
      away: data.away,
      platform: data.platform
    })
  )
    return false

  return true
}

export function createIsValidData() {
  const leagueBlocked = new Map<string, boolean>()
  const betLimitReached = new Map<string, boolean>()

  return (data: DataCrawlType): boolean => {
    if (!data?.league || !data?.home || !data?.away) return false

    let blocked = leagueBlocked.get(data.league)
    if (blocked === undefined) {
      blocked = checkMatchLeagueFilterRule(data.league)
      leagueBlocked.set(data.league, blocked)
    }
    if (blocked) return false

    const limitKey = `${data.league}\u0001${data.home}\u0001${data.away}\u0001${data.platform}`
    let limited = betLimitReached.get(limitKey)
    if (limited === undefined) {
      limited = checkBetLimitPlatform({
        league: data.league,
        home: data.home,
        away: data.away,
        platform: data.platform
      })
      betLimitReached.set(limitKey, limited)
    }
    return !limited
  }
}
