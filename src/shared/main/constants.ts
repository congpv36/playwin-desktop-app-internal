import { v4 as uuidv4 } from 'uuid'

import { LIMIT_METHOD, LIMIT_TYPE } from '@shared/common/constants'

export const DEFAULT_SETTING = {
  id: uuidv4(),

  profitMin: '0.03',
  profitMax: '0.70',
  gameType: 'Running',
  betMode: 'Auto',

  schedulerRunning: 0,
  schedulerInputRunning: '',
  schedulerToday: 0,
  schedulerInputToday: '',
  schedulerEarly: 0,
  schedulerInputEarly: '',

  enableFirstStHalf: 1,
  betFirstHalf: 1,
  betFullTime: 1,
  firstStHalfBettingForm: '0',
  firstStHalfBettingUntil: '42',

  enableSecondStHalf: 1,
  betHalfTime: 1,
  secondStHalfBettingForm: '46',
  secondStHalfBettingUntil: '87',

  bettingMode: 'Normal',
  amountRoundingEnabled: 0,
  roundType: 'Auto',
  roundingNumber: 2,

  enablePerMatchLimitSetting: 0,

  ipAddress: '',
  port: '0',
  username: '',
  password: '',

  oddsLessThan: 1,
  oddsMoreThan: 0,
  gameCommissionMoreThan: 0,
  gameCommissionLessThan: 0,

  oddsLessThanValue: '0.10',
  oddsMoreThanValue: '0.80',
  gameCommissionMoreThanValue: '0.24',
  gameCommissionLessThanValue: '0.08',

  enableRandomizer: 0,
  fromRandomizer: '50',
  toRandomizer: '200',

  isOther: 0,
  isBetUnderSelected: 0,
  isBetOverSelected: 0,
  isBetPutSelected: 0,
  isBetEatSelected: 0,

  isBetByOtherAcc: 0
}

export const HDP_VALUES = [
  0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5,
  4.75, 5, 5.25, 5.5, 5.75, 6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25,
  9.5, 9.75, 10, 10.25, 10.5, 10.75, 11, 11.25, 11.5, 11.75, 12, 12.25, 12.5, 12.75, 13, 13.25,
  13.5, 13.75, 14, 14.25, 14.5, 14.75, 15, 15.25, 15.5, 15.75, 16, 16.25, 16.5, 16.75, 17, 17.25,
  17.5, 17.75, 18, 18.25, 18.5, 18.75, 19, 19.25, 19.5, 19.75, 20, 20.25, 20.5, 20.75, 21, 21.25,
  21.5, 21.75, 22
]

export const LOGIN_SCHEDULER_SETTING = [
  {
    id: uuidv4() as string,
    typeSetting: 'Login',
    isSchedulerEnabled: 0,
    selectedDays: JSON.stringify([]),
    timeValue: '00:00',
    dateValue: new Date().toISOString().split('T')[0]
  },
  {
    id: uuidv4() as string,
    typeSetting: 'Logout',
    isSchedulerEnabled: 0,
    selectedDays: JSON.stringify([]),
    timeValue: '00:00',
    dateValue: new Date().toISOString().split('T')[0]
  }
]

export const DEFAULT_TEAM_NAME_LIMIT = {
  limitMethod: LIMIT_METHOD.TEAM_NAME,
  limitType: LIMIT_TYPE.TOTAL_COUNT,
  totalAmount: '5000',
  totalCount: '2'
}

export const DEFAULT_SPORTS_BOOK_CONFIG = {
  isPaired: 0,
  betAmountSetting: 'FixedAmount',
  betFixedAmountValue: '10',

  isSwitchBySuccessCount: 0,
  minSuccessCount: '5',
  maxSuccessCount: '10',

  isSwitchByCredit: 0,
  maxCredit: '50',

  isRandomDelayLogin: 0,
  minDelayLogin: '1',
  maxDelayLogin: '10',

  delayNormal: '3',
  delaySameGame: '5',
  delayLoginSec_from: '50',
  delayLoginSec_to: '70',
  switchIntervalSetting_from: '60',
  switchIntervalSettingMinutes: '60',
  switchIntervalSetting_to: '100',
  accountType: 'All',
  switchAccountSetting: 'off',
  VIPAccountLogout: 1,
  valueRange: 0,

  isMatchLimitAllAccount: 1,
  limitMethod: LIMIT_METHOD.TEAM_NAME,
  limitType: LIMIT_TYPE.TOTAL_COUNT,
  totalAmount: '5000',
  totalCount: '2'
}

export const TYPE_ODD = {
  HDP: 'HDP',
  OU: 'OU'
}

export const STATUS_ACCOUNT = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  EXIT: 'Exit',
  IN_PROGRESS: 'In-Progress'
}

export const DEFAULT_ACCOUNT_STATUS = {
  status: STATUS_ACCOUNT.LOGIN,
  autoLoginAttempts: 0,
  checkBoxBet: 1,
  checkBoxRefresh: 1,
  checkBoxAutoLogin: 0,
  winBetsCount: 0,
  statusLogin: null,
  currency: null,
  credit: '0',
  cashBalance: '0',
  outstanding: '0',
  givenCredit: '0',
  parent_id: null,
  textLog: null,
  host: null,
  cookie: null,
  socketUrl: null,
  uid: null
}

export const STATUS_LOGIN = {
  SUCCESS: 'Success',
  FAIL: 'Fail'
}

export const OPTIONS_PROXY = {
  NONE: 'None',
  FULL: 'Full',
  ONLY_LOGIN: 'OnlyLogin'
}

export const TYPE_ODD_DETAIL = {
  HDP: 'SPREAD',
  OU: 'TOTAL'
}
