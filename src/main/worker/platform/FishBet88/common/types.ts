export type ApiResponse_FishBet88<T> = {
  Result: T
  TargetUrl: string | null
  Success: boolean
  Error: { Code: number; Message: string; Metadata: unknown } | null
  Message: string | null
}

export type LoginModelResult_FishBet88 = {
  Token: string
}

export type LoginAccount_FishBet88 = {
  Id: number
  Username: string
  Currency: string
  CreditLimit: number
  UsedCredit: number
  Balance: number
  Suspended: boolean
}

export type LoginResult_FishBet88Raw = {
  ErrorCode: number
  Message: string
  AccessToken: string | null
  Account: LoginAccount_FishBet88 | null
  AttemptsRemain: number
  BlockedTimeInMinutes: number
}

export const LOGIN_CODE_FISHBET88 = {
  SUCCESS: 0,
  FAILED: 1,
  CAPTCHA_INVALID: 2,
  BLOCKED: 3,
  UNEXPECTED: -1
} as const

export type LoginResult_FishBet88 = {
  code: (typeof LOGIN_CODE_FISHBET88)[keyof typeof LOGIN_CODE_FISHBET88]
  message: string
  accessToken: string
  account: LoginAccount_FishBet88 | null
}

/** One odds row (a match can have several rows: main line + alternative lines). */
export type OddsRow_FishBet88 = {
  SportID: number
  MatchID: number
  LeagueID: number
  MarketID: number
  CurrentMarket: number
  FTFav: number
  FHFav: number
  KickOffDateTime: string
  HomeScore: string | null
  AwayScore: string | null
  /** Running only: "1" / "2" for the half being played. */
  MatchTimeHalf: string | null
  MatchTimeMinute: string | null
  HomeRedCard: number | null
  AwayRedCard: number | null
  LeagueName: string
  HomeTeamName: string
  AwayTeamName: string
  RowID: string
  IsMMKOddsMatch?: boolean | string | null
  FTHDP: number | null
  FTH: number | null
  FTA: number | null
  FTOU: number | null
  FTO: number | null
  FTU: number | null
  FHHDP: number | null
  FHH: number | null
  FHA: number | null
  FHOU: number | null
  FHO: number | null
  FHU: number | null
}

/**
 * GetOtherSportMixOdds (Today / Early): rows in `Matches`, decimal odds.
 * GetOtherSportOdds (Running): rows in `RunningMatches`, Malay odds.
 */
export type MatchesResponse_FishBet88 = {
  Matches: OddsRow_FishBet88[] | null
  RunningMatches: OddsRow_FishBet88[] | null
}

/** GetNewMoreBetOdds: every line of one match, odds in Malay format. */
export type MatchDetailResponse_FishBet88 = {
  Matches: OddsRow_FishBet88[] | null
  MatchID: string
}

/** Session of the sportsbook lobby (lobby.sspv2.com), needed by every `/Bet/*` call. */
export type LobbySession_FishBet88 = {
  /** `token` of the lobby URL, sent back as `authToken`. */
  authToken: string
  /** Lobby user id, e.g. `m0112qeg0ax`. */
  userId: string
  /** Cookies set by the lobby when the lobby URL is opened. */
  cookie: string
  /** Lobby URL, used as Referer. */
  lobbyUrl: string
  /** `ts` of the lobby page (`var ts = "..."`), fixed for the whole lobby session. */
  ts: number
  /**
   * `SSportStepOddsCal` of the lobby page (e.g. -0.02): added to every decimal odds of a STEP bet
   * (see $ConvertOdds in Betfred_common.js).
   */
  stepOddsCal: number
}

/**
 * Parsed `GET /Bet/GetPlaceBetInfo2` (pipe separated), e.g.
 * `701|0.83|51922221|0.50||||2|2|250.00000000|0|500|1.0000|1000||False|`.
 * Only the fields whose meaning is clear are named; the raw parts are kept for logging.
 */
export type PlaceBetInfo_FishBet88 = {
  raw: string
  parts: string[]
  code: string
  odds: number
  rowId: string
  handicap: string
  maxBet: number
  minBet: number
}

/** Everything placeBet needs, built by getTicket. */
export type TicketData_FishBet88 = {
  session: LobbySession_FishBet88
  /** STEP page (Today / Early) -> PlaceBetfredBet, single bet (Running) -> PlaceBet. */
  placePath: 'PlaceBetfredBet' | 'PlaceBet'
  /** Every query param of the place bet call except `amount` (and `_`). */
  betParams: Record<string, string>
  info: PlaceBetInfo_FishBet88
}

/** `GET /Bet/PlaceBetfredBet` (JSON). */
export type PlaceBetResponse_FishBet88 = {
  ID: number
  TicketNo: string | null
  UserId: string
  MatchId: string
  Odds: string
  BetAmount: number
  Status: number
  BetType: string
  BetFor: string
  Handicap: string
  RowId: string
  Message?: string | null
  ErrorMessage?: string | null
}
