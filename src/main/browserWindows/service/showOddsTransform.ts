import {
  DataCrawlType,
  ShowOddsLeagueEntry,
  ShowOddsMarketRow,
  ShowOddsResult
} from '@shared/common/types'

type PrevRawEntry = { home_over: number; away_under: number }
type Position = { li: number; mi: number }

const prevRawByPlatform = new Map<string, Map<number, PrevRawEntry>>()
const positionMapByPlatform = new Map<string, Map<number, Position>>()

function transformRawData(rawData: DataCrawlType[]): {
  entries: ShowOddsLeagueEntry[]
  positionMap: Map<number, Position>
} {
  const positionMap = new Map<number, Position>()

  type MatchData = {
    home: string
    away: string
    league: string
    gameType: string
    date: string
    time: string
    score: string
    stat: string
    eventOrder: number[]
    eventMap: Map<number, DataCrawlType[]>
  }
  const leagueOrder: string[] = []
  const leagueMap = new Map<string, { matchOrder: string[]; matchMap: Map<string, MatchData> }>()

  for (const row of rawData) {
    const leagueKey = row.uuidLeague ?? row.nameLeague
    if (!leagueMap.has(leagueKey)) {
      leagueMap.set(leagueKey, { matchOrder: [], matchMap: new Map() })
      leagueOrder.push(leagueKey)
    }
    const leagueData = leagueMap.get(leagueKey)!
    const matchKey = `${row.nameHome}__${row.nameAway}`
    if (!leagueData.matchMap.has(matchKey)) {
      leagueData.matchMap.set(matchKey, {
        home: row.nameHome,
        away: row.nameAway,
        league: row.nameLeague,
        gameType: row.gameType,
        date: row.date,
        time: row.time,
        score: row.score,
        stat: row.stat,
        eventOrder: [],
        eventMap: new Map()
      })
      leagueData.matchOrder.push(matchKey)
    }
    const matchData = leagueData.matchMap.get(matchKey)!
    matchData.gameType = row.gameType
    matchData.date = row.date
    matchData.time = row.time
    matchData.score = row.score
    matchData.stat = row.stat
    if (!matchData.eventMap.has(row.idEvent)) {
      matchData.eventMap.set(row.idEvent, [])
      matchData.eventOrder.push(row.idEvent)
    }
    matchData.eventMap.get(row.idEvent)!.push(row)
  }

  const entries: ShowOddsLeagueEntry[] = []
  let li = 0

  for (const leagueKey of leagueOrder) {
    const { matchOrder, matchMap } = leagueMap.get(leagueKey)!
    for (const matchKey of matchOrder) {
      const { home, away, league, gameType, date, time, score, stat, eventOrder, eventMap } =
        matchMap.get(matchKey)!
      const markets: ShowOddsMarketRow[] = []
      let mi = 0

      for (const eventId of eventOrder) {
        const rows = eventMap.get(eventId)!

        const hdpMatchRows = rows.filter((r) => r.type === 'HDP' && r.number === 0)
        const ouMatchRows = rows.filter((r) => r.type === 'OU' && r.number === 0)
        const hdpHalfRows = rows.filter((r) => r.type === 'HDP' && r.number === 1)
        const ouHalfRows = rows.filter((r) => r.type === 'OU' && r.number === 1)

        if (
          !hdpMatchRows.length &&
          !ouMatchRows.length &&
          !hdpHalfRows.length &&
          !ouHalfRows.length
        )
          continue

        const numLines = Math.max(hdpMatchRows.length, ouMatchRows.length) || 1

        for (let lineIdx = 0; lineIdx < numLines; lineIdx++) {
          const hdpMatch = hdpMatchRows[lineIdx] ?? null
          const ouMatch = ouMatchRows[lineIdx] ?? null
          const hdpHalf = hdpHalfRows[lineIdx] ?? null
          const ouHalf = ouHalfRows[lineIdx] ?? null

          positionMap.set(eventId, { li, mi })

          const anyRow = hdpMatch ?? ouMatch ?? hdpHalfRows[0] ?? ouHalfRows[0]!

          const market: ShowOddsMarketRow = {
            match: {
              hdp: hdpMatch
                ? {
                    homeOdd: hdpMatch.home_over,
                    line: hdpMatch.HDP,
                    awayOdd: hdpMatch.away_under,
                    hdp_point: hdpMatch.hdp_point,
                    meta: hdpMatch
                  }
                : { homeOdd: 0, line: '-', awayOdd: 0, hdp_point: 0, meta: anyRow },
              ou: ouMatch
                ? {
                    homeOdd: ouMatch.home_over,
                    line: ouMatch.HDP,
                    awayOdd: ouMatch.away_under,
                    hdp_point: ouMatch.hdp_point,
                    meta: ouMatch
                  }
                : { homeOdd: 0, line: '-', awayOdd: 0, hdp_point: 0, meta: anyRow }
            }
          }

          if (hdpHalf || ouHalf) {
            market.firstHalf = {
              hdp: hdpHalf
                ? {
                    homeOdd: hdpHalf.home_over,
                    line: hdpHalf.HDP,
                    awayOdd: hdpHalf.away_under,
                    hdp_point: hdpHalf.hdp_point,
                    meta: hdpHalf
                  }
                : undefined,
              ou: ouHalf
                ? {
                    homeOdd: ouHalf.home_over,
                    line: ouHalf.HDP,
                    awayOdd: ouHalf.away_under,
                    hdp_point: ouHalf.hdp_point,
                    meta: ouHalf
                  }
                : undefined
            }
          }

          markets.push(market)
          mi++
        }
      }

      if (markets.length > 0) {
        entries.push({ league, home, away, gameType, date, time, score, stat, markets })
        li++
      }
    }
  }

  return { entries, positionMap }
}

export function processShowOdds(rawData: DataCrawlType[], platform: string): ShowOddsResult {
  if (!rawData.length) return { data: [], changedKeys: [] }

  const prevRaw = prevRawByPlatform.get(platform) ?? new Map<number, PrevRawEntry>()
  const prevPositionMap = positionMapByPlatform.get(platform) ?? new Map<number, Position>()

  const changedKeys: string[] = []
  for (const row of rawData) {
    const prev = prevRaw.get(row.id)
    if (prev) {
      const pos = prevPositionMap.get(row.idEvent)
      if (pos) {
        const prefix = row.type.toLowerCase() as 'hdp' | 'ou'
        if (prev.home_over !== row.home_over) {
          changedKeys.push(`${pos.li}_${pos.mi}_${prefix}_homeOdd`)
        }
        if (prev.away_under !== row.away_under) {
          changedKeys.push(`${pos.li}_${pos.mi}_${prefix}_awayOdd`)
        }
      }
    }
  }

  const { entries, positionMap } = transformRawData(rawData)

  prevRawByPlatform.set(
    platform,
    new Map(rawData.map((r) => [r.id, { home_over: r.home_over, away_under: r.away_under }]))
  )
  positionMapByPlatform.set(platform, positionMap)

  return { data: entries, changedKeys }
}
