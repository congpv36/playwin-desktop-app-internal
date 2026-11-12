import type {
  DataCrawlType as MatchMeta,
  ShowOddsHalfMarket as HalfMarket,
  ShowOddsLeagueEntry as LeagueEntry,
  ShowOddsMarketRow as MarketRow,
  ShowOddsMatchMarket as MatchMarket,
  ShowOddsOddCell as OddCell
} from '@shared/common/types'

export type { HalfMarket, LeagueEntry, MarketRow, MatchMarket, MatchMeta, OddCell }

export type FlatLeagueRow = { type: 'league'; key: string; league: string }
export type MatchLine = { mi: number; match: MatchMarket; firstHalf?: HalfMarket }

export type FlatMatchRow = {
  type: 'match'
  key: string
  leagueIndex: number
  matchIndexInLeague: number
  league: string
  home: string
  away: string
  gameType: string
  date: string
  time: string
  score: string
  stat: string
  markets: MatchLine[]
}
export type FlatRow = FlatLeagueRow | FlatMatchRow

export type OddModalInfo = {
  league: string
  home: string
  away: string
  marketType: 'HDP' | 'OU'
  half: 'Match' | '1st Half'
  side: 'Home' | 'Away' | 'Over' | 'Under'
  line: string
  hdp_point: number
  value: number
  homeOdd: number
  awayOdd: number
  meta: MatchMeta
  account?: MockAccountInfo
}

export type MockAccountInfo = {
  id: string
  loginID: string
  platform: string
  credit: string
}
