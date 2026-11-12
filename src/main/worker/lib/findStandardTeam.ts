import db from '@db/config/database'
import { getCacheVersion, NAME_TEAM_CACHE_KEY } from '@db/model'

type StandardTeam = { team: string | null; league: string | null }

type FindStandardTeamQuery = {
  platform: string
  nameLeague: string | null | undefined
  nameTeam: string | null | undefined
}

const VERSION_CHECK_INTERVAL_MS = 2000
const MAX_CACHE_SIZE = 50_000

const cache = new Map<string, StandardTeam | null>()
let cacheVersion = -1
let lastVersionCheck = 0
let findStmt: { get: (...params: string[]) => StandardTeam | undefined } | null = null

const syncCacheVersion = () => {
  const now = Date.now()
  if (now - lastVersionCheck < VERSION_CHECK_INTERVAL_MS) return
  lastVersionCheck = now

  const version = getCacheVersion(NAME_TEAM_CACHE_KEY)
  if (version !== cacheVersion) {
    cache.clear()
    cacheVersion = version
  }
}

export const findStandardTeam = ({
  platform,
  nameLeague,
  nameTeam
}: FindStandardTeamQuery): StandardTeam | undefined => {
  if (nameLeague == null || nameTeam == null) return undefined

  syncCacheVersion()

  const key = `${platform}\u0001${nameLeague}\u0001${nameTeam}`
  const cached = cache.get(key)
  if (cached !== undefined) return cached ?? undefined

  findStmt ??= db.prepare(
    `SELECT team, league FROM NameTeam
     WHERE platform = ? AND nameLeague = ? AND nameTeam = ?
     LIMIT 1`
  )
  const result = findStmt!.get(platform, nameLeague, nameTeam)

  if (cache.size >= MAX_CACHE_SIZE) cache.clear()
  cache.set(key, result ?? null)

  return result
}
