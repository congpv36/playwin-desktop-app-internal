export interface UserInfoResponse {
  NickName: string | null
  Balance: string
  GameBalance: string
  BetCredit: string
  Currency: string
  GivenCredit: string
  Outstanding: string
  LastLogin: string
  PassLast: string
  PassNextX: string
}

export interface DataOddsEarly {
  a: boolean
  f: string
  t: string
  today: unknown[]
}

export interface DataOddsNormal {
  a: boolean
  f: string
  t: string
  data: unknown[]
}

export type DataOddsResponse = DataOddsEarly | DataOddsNormal

// BetData chi tiết của kèo
interface BetData {
  D: number
  SD: number
  IP: boolean
  E: string // Giải đấu
  H: string // Đội nhà
  A: string // Đội khách
  T: string // Loại kèo (Handicap, OU, ...)
  BT: string // Tên đội/Over/Under
  B: string // Loại (Hdp, OU, ...)
  TP: number
  ST: string
  GT: number
  S: string | null
  CS: boolean
  GB: boolean
  CB: boolean
  BH: boolean
  HG: boolean
  EX: string | null
  AOS: number
  RB: string // Giá trị handicap
  O: number // Odds
  P: number
  C: boolean
  IN: number
  AX: number
  OT: string // Kiểu odds (MY, HK, EU)
  SP: string
  GD: string // Môn thể thao (Soccer, Basketball, ...)
}

// Payload chính
interface ResponseData {
  IsCombinParlay: boolean
  Delay: number
  IsAuthenticated: boolean
  Message: string
  CanClose: boolean
  StatusCode: number
  Parylay: boolean
  Code: string
  BetData: BetData
  Odds: number
  HomeScore: number
  AwayScore: number
  Ball: number
  IsHomeGive: boolean
  IsRun: boolean
  IsParlay2: boolean
  Min: number
  Max: number
}
export interface SetDataResponse {
  d: ResponseData
}

export interface BetNowResponse {
  d: {
    IsCombinParlay: boolean
    Delay: number
    IsAuthenticated: boolean
    Message: string
    CanClose: boolean
    StatusCode: number
    Parylay: boolean
    Code: string
    BetData: BetDataItem[]
    Odds: number
    HomeScore: number
    AwayScore: number
    Ball: number
    IsHomeGive: boolean
    IsRun: boolean
    IsParlay2: boolean
    Min: number
    Max: number
  }
}

interface BetDataItem {
  ActualAmt: number
  DangerStatus: string | null
  Hdp: number
  Is1H: boolean
  IsBetHome: boolean
  IsHomeGive: boolean
  IsRun: boolean
  ParDangerStatus: string | null
  RunAwayScore: number
  RunHomeScore: number
  MatchDate: string
  Odds: number
  ParOdds: number
  ParStatus: string | null
  ParTransType: string | null
  RefNo: string | null
  SocTransId: number
  SocTransParId: number
  TransDate: string | null
  TransType: string | null
  Away: string
  Home: string
  Choice: string
  GameType: string
  GameTypeDesc: string
  LeagueCode: string
  SocOddsListId: string
  Percent: number
  OddType: string
  EX: string | null
}
