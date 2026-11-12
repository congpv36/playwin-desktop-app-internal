/* eslint-disable @typescript-eslint/no-explicit-any */
export type GetTicketShowOdd = {
  code: number
  message: string
  odds: number
  oldsOdd: number
  min: number
  max: number
  ticket: TicketBetType
  response: any
}

export type PlaceTicketShowOdd = {
  code: number
  response: {
    info: string
    receiptID: string
    receiptStatus: string
  }
}

export type LoginLogoutSetting = {
  enabled: number
  schedules: {
    day: string
    time: string
  }[]
}

export type ScheduledLoginLogoutParseType = {
  id: string
  platformName: string
  checked: number
  loginSetting: LoginLogoutSetting
  logoutSetting: LoginLogoutSetting
}

export type LeaguePointRandomizerType = {
  id: string
  league: string
  checked: number
  fromValue: string
  toValue: string
}

export type PlatformUrlType = {
  id: string
  url: string
  platformName: string
}
export interface BetToType {
  hdp_0: number
  hdp_0_5: number
  hdp_0_25: number
  hdp_0_75: number
  hdp_1: number
  hdp_1_5: number
  hdp_1_25: number
  hdp_1_75: number
  hdp_2: number
  hdp_2_5: number
  hdp_2_25: number
  hdp_2_75: number
  hdp_3: number
  hdp_3_5: number
  hdp_3_25: number
  hdp_3_75: number
  hdp_4: number
  hdp_4_5: number
  hdp_4_25: number
  hdp_4_75: number
  hdp_5: number
  hdp_5_5: number
  hdp_5_25: number
  hdp_5_75: number
  hdp_6: number
  hdp_6_5: number
  hdp_6_25: number
  hdp_6_75: number
  hdp_7: number
  hdp_7_5: number
  hdp_7_25: number
  hdp_7_75: number
  hdp_8: number
  hdp_8_5: number
  hdp_8_25: number
  hdp_8_75: number
  hdp_9: number
  hdp_9_5: number
  hdp_9_25: number
  hdp_9_75: number
  hdp_10: number
  hdp_10_5: number
  hdp_10_25: number
  hdp_10_75: number
  hdp_11: number
  hdp_11_5: number
  hdp_11_25: number
  hdp_11_75: number
  hdp_12: number
  hdp_12_5: number
  hdp_12_25: number
  hdp_12_75: number
  hdp_13: number
  hdp_13_5: number
  hdp_13_25: number
  hdp_13_75: number
  hdp_14: number
  hdp_14_5: number
  hdp_14_25: number
  hdp_14_75: number
  hdp_15: number
  hdp_15_5: number
  hdp_15_25: number
  hdp_15_75: number
  hdp_16: number
  hdp_16_5: number
  hdp_16_25: number
  hdp_16_75: number
  hdp_17: number
  hdp_17_5: number
  hdp_17_25: number
  hdp_17_75: number
  hdp_18: number
  hdp_18_5: number
  hdp_18_25: number
  hdp_18_75: number
  hdp_19: number
  hdp_19_5: number
  hdp_19_25: number
  hdp_19_75: number
  hdp_20: number
  hdp_20_5: number
  hdp_20_25: number
  hdp_20_75: number
  hdp_21: number
  hdp_21_5: number
  hdp_21_25: number
  hdp_21_75: number
  hdp_22: number
  betAll: number
  selectAll: number
}

export interface RowType {
  id: string
  minutesFrom: string
  minutesTo: string
}
export interface RangeType {
  betAll: number
  today: number
  early: number
  running: number
  allMinutes: number
  arrayMinutes: RowType[]
  checkOdd: number
  oddFrom: string
  oddTo: string
}

interface DetailFullType {
  betTo: BetToType
  range: RangeType
}
interface DetailRangeType {
  range: RangeType
}

export interface AmountRounderSettingType {
  rounder: number
  roundType: string
  roundValue: string
}

export interface SportBookSettingType {
  id: number

  name: string

  checkOdd: number
  oddFrom: string
  oddTo: string
  betOpposite: number

  amountRounderSetting: AmountRounderSettingType

  generalSetting: string
  FT_PK: number
  FT_Put: number
  FT_Eat: number
  FT_Over: number
  FT_Under: number
  Half_PK: number
  Half_Put: number
  Half_Eat: number
  Half_Over: number
  Half_Under: number

  FT_PK_Detail: DetailRangeType
  FT_Put_Detail: DetailFullType
  FT_Eat_Detail: DetailFullType
  FT_Over_Detail: DetailFullType
  FT_Under_Detail: DetailFullType

  Half_PK_Detail: DetailRangeType
  Half_Put_Detail: DetailFullType
  Half_Eat_Detail: DetailFullType
  Half_Over_Detail: DetailFullType
  Half_Under_Detail: DetailFullType
}

export interface PlatformPairType {
  id: string
  isValid: number
  key: string
  sportBook1: SportBookSettingType
  sportBook2: SportBookSettingType
}

