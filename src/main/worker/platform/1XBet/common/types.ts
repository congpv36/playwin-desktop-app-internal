export interface AuthUser {
  id: number
  name: string
  surname: string
  country: string
  country_id: number
  region: string
  city: string
  video_id: string
  sport_radar_login: string
  show_agreement_popup: boolean
}

export interface VerifyResponse {
  token: string
  extra_ctoken: string
  expiresAt: number
}

export interface AuthResponse {
  success: boolean
  type: number
  message: string
  need_reload: boolean
  user: AuthUser
  token: string
  tokenExpiry: number
}

export interface BalanceResponse {
  balance: Balance[]
  bonus: unknown[]
  all_accounts: AllAccount[]
  has_bets: boolean
  is_available_first_deposit_bonus: boolean
  pointsAccountTitle: string
}

export interface Balance {
  id: number
  money: number
  lineRestrict: number
  liveRestrict: number
  BetVivaroBalance: number
  fantasy_virt_balance: number
  idCurrecy: number
  kode: string
  HasPromoStavka: number
  firstdep: number | null
  firstdepbonus: number | null
  hasbonus: number
  refID: number | null
  PointsBalance: number
  idException: number | null
  TypeAccount: number
  line_type: number
  need_ban: number
  Bonus: number
  typ: number
  alias: string
  MinOutDeposite: number
  MinOutElectronDeposite: number
  MinInElectronDeposite: number
  freespins: unknown | null
  AccountName: string
  currencySymbol: string
  summ_unplaced_bets: number
}

export interface AsiaOdd {
  T: number
  P?: number
  C: number
  CV?: string
  PV?: string
  G: number
  CE?: number
}

export interface AsiaSubGame {
  I: number
  PN: string
  E: AsiaOdd[]
}

export interface AsiaGameScore {
  FS?: {
    S1?: number
    S2?: number
  }
  TS?: number
  CP?: number
  CPS?: string
}

export interface AsiaGame {
  I: number
  LI: number
  L: string
  O1: string
  O2: string
  S: number
  E: AsiaOdd[]
  SG?: AsiaSubGame[]
  SC?: AsiaGameScore
}

export interface AsiaGetGamesResponse {
  Success: boolean
  Value: AsiaGame[]
}

export interface GameEvent {
  type: number
  parameter?: number
  cf: number
  cfView: string
  isCenter?: boolean
  eventParams?: { params: string[] }
}

export interface EventGroup {
  groupId: number
  shortGroupId: number
  events: GameEvent[][]
}

export interface SubGameForMainGame {
  id: number
  constId?: number
  period?: number
  subGameName?: string
  eventGroups: EventGroup[]
}

export interface GameEventsResponse {
  eventGroups: EventGroup[]
  subGamesForMainGame: SubGameForMainGame[]
}

export interface AllAccount {
  id: number
  typ: number
  name: string
  idException: number | null
  money: number
  BonusName: string
  IdForTranslate: number | null
  dt: string | null
  Bonus: number
  Currenty: number
  activate: string | null
  idBonus: number
  Temporary: number
  kode: string
  currencySymbol: string
}

export interface UpdateCouponEvent {
  Coef: number
  CV: string
  PV: string | null
  Param: number
  Type: number
  UiFeature: unknown | null
  GameId: number
  Kind: number
  PlayerId: number
  Block: boolean
  Seconds: number
  Expired: number
  Price: number
  InstrumentId: number
  IsRelation: number
  IsBannedExpress: boolean
  FullScore: number
  PeriodScores: unknown | null
  ExtraKind: number
  MS1: unknown | null
  MS2: unknown | null
  FS1: unknown | null
  FS2: unknown | null
  PS: unknown | null
  SportId: number
  ChampId: number
  GameVid: string
  GameTypeId: number
  Start: number
  PeriodName: string
  PlayersDuel: {
    Team1Ids: number[] | null
    Team2Ids: number[] | null
  }
  TimeSec: number
  TimeDirection: number
  FullName: string | null
  Finish: boolean
  GameConstId: number
}

export interface UpdateCouponValue {
  UserId: number
  UserIdBonus: number
  CustomerId: unknown | null
  ManagerId: unknown | null
  DebitFrom: unknown | null
  Summ: number
  Vid: number
  BonusCode: unknown | null
  TerminalCode: unknown | null
  TerminalCodeWeb: unknown | null
  Code: number
  NeedUpdateLine: boolean
  CheckCf: number
  Source: number
  CouponCode: unknown | null
  Events: UpdateCouponEvent[]
  Lng: string
  changeCf: boolean
  CfView: number
  partner: number
  promo: unknown | null
  promoCodes: unknown | null
  notWait: boolean
  betGUID: unknown | null
  avanceBet: boolean
  expressNum: number
  SaleBetId: number
  IsPowerBet: boolean
  exceptionText: string | null
  Top: number
  WithLobby: boolean
  EventsIndexes: unknown | null
  GroupsSumms: unknown | null
  Coef: number
  AntiExpressCoef: number
  ExpresCoef: number
  Kind: number
  notLogin: boolean
  Groups: unknown | null
  Sport: number
  maxBet: number
  minBet: number
  MinBetSystem: unknown | null
  IsMatchOfDay: boolean
  OneClickBet: number
  InitialBet: number
  BetStep: number
  CoefView: string
  Group: number
  Country: number
  Currency: number
  CoefType: number
  HyperBonusAvailable: boolean
  specialTypes: number
  EachWayBet: boolean
  PossibleWinCoef: number
}

export interface UpdateCouponResponse {
  Value: UpdateCouponValue
  Id: number
  Success: boolean
  Error: string
  ErrorCode: number
}

export interface MakeBetCouponEvent extends UpdateCouponEvent {
  ParamMobile: string
  OriginalPlayerId: number
}

export interface MakeBetCoupon
  extends Omit<UpdateCouponValue, 'Events' | 'InitialBet' | 'BetStep' | 'Country' | 'Currency'> {
  Events: MakeBetCouponEvent[]
  TransformEventKind: boolean
  autoBetCfView: string
}

export interface MakeBetValue {
  Id: number
  Balance: number
  PayoutType: number
  Coupon: MakeBetCoupon
  Dt: string
  lvC: boolean
  lnC: boolean
  waitTime: number
  betGUID: string | null
  SummPrep: number
  FailInfo: string | null
  CanPrint: boolean
}

export interface MakeBetResponse {
  Value: MakeBetValue
  Id: number
  Success: boolean
  Error: string
  ErrorCode: number
}
