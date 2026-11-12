import { v4 as uuidv4 } from 'uuid'

export const ALLOWED_PLATFORM_NAMES = [
  '3in1Bet',
  'Sbobet',
  'Viva88Bet',
  'WBet',
  'Ps3838',
  'SingBet',
  '1XBet',
  'DafaBet',
  'FishBet88'
] as const

export type AllowedPlatformName = (typeof ALLOWED_PLATFORM_NAMES)[number]

const ALLOWED_PLATFORM_NAME_SET: ReadonlySet<string> = new Set(ALLOWED_PLATFORM_NAMES)

export const isAllowedPlatform = (name?: string | null): name is AllowedPlatformName =>
  !!name && ALLOWED_PLATFORM_NAME_SET.has(name)

export const SPORTS_BOOK_LIST = [
  { id: 'sports-book1', label: 'SportsBook 1' },
  { id: 'sports-book2', label: 'SportsBook 2' },
  { id: 'sports-book3', label: 'SportsBook 3' },
  { id: 'sports-book4', label: 'SportsBook 4' },
  { id: 'sports-book5', label: 'SportsBook 5' }
]

export const BET_MODES = {
  Auto: 'Auto',
  HomeOnly: 'HomeOnly',
  AwayOnly: 'AwayOnly'
} as const

export enum Language {
  EN = 'en',
  VI = 'vi',
  ZH = 'zh'
}

export type LanguageType = 'en' | 'zh' | 'vi'

export const DEFAULT_LANGUAGE = Language.EN

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
] as const

export const MAJOR_LEAGUE = [
  { league: '%England - Premier League' },
  { league: '%England - Championship' },
  { league: '%France - Ligue 1' },
  { league: '%Germany - Bundesliga' },
  { league: '%Italy - Serie A' },
  { league: '%Spain - La Liga' },
  { league: '%UEFA - Champions League' },
  { league: '%UEFA - Europa League' }
]

export const CONVERT_HDP = {
  '22': '22',
  '21.75': '21.5-22',
  '21.5': '21.5',
  '21.25': '21-21.5',
  '21': '21',
  '20.75': '20.5-21',
  '20.5': '20.5',
  '20.25': '20-20.5',
  '20': '20',
  '19.75': '19.5-20',
  '19.5': '19.5',
  '19.25': '19-19.5',
  '19': '19',
  '18.75': '18.5-19',
  '18.5': '18.5',
  '18.25': '18-18.5',
  '18': '18',
  '17.75': '17.5-18',
  '17.5': '17.5',
  '17.25': '17-17.5',
  '17': '17',
  '16.75': '16.5-17',
  '16.5': '16.5',
  '16.25': '16-16.5',
  '16': '16',
  '15.75': '15.5-16',
  '15.5': '15.5',
  '15.25': '15-15.5',
  '15': '15',
  '14.75': '14.5-15',
  '14.5': '14.5',
  '14.25': '14-14.5',
  '14': '14',
  '13.75': '13.5-14',
  '13.5': '13.5',
  '13.25': '13-13.5',
  '13': '13',
  '12.75': '12.5-13',
  '12.5': '12.5',
  '12.25': '12-12.5',
  '12': '12',
  '11.75': '11.5-12',
  '11.5': '11.5',
  '11.25': '11-11.5',
  '11': '11',
  '10.75': '10.5-11',
  '10.5': '10.5',
  '10.25': '10-10.5',
  '10': '10',
  '9.75': '9.5-10',
  '9.5': '9.5',
  '9.25': '9-9.5',
  '9': '9',
  '8.75': '8.5-9',
  '8.5': '8.5',
  '8.25': '8-8.5',
  '8': '8',
  '7.75': '7.5-8',
  '7.5': '7.5',
  '7.25': '7-7.5',
  '7': '7',
  '6.75': '6.5-7',
  '6.5': '6.5',
  '6.25': '6-6.5',
  '6': '6',
  '5.75': '5.5-6',
  '5.5': '5.5',
  '5.25': '5-5.5',
  '5': '5',
  '4.75': '4.5-5',
  '4.5': '4.5',
  '4.25': '4-4.5',
  '4': '4',
  '3.75': '3.5-4',
  '3.5': '3.5',
  '3.25': '3-3.5',
  '3': '3',
  '2.75': '2.5-3',
  '2.5': '2.5',
  '2.25': '2-2.5',
  '2': '2',
  '1.75': '1.5-2',
  '1.5': '1.5',
  '1.25': '1-1.5',
  '1': '1',
  '0.75': '0.5-1',
  '0.5': '0.5',
  '0.25': '0-0.5',
  '0': '0'
}

export const ROW_SIZE = 3

export const GAME_TYPES = {
  EARLY: 'Early',
  TODAY: 'Today',
  RUNNING: 'Running',
  NONE: 'None'
}

export const SPREAD = 'SPREAD'
export const TOTAL = 'TOTAL'
export const OVER = 'Over'
export const UNDER = 'Under'

export const FT = 0
export const FH = 1

export const HDP_FT = 1
export const HDP_FH = 7
export const OU_FT = 3
export const OU_FH = 1

export const newDataTableEmpty = {
  id: 9999,

  isBetAllowed: false,
  betRejectionReason: '',

  checkOdd: 0,
  oddFrom: '',
  oddTo: '',

  checkContra: 0,

  HDP: '',
  altLineId: 0,
  marketSelectionId_home_over: 0,
  marketSelectionId_away_under: 0,
  type_away_under: 0,
  type_home_over: 0,
  away: '',
  away_under: 0,
  bet: '',
  betAmount_Standard: '',
  betType: 0,
  company: '',
  coverage: '',
  gameType: '',
  hdp_point: 0,
  home: '',
  home_over: 0,
  idAccount: uuidv4(),
  idEvent: 0,
  idLeague: 0,
  info: '',
  league: '',
  nameAway: '',
  nameHome: '',
  nameLeague: '',

  score: '',
  redCard: '',
  stat: '',
  type: '',

  number: 0,
  odd: 0,
  platform: '',
  profit: 0,
  receiptID: '',
  receiptStatus: '',
  specialOdd: 0,
  time: '',
  typeOdd: '',

  submatch_id: 0,
  isHomeStrong: 0,
  uuidLeague: ''
}

export const LIMIT_METHOD = {
  TEAM_NAME: 'TeamName',
  TEAM_NAME_HANDICAP: 'TeamNameHandicap',
  NAME_BETTYPE_LIMIT: 'NameBetTypeLimit',
  NAME_TARGET_LIMIT: 'NameTargetLimit'
} as const

export const LIMIT_TYPE = {
  TOTAL_AMOUNT: 'TotalAmount',
  TOTAL_COUNT: 'TotalCount'
} as const

export const getThemeClass = (mode: 'bg' | 'text' | 'hover' = 'bg') => {
  if (mode === 'bg') {
    return 'bg-[#14B800]'
  } else if (mode === 'hover') {
    return 'hover:bg-[#115C0B]'
  } else {
    return 'text-[#1EE600]'
  }
}