export type ListRangePlatformType = {
  id: number
  platform: string
  valueRange: number
}

export type OtherSettingType = {
  id: number
  isOther: number
  isBetUnderSelected: number
  isBetOverSelected: number
  isBetPutSelected: number
  isBetEatSelected: number
}

export type SettingTableViewType = {
  id: number
  tab: string
  contraStrategy: string
  clear: number
  scroll: number
}

export type TicketInfoDataBetType = {
  id: number

  isBetAllowed: boolean
  betRejectionReason: string

  checkOdd: number
  oddFrom: string
  oddTo: string

  HDP: string
  submatch_id: number | null
  altLineId: number
  marketSelectionId_home_over: number | null
  marketSelectionId_away_under: number | null

  type_away_under: number
  type_home_over: number

  away: string | null
  away_under: number
  bet: string
  betAmount_Standard: string
  betType: number
  company: string
  coverage: string
  gameType: string
  hdp_point: number
  home: string | null
  home_over: number
  idAccount: string
  idEvent: number
  isHomeStrong: number | null
  idLeague: number
  uuidLeague: string | null
  info: string | null
  league: string | null
  nameAway: string
  nameHome: string
  nameLeague: string

  score: string
  redCard: string
  stat: string
  type: string

  number: number
  odd: number
  platform: string
  profit: number
  receiptID: string | null
  receiptStatus: string
  specialOdd: number | null
  time: string
  typeOdd: string
}

export type BetListDBType = {
  id: number
  dataPair: string
}

export type WaitingSuccessContraDBType = {
  id: number
  uuid: string
  dataPair: string
}

export type PlatformType = {
  id: number
  uuid: string
  url: string
  name: string
}

export type AccountType = {
  id: string

  orderID: number
  winBetsCount: number
  autoLoginAttempts: number

  loginID: string
  password: string
  secret: string | null

  limitMethod: string
  livePreGame: number
  limitType: string
  totalAmount: string
  totalCount: string

  platformName: string
  loginURL: string

  currency: string
  cashBalance: string
  outstanding: string
  credit: string
  givenCredit: string

  textLog: string

  customIP: string
  proxyIP: string
  proxyPort: string
  proxyUsername: string
  proxyPassword: string
  proxyScope: string

  typeCrawl: string

  checkBoxBet: number
  checkBoxRefresh: number
  checkBoxAutoLogin: number
  checkBoxLockURL: number

  statusLogin: string | null
  statusPair: number
  status: string
  statusDelete: number

  cookie: string
  vHucode: string
  hdToken: string
  token: string

  host: string
  socketUrl: string
  parent_id: string | null
  uid: string
}

export type SwitchAccountType = AccountType & {
  delayLoginSec: number
}

export interface DataPlatformType extends SportsBookType {
  accounts: AccountType[]
}

export type SportsBookType = {
  id: string
  name: string
  platform: string
  url: string
  isPaired: number

  betAmountSetting: string
  betFixedAmountValue: string

  isSwitchBySuccessCount: number
  minSuccessCount: string
  maxSuccessCount: string

  isSwitchByCredit: number
  maxCredit: string

  isRandomDelayLogin: number
  minDelayLogin: string
  maxDelayLogin: string

  delayNormal: string
  delaySameGame: string
  suggestedClient: string
  delayLoginSec_from: string
  delayLoginSec_to: string
  VIPAccountLogout: number
  switchIntervalSetting_from: string
  switchIntervalSetting_to: string
  switchIntervalSettingMinutes: string
  hight_account: string
  accountType: string
  switchAccountSetting: string

  valueRange: number

  isMatchLimitAllAccount: number
  limitMethod: string
  limitType: string
  totalAmount: string
  totalCount: string

  lockURL: number
}

export type SettingType = {
  id: string
  profitMin: string
  profitMax: string
  gameType: string

  schedulerRunning: number
  schedulerInputRunning: string
  schedulerToday: number
  schedulerInputToday: string
  schedulerEarly: number
  schedulerInputEarly: string

  enableFirstStHalf: number
  betFirstHalf: number
  betFullTime: number
  firstStHalfBettingForm: string
  firstStHalfBettingUntil: string

  enableSecondStHalf: number
  betHalfTime: number
  secondStHalfBettingForm: string
  secondStHalfBettingUntil: string

  bettingMode: string
  amountRoundingEnabled: number
  roundType: string
  roundingNumber: string

  enablePerMatchLimitSetting: number

  ipAddress: string
  port: string
  username: string
  password: string

  oddsLessThan: number
  oddsMoreThan: number
  gameCommissionMoreThan: number
  gameCommissionLessThan: number

  oddsLessThanValue: string
  oddsMoreThanValue: string
  gameCommissionMoreThanValue: string
  gameCommissionLessThanValue: string

  enableRandomizer: number
  fromRandomizer: string
  toRandomizer: string

  isOther: number
  isBetUnderSelected: number
  isBetOverSelected: number
  isBetPutSelected: number
  isBetEatSelected: number

  isBetByOtherAcc: number

  settingTotalGoal: SettingTotalGoalType
  settingScoreList: SettingScoreListType

  betMode: string

  language: string
}

