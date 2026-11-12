export interface LoginCheckinIndex {
  ErrorCode: number
  Data: {
    Pub: string
    Pri: string
    PriCount: string
    LasterMsgType: null | string
    LasterMsg: null | string
    LasterMsgId: null | string
    lbl_PrivateMsg: string
    TopPriMsgTest: string
    UMMessage: string
    '175': boolean
    '180': boolean
    '186': boolean
    '190': boolean
    '191': boolean
    '192': boolean
    '193': boolean
    '194': boolean
    '195': boolean
    '196': boolean
    '197': boolean
    '241': boolean
    at: string
    rt: string
    EOF: boolean
    LiveMarketOnly: boolean
    TMI: number
    BLMiniDelay: number
  }
}

type CommonType = {
  ErrorCode: number
  ErrorMsg: string | null
}

type BetTimeConstraintType = {
  EndTimestamp: number
}

export type DataTypeGetTickets_Viva88 = {
  TicketType: string
  Minbet: string
  Maxbet: string
  Bet: string
  QuickBet: string
  SeqNo: number
  Line: number
  DisplayHDP: string
  Hdp1: number
  Hdp2: number
  DisplayOdds: string
  DisplayOddsPair: string
  OddsBeforeOddsBoost: string
  OddsBoost: string
  sinfo: string
  OddsID: number
  Betteam: string
  LiveScore: boolean
  LiveHomeScore: number
  LiveAwayScore: number
  SuggestStake: number
  RecommendType: number
  BetID: string
  ChoiceValue: string
  BettypeName: string
  HomeId: number
  AwayId: number
  HomeName: string
  AwayName: string
  LeagueName: string
  Bettype: string
  ParentBetType: number
  SportType: number
  SportName: string
  GameName: string
  IsLive: boolean
  IsInPlay: boolean
  Matchid: number
  ParentMatchid: number
  MatchCode: string | null
  LeagueGroupId: number
  Code: number
  ErrorCode: number
  Message: string | null
  isOddsChange: boolean
  isLineChange: boolean
  isScoreChange: boolean
  AutoAcceptSec: string | null
  MRPercentage: string
  OddsInfo: string
  SrcOdds: number
  SrcOddsInfo: string
  OddsStatus: string
  UseBonus: number
  DisplayTime: string
  HasParlay: boolean
  PriceType: number
  BonusID: number
  BonusType: number
  BetHintMsg: string | null
  Common: CommonType
  Nolan: boolean
  Tenet: boolean
  PDHyalpsiD: string
  sddOyalpsiD: string
  riaPsddOyalpsiD: string
  BetRecommends: Array<unknown>
  Guid: string
  TicketTime: number
  IsOfferParlayBoost: boolean
  OddsPair: number
  LeagueId: number
  LuckyDrawMinBet: string | null
  BetTimeConstraint: BetTimeConstraintType
  OddsType: number
  IsCashoutEnabled: boolean
}

export type TypeGetTickets_Viva88 = {
  ErrorCode: number
  Serial: string
  Data: DataTypeGetTickets_Viva88[]
}

export interface TypeProcessBet {
  ErrorCode: number
  ErrorMsg: string | null
  Redirect: string | null
  Serial: string | null
  Data: unknown
}

export interface TypeGetBetListApi {
  ErrorCode: number
  ErrorMsg: string | null
  Redirect: string | null
  Serial: string | null
  Data: {
    ItemList: Item[]
    ErrorMsg: string | null
    Common: Common | null
  }
}

interface Item {
  Key: string
  OddsId: number
  DisplayOdds: string
  OddsBeforeOddsBoost: string
  OddsBoost: string
  MRPercentage: number
  DisplayHDP: string
  Hdp1: number
  Hdp2: number
  OddsInfo: string
  sinfo: string
  SrcOddsInfo: string
  BetID: string
  LeagueGroupId: number
  BetTeam: string
  ChoiceValue: string
  TransId_Cash: string
  TransId_Bonus: string
  Code: number
  Message: string
  isOddsChange: boolean
  isLineChange: boolean
  isScoreChange: boolean
  Stake: string
  Stake_Cash: string
  Stake_Bonus: string | null
  ActualStake_Cash: string
  ActualStake_Bonus: string | null
  LiveHomeScore: number
  LiveAwayScore: number
  TicketStatus: number
  IsInPlay: boolean
  IsLive: boolean
  PriceType: number
  TotalPerBet: number
  FinalBalance: string
  AdjustedMaxBet: number
  CheckWaitingTicket: boolean
  BetDelaySec: number
  ErrorCode: number
  TicketJson: string | null
  BetRecommendation: number[]
  BetRecommends: string | null
  Common: Common
  ACCode: string | null
  OddsType: number
  IsLuckyDrawBet: boolean
  UnderOverTicket: UnderOverTicket
  // Add other fields as necessary
}

