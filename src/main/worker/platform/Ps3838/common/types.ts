export type TypeGetTickets_Ps3838 = {
  lineId: number
  altLineId: number
  odds: string | null
  status: string
  minStake: number | null
  maxStake: number | null
  maxPayout: number | null
  selectionId: string
  currentScore: string | null
  errorData: boolean
  errorCode: string | null
  oddsId: string
  gradingUnit: string
  minStakeWin: number
  maxStakeWin: number | null
  minStakeRisk: number | null
  maxStakeRisk: number | null
  minStakeBase: number | null
  oddsSelectionsType: string
  maxBetPerMatch: number | null
  maxBetPerMatchWin: number | null
  maxBetPerMatchBase: number | null
  originalOdds: number | null
  lastOdds: number | null
  vig: number | null
  hideMatchMax: boolean
  maxStakeBase: number
  league: string
  homeTeam: string
  awayTeam: string
  selection: string
  eventTeamType: number
  sportId: number
  betType: number
  leagueId: number
  eventId: number
  sport: string
  sportGroup: string
  periodNum: number
  betTypeDisp: string
  balance: number | null
  currencyCode: string
  pitcherHome: string | null
  pitcherAway: string | null
  baseBall: boolean
  inplay: boolean
  eventDate: number
  handicap: number
}

export type BetResponse_Ps3838 = {
  errorCode?: string
  errorMessage?: string

  response: {
    errorCode?: string
    wagerId: number
    status: string
    selectionId: string
    betId: number
    uniqueRequestId: string
    wagerType: string
    betterLineWasAccepted: boolean
    jsonString: string
    oddsId: string
    psBetVO: {
      betId: number
      uniqueRequestId: string
      wagerNumber: number
      placedAt: string
      betStatus: string
      betType: string
      win: number
      risk: number
      oddsFormat: string
      updateSequence: number
      sportId: number
      sportName: string
      leagueId: number
      leagueName: string
      eventId: number
      handicap: number
      price: number
      teamName: string
      team1: string
      team2: string
      periodNumber: number
      team1Score: number
      team2Score: number
      isLive: string
      eventStartTime: string
      resultingUnit: string
    }
    odds: number
  }[]
}

type ProductStatus = {
  BB: 'ACTIVE' | 'INACTIVE'
  PP: 'ACTIVE' | 'INACTIVE'
  EG: 'ACTIVE' | 'INACTIVE'
  ZNTH: 'ACTIVE' | 'INACTIVE'
  DG: 'ACTIVE' | 'INACTIVE'
  AG: 'ACTIVE' | 'INACTIVE'
  ION: 'ACTIVE' | 'INACTIVE'
  KY: 'ACTIVE' | 'INACTIVE'
  SB: 'ACTIVE' | 'INACTIVE'
  SG: 'ACTIVE' | 'INACTIVE'
  AGIN: 'ACTIVE' | 'INACTIVE'
  IFORIUM: 'ACTIVE' | 'INACTIVE'
  PLAYTECH: 'ACTIVE' | 'INACTIVE'
  VS: 'ACTIVE' | 'INACTIVE'
  CR855: 'ACTIVE' | 'INACTIVE'
}

export type resBalance_Ps3838 = {
  vSportStatus: 'ACTIVE' | 'INACTIVE'
  loginId: string
  outstanding: number
  totalMessage: number
  success: boolean
  cashBalance: number
  sumAnnouncement: number
  productStatus: ProductStatus
  currency: string
  betCredit: number
  currentTierId: number
  currencyUnit: number
}
