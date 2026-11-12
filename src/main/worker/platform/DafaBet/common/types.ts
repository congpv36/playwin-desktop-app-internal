export type LoginResult_DafaBet = {
  code: number
  message: string
  cookie: string
}

export type AuthenticateResponse_DafaBet = {
  success?: boolean
  authenticated?: boolean
  hash?: string
  token?: string
  user?: { playerId: number; currency: string; country: string }
  code?: number
  reason?: string
  message?: string
  reasonJson?: { responseCode?: string; responseMessage?: string }
}

export type BalanceBreakdownItem_DafaBet = {
  label: string
  total: string | null
  totalToken: string
  totalFiat: string
}

export type BalanceResponse_DafaBet = {
  currency: string
  total: string
  breakdown: BalanceBreakdownItem_DafaBet[]
}

export type CouponsResponse_DafaBet = {
  id: number
  name: string
  created_at: string
  updated_at: string
  event_path_ids: number[]
}

export type EventPath_DafaBet = {
  id: number
  parentId: number
  description: string
  slug: string
}

export type Opponent_DafaBet = {
  id: number
  description: string
}

export type Outcome_DafaBet = {
  id: number
  description: string
  ordinalPosition: number
  extraKey1: number
  extraKey2: number
  consolidatedPrice: {
    currentPrice: {
      decimal: number
    }
  }
}

export type Period_DafaBet = {
  id: number
  fullAbbreviation: string
  fullDescription: string
}

export type Market_DafaBet = {
  id: number
  marketTypeId?: number
  description: string
  status: string
  periodId: number
  outcomes: Outcome_DafaBet[]
  period: Period_DafaBet
}

export type OpponentScore_DafaBet = {
  opponentId: number
  points: string
  formattedPoints: string
  redCards: number | null
}

export type Clock_DafaBet = {
  countDown: boolean
  minutes: number
  seconds: number
  status: string
}

export type EventItem_DafaBet = {
  id: number
  eventType: string
  description: string
  eventDate: string
  eventPaths: EventPath_DafaBet[]
  opponents: Opponent_DafaBet[]
  markets: Market_DafaBet[]
  match?: OpponentScore_DafaBet[] | null
  scores?: {
    period: string
    score: OpponentScore_DafaBet[]
  } | null
  currentPeriod?: string | null
  currentPeriodAbbreviation?: string | null
  currentPeriodNumber?: number | null
  clock?: Clock_DafaBet | null
}

export type BetslipSingle_DafaBet = {
  ref: string
  unitStake: number
  outcomeId: number
  marketId: number
  eventId: number
  outcomeState: string
  outcomeDescription: string
  price: string
  decimal: number
  priceDirection: string
  minBetStake: string
  maxBetStake: string
  enabled: boolean
  singleEnabled: boolean
  restricted: boolean
  message: string | null
  messageCode: string | null
  inRunning: boolean
}

export type BetslipResponse_DafaBet = {
  model: {
    singles: BetslipSingle_DafaBet[]
    errors: unknown[]
    availableBalance: number
    userAcceptOdds: string
  }
}

export type CheckPlayerResponse_DafaBet = {
  alsPlayerId?: number
  externalPlayerId?: string
  externalSessionToken?: string
  username?: string
  currency?: string
  expirationTimeInSeconds?: number
}

export type PlaceBetResponse_DafaBet = {
  model?: {
    betSlipId?: number
    reference?: string | null
    isPending?: boolean
    errors?: unknown[]
    singles?: BetslipSingle_DafaBet[]
  }
  errors?: unknown[]
  message?: string
}