export type SettingTotalGoalType = {
  enable: number
  from: number
  to: number
}

export type ScoreListType = { home: string; away: string }

export type SettingScoreListType = {
  enable: number
  list: ScoreListType[]
}

export type SettingPerMatchLimitType = {
  id: number
  namePlatform: string
  limitMethod: string

  limitType: string
  totalAmount: string
  totalCount: string
}

export type SettingLeagueFilterType = {
  id: string
  filterType: string
  blockMajorLeague: number
  allowMajorLeague: number
}

export type DataCrawlType = {
  id: number

  gameType: string

  platform: string

  idLeague: number
  uuidLeague: string | null
  nameLeague: string

  idEvent: number
  isHomeStrong: number | null
  nameHome: string
  nameAway: string

  date: string
  time: string
  score: string
  redCard: string
  stat: string
  type: string

  number: number
  submatch_id: number | null
  altLineId: number
  marketSelectionId_home_over: number | null
  marketSelectionId_away_under: number | null
  type_away_under: number
  type_home_over: number
  hdp_point: number
  home_over: number
  away_under: number
  typeOdd: string

  league: string | null
  home: string | null
  away: string | null

  specialOdd: number | null
  betType: number

  HDP: string
}

export interface GenerateTicketUpdateType extends DataCrawlType {
  bet: string
  betSub: string
  odd: number
  oddSub: number
  profit: number
  info: string | null
  betAmount_Standard: string
  company: string
  coverage: string
  gameType: string
  time: string
  receiptID: string | null
  receiptStatus: string
}

export interface TicketCombinationType extends GenerateTicketUpdateType {
  betOpposite: number
  isBetAllowed: boolean
  betRejectionReason: string
  checkOdd: number
  oddFrom: string
  oddTo: string
}

export interface TicketBetType extends TicketCombinationType {
  idAccount: string
}

export type DataPairPlatformType = {
  id: number

  platform: string

  idLeague: number
  nameLeague: string

  idEvent: number
  nameHome: string
  nameAway: string

  score: string
  redCard: string
  stat: string
  type: string

  number: number
  submatch_id: number | null
  altLineId: number
  hdp_point: number
  home_over: number
  away_under: number
  typeOdd: string

  league: string | null
  home: string | null
  away: string | null

  specialOdd: number | null
  betType: number

  HDP: string

  bet: string
  odd: number
  profit: number
}

export type NameTeamType = {
  id: number
  nameTeam: string
  nameLeague: string
  platform: string
  idPlatform: number
  team: string
  league: string
}

export type NameLeagueType = {
  id: number
  nameLeague: string
  platform: string
  idPlatform: number
  league: string
}

export type DataBetType = {
  id?: number
  idPlatformPair: string
  dataPair: string
}

export type TableLeagueFilterType = {
  id: number
  league: string
}

export type LoginSchedulerSettingType = {
  id: string
  typeSetting: string
  isSchedulerEnabled: number
  selectedDays: string
  timeValue: string
  dateValue: string
}

export type SportsBook = {
  id: number
  name: string
  platform: string
  url: string
  delayNormal: string
  delaySameGame: string
  suggestedClient: string
  delayLoginSec_from: string
  delayLoginSec_to: string
  switchIntervalSetting_from: string
  switchIntervalSetting_to: string
  accountType: string
  switchAccountSetting: string
  switchIntervalSettingMinutes: string
  VIPAccountLogout: number
}

type UserData = {
  id: string
  username: string
  role: string
  appType: string
  isActive: boolean
  currentPoint: number
  expiredDate: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type ApiResponse = {
  message: string
  data: UserData
}

export type Announcement = {
  appType: string
  announcementType: string
  isEnable: boolean
  filePath: string
  content: string
}

export type LeagueType = {
  id: number
  nameLeague: string
  idLeague: string
  league: string
}

export type ShowOddsOddCell = {
  homeOdd: number
  line: string
  awayOdd: number
  hdp_point: number
  meta: DataCrawlType
}
export type ShowOddsHalfMarket = { hdp?: ShowOddsOddCell; ou?: ShowOddsOddCell }
export type ShowOddsMatchMarket = { hdp: ShowOddsOddCell; ou: ShowOddsOddCell }

export type ShowOddsMarketRow = {
  match: ShowOddsMatchMarket
  firstHalf?: ShowOddsHalfMarket
}
export type ShowOddsLeagueEntry = {
  league: string
  home: string
  away: string
  gameType: string
  date: string
  time: string
  score: string
  stat: string
  markets: ShowOddsMarketRow[]
}
export type ShowOddsResult = { data: ShowOddsLeagueEntry[]; changedKeys: string[] }