interface Common {
  BetIP: string
  FakeIp: string
}

interface UnderOverTicket {
  TransID: string
  TransIDLicensee: string | null
  OddsID: number
  OddsTBType: number
  SportType: number
  BetType: number
  MatchSubType: number
  LicSpreadBetTypeGroupID: number
  ParentBetType: number
  LeagueID: number
  LeagueGroup: string
  LeagueGroupID: number
  HTeamID: number
  ATeamID: number
  BetTeam: string
  Handicap: string
  Hdp1: number
  Hdp2: number
  Odds: number
  OddsPair: number
  OddsBeforeRecommendOddsBoost: number
  OddsBoost: number
  DecOdds: number
  RollbackOdds: number
  CustOdds: number
  SrcOdds: number
  SrcOddsPair: number
  DepSpread: number
  ExSpread_CN88: number
  ThaiSpread: number
  CommGroup: number
  Sort: number
  minodds: number
  maxodds: number
  MRPercentage: number
  MRPercentageDisplay: string | null
  OddsSpreadA: number
  TraceableModel: TraceableModel
  LiveHomeScore: number
  LiveAwayScore: number
  Stake: number
  Stake_ToCompany: number
  ActualStake: number
  Stake_SeizeBet: number
  ActualStake_SeizeBet: number
  MatchID: number
  MatchCode: string | null
  ParentMatchID: number
  MatchLiveTimer: string
  isHT: boolean
  CsStatus: string | null
  IsCashoutEnabled: boolean
  IsNeutral: boolean
  IsLive: boolean
  Market: string
  OddsType: string
  OddsStatus: string
  AcceptBetterOdds: boolean
  KeepOdds: boolean
  UserID: number
  UserName: string
  UserGroup: string
  CustGroup: string | null
  UserMinBet: number
  UserMinBetLive: number
  UserSrecommend: number
  UserMrecommend: number
  UserRecommend: number
  UserCurrencyID: number
  UserCurrency: string
  UserVirtualrate: number
  SiteType: string
  SiteSpread: number
  SiteID: string | null
  DepositSiteType: number
  IsWapSite: boolean
  ThirdPartyType: number
  ThirdPartySeq: number
  SiteOddsGap: number
  AutoAcceptUsing: boolean
  AutoAcceptFlag: boolean
  AutoAcceptSec: number
  AutoAcceptCheckTime: string
  Resourceid: string
  IsFromPhoneBetting: boolean
  IsFromLucky: boolean
  OddsInfo: string
  OddsDetail: string | null
  IsBAUser: boolean
  NewOfferSetup: boolean
  IsWaiting: boolean
  IsInPlay: boolean
  IsTvFeed: boolean
  InPlayInfo: string
  LivePeriod: number
  PausePeriod: number
  LiveBetAcceptSec: number
  IsTest: boolean
  SeizeBetPercentage: number
  SeizeBetID: number
  RecommendType: number
  OddsBoostType: number
  SmartPunter_MaxBet: number
  SmartPunter_MaxPerBet: number
  BetLimit_MaxPerBet: number
  BetLimit_HouseMaxPerBet: number
  NewBetLimit_Maxbet: number
  NewBetLimit_MaxPerBet: number
  kickofftime: string
  PhoneBettingSetting: PhoneBettingSetting
  Common: Common
  ChkSetting: ChkSetting
  ExtInfo: ExtInfo
  Reserved_1: number
  Reserved_2: number
  Reserved_Str1: string | null
  Reserved_Str2: string | null
  BetTimeConstraint: BetTimeConstraint
  SingleWalletPlaceBetResponse: string | null
  SportTypeEnum: number
  BetTypeEnum: number
  ParentBetTypeEnum: number
  LicSiteSpread: number
  SiteAutobookieGroup: number
  OddsGroupGap: number
  SingleWayAutobookieGap: number
  MaxBet: number
  MaxBetDetail: string | null
  MatchMaxBetDetail: string | null
  MinBet: number
  MinBetDetail: string | null
  MaxPayout: number
  MaxPreBetDetail: string | null
  OddsMaxBet: number
  Profile: Profile
  IsUseUserSportSpread: boolean
  UserSportSpread: number
  UserActualrate: number
  PT: PT
  ExtraPositionTaking: number
  Commission: Commission
  ErrorCode: number
  ErrorCodeCategory: object
  ErrorCodeEnum: number
  ErrorMsg: string
  FinalBetDelaySec: number
  SingleWalletFinalBalance: number
  TransactionTime: string
  CreditSiteSpread: number
  GlobalShowTime: string
  DisplayTime: string
  HasParlay: boolean
  CurrencySpread: number
  MarketEnum: number
  BetAction: number
  TicketTime: number
  RewardModel: string | null
  AfterBetRecommendTickets: AfterBetRecommendTicket[]
  AdditionalPurchaseBetRecommendTickets: string | null
  ReservationTicketId: number
  LuckyDrawMinBet: string | null
  IsLuckyDrawBet: boolean
  AccumulateBalance: boolean
  ExtraInfos: string | null
}

