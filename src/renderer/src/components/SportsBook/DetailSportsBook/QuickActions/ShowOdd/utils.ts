import { FlatRow, LeagueEntry } from './types'

export function flattenData(data: LeagueEntry[]): FlatRow[] {
  const rows: FlatRow[] = []
  let lastLeague = ''
  let matchIndexInLeague = 0
  data.forEach((entry, li) => {
    if (entry.league !== lastLeague) {
      rows.push({ type: 'league', key: `l-${li}`, league: entry.league })
      lastLeague = entry.league
      matchIndexInLeague = 0
    } else {
      matchIndexInLeague++
    }
    rows.push({
      type: 'match',
      key: `m-${li}`,
      leagueIndex: li,
      matchIndexInLeague,
      league: entry.league,
      home: entry.home,
      away: entry.away,
      gameType: entry.gameType,
      date: entry.date,
      time: entry.time,
      score: entry.score,
      stat: entry.stat,
      markets: entry.markets.map((market, mi) => ({
        mi,
        match: market.match,
        firstHalf: market.firstHalf
      }))
    })
  })
  return rows
}
