import { TYPE_ODD } from '@shared/main/constants'

// export const API_BASE_URL = 'https://app.true88.com'
// export const ODDS_BASE_URL = 'https://odds.true88.com'

// export const API_ENDPOINTS = {
//   AUTH: `${API_BASE_URL}/userlogin`,
//   BALANCE: `${API_BASE_URL}/userbalance`,
//   UX_MARKET: `${ODDS_BASE_URL}/uxmarket`,
//   UX_MATCH: `${ODDS_BASE_URL}/uxmatch`,
//   BET_CHECK: `${API_BASE_URL}/bet/betcheck`,
//   BET_SINGLE: `${API_BASE_URL}/bet/betsingle`
// }

export const PARAM_UX_MATCH = {
  Early: 'early',
  Today: 'today',
  Running: 'live'
}

export const KEY_UX_MATCH = {
  Early: '1',
  Today: '2',
  Running: '3'
}

export const KEY_UX_MATCH_ODDS = {
  OU: 'ou',
  HDP: 'hdp'
}

export const ARGUMENTS_UX_MATCH = {
  Early: ['en', 'hdp|ou', '1'],
  Today: ['en', 'hdp|ou', '2'],
  Running: ['en', 'hdp|ou', '3']
}

export const ARGUMENTS_UX_MARKET = {
  Early: ['en', '1', '1', '1', 'hdpou', '0', ''],
  Today: ['en', '1', '2|3', '1', 'hdpou', '0', ''],
  Running: ['en', '1', '3|3', '1', 'hdpou', '0', '']
}

export const TYPE_ODD_HDP = {
  HDP: 0,
  HDPH: 1
}
export const TYPE_ODD_OU = {
  OU: 0,
  OUH: 1
}

export const REVERSE_CONVERT_ODDS = {
  '22': '22',
  '21.5-22': '21.75',
  '21.5': '21.5',
  '21-21.5': '21.25',
  '21': '21',
  '20.5-21': '20.75',
  '20.5': '20.5',
  '20-20.5': '20.25',
  '20': '20',
  '19.5-20': '19.75',
  '19.5': '19.5',
  '19-19.5': '19.25',
  '19': '19',
  '18.5-19': '18.75',
  '18.5': '18.5',
  '18-18.5': '18.25',
  '18': '18',
  '17.5-18': '17.75',
  '17.5': '17.5',
  '17-17.5': '17.25',
  '17': '17',
  '16.5-17': '16.75',
  '16.5': '16.5',
  '16-16.5': '16.25',
  '16': '16',
  '15.5-16': '15.75',
  '15.5': '15.5',
  '15-15.5': '15.25',
  '15': '15',
  '14.5-15': '14.75',
  '14.5': '14.5',
  '14-14.5': '14.25',
  '14': '14',
  '13.5-14': '13.75',
  '13.5': '13.5',
  '13-13.5': '13.25',
  '13': '13',
  '12.5-13': '12.75',
  '12.5': '12.5',
  '12-12.5': '12.25',
  '12': '12',
  '11.5-12': '11.75',
  '11.5': '11.5',
  '11-11.5': '11.25',
  '11': '11',
  '10.5-11': '10.75',
  '10.5': '10.5',
  '10-10.5': '10.25',
  '10': '10',
  '9.5-10': '9.75',
  '9.5': '9.5',
  '9-9.5': '9.25',
  '9': '9',
  '8.5-9': '8.75',
  '8.5': '8.5',
  '8-8.5': '8.25',
  '8': '8',
  '7.5-8': '7.75',
  '7.5': '7.5',
  '7-7.5': '7.25',
  '7': '7',
  '6.5-7': '6.75',
  '6.5': '6.5',
  '6-6.5': '6.25',
  '6': '6',
  '5.5-6': '5.75',
  '5.5': '5.5',
  '5-5.5': '5.25',
  '5': '5',
  '4.5-5': '4.75',
  '4.5': '4.5',
  '4-4.5': '4.25',
  '4': '4',
  '3.5-4': '3.75',
  '3.5': '3.5',
  '3-3.5': '3.25',
  '3': '3',
  '2.5-3': '2.75',
  '2.5': '2.5',
  '2-2.5': '2.25',
  '2': '2',
  '1.5-2': '1.75',
  '1.5': '1.5',
  '1-1.5': '1.25',
  '1': '1',
  '0.5-1': '0.75',
  '0.5': '0.5',
  '0-0.5': '0.25',
  '0': '0'
}

export const BET_TYPE_MAP = {
  [TYPE_ODD.HDP]: ['HDP', 'HDPH'],
  [TYPE_ODD.OU]: ['OU', 'OUH']
}

export const ODDS_COL_MAP = {
  [TYPE_ODD.HDP]: { home: 5, away: 4 },
  [TYPE_ODD.OU]: { home: 7, away: 6 }
}