interface TraceableModel {
  AutobookieCalcStake: string | null
}

interface PhoneBettingSetting {
  IsGraphButton: boolean
  GraphRemark: string | null
  AdminID: number
  HideTicket: boolean
  Using1X2AsiaHdp: boolean
  Using1X2Hdp: boolean
  IsKeyInDeadBallLiveScore: boolean
}

interface ChkSetting {
  DisChk_Odds_Status: boolean
  DisChk_Odds_Value: boolean
  DisChk_Odds_Score: boolean
  DisChk_Odds_Hdp: boolean
  DisChk_Stake_MinBet: boolean
  DisChk_Stake_MaxBet: boolean
  DisChk_Stake_Float: boolean
  DisChk_Stake_Negative: boolean
  DisChk_MaxPerMatch: boolean
  DisChk_WinLimit: boolean
  DisChk_Credit: boolean
  DisChk_Cust_Status: boolean
  DisAutobookie: boolean
  DisAutobookie_TotalStake: boolean
  DisInsertBet: boolean
  DisInsertBet_TotalStake: boolean
  DisCommission: boolean
}

interface ExtInfo {
  BonusID: number
  RefCode: number
  BonusWalletFlag: boolean
  UserCredit: number
  UserBalance: number
  UserAmount: number
  UserFinalBalance: number
  TransID_Cash: string
  TransID_BonusWallet: number
  Stake_Cash: number
  Stake_BonusWallet: number
  ActualStake_Cash: number
  Actualstake_BonusWallet: number
  MaxPerBet: number
  TotalPerBet: number
  MaxPayoutPerMatch: number
  TotalPayoutPerMatch: number
  WalletType: number
  BonusType: number
  PromoID: number
  LeftPayout: number
  LeftTurnOver: number
}

interface BetTimeConstraint {
  EndTimestamp: number
}

interface Profile {
  DisableParlay: boolean
  SeizeBetBalOnly: boolean
  IsSeizeBet: boolean
  IsScoreZero_SeizeBet: boolean
  IsAutoAddExtraStake: boolean
  OddsType: number
  HdpType: number
  IsDefaultToWapSite: boolean
  DisableBetProcessingPopup: boolean
  HasTicket: boolean
  IsPhoneBetting: boolean
}

interface PT {
  DefaultPT: number
  AcceptPT: boolean
  PTTriggeringValue: number
}

interface Commission {
  ComType: string
  ComValue: number
}

interface AfterBetRecommendTicket {
  BetTicket: string
}

export type ResLoginViva88 = {
  errorCode: number
  errorMessage: string
  redirectUrl: string
  resCode: number
  userLanguage: string
  msgResourceKey: null | string
  gestureFailCnt: number
  userName: null | string
  nickname: null | string
  requestIp: null | string
}

export type LoginResponse = {
  errorCode: number
  errorMessage: string
  redirectUrl: string
  resCode: number
  userLanguage: string
  msgResourceKey: string | null
  gestureFailCnt: number
  userName: string | null
  nickname: string | null
  requestIp: string | null
  loginCount: number
  lastChangePwdDate: string | null
  custToken: string
}
