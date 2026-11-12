export interface ResAuth_Wbet {
  status: number
  statusdesc: string
  member_profile: {
    player_info: PlayerInfo[]
    player_wallet: PlayerWallet[]
    player_bet_limit: PlayerBetLimit[]
  }
}

export interface PlayerInfo {
  account_id: string
  profile_id: string
  parent_id: string
  status: string
  has_secondary_account: boolean
  first_time_login: boolean
  comm_type: string
  session_token: string
  nickname: string | null
  last_login_time: string // ISO datetime string
  vip_type: string
}

export interface PlayerWallet {
  available_balance: number
  frozen_balance: number
  currency_code: string
  cash_balance: number
  credit_limit: number
}

export interface PlayerBetLimit {
  a: string // Sport name
  b: number // Min bet
  c: number // Max bet per match
  d: number // Max bet per day
}

interface OddsCheckDetail {
  member_id: string
  odds_id: number
  odds_new: number | null
  odds_display_new: number | null
  odds_change: boolean
  min_bet: number
  max_bet: number
  max_parlay_payout: number | null
  home_giving: boolean
  ball_new: number | null
  ball_display_new: number | null
  ball_change: boolean | null
}

export interface TypeGetTickets_WBet {
  status: number
  statusdesc: string
  odds_check_details: OddsCheckDetail[]
}

export interface BetCheckResponse {
  status: number
  statusdesc: string
  bet_id: number
  pending_bet: boolean
  retrieve_profile: boolean
}
