import { v4 as uuidv4 } from 'uuid'

import { AccountType } from '@shared/common/types'

export const EMPTY_ACCOUNT: AccountType = {
  id: uuidv4(),

  orderID: 0,
  winBetsCount: 0,
  autoLoginAttempts: 0,

  loginID: '',
  password: '',
  secret: '',

  limitMethod: '',
  livePreGame: 0,
  limitType: '',
  totalAmount: '',
  totalCount: '',

  platformName: '',
  loginURL: '',

  currency: '',
  credit: '',
  cashBalance: '',
  outstanding: '',
  givenCredit: '',
  textLog: '',

  customIP: '',
  proxyIP: '',
  proxyPort: '',
  proxyUsername: '',
  proxyPassword: '',
  proxyScope: 'None',

  typeCrawl: '',

  checkBoxBet: 0,
  checkBoxRefresh: 0,
  checkBoxAutoLogin: 0,
  checkBoxLockURL: 0,

  statusLogin: null,
  statusPair: 0,
  status: '',
  statusDelete: 0,

  cookie: '',
  vHucode: '',
  hdToken: '',
  token: '',
  host: '',
  socketUrl: '',
  parent_id: null,
  uid: ''
}

export const VALUE_DEFAULT_ODDS_SETTING = {
  oddsLessThanValue: '0.10',
  oddsMoreThanValue: '0.80',
  gameCommissionMoreThanValue: '0.24',
  gameCommissionLessThanValue: '0.08'
}

export const TEXT_MESSAGE_ERROR_DEFAULT = {
  oddsLessThanValue:
    '[Do Not Bet when Odds <] Setting Error - Value must be ranged from Malay Odds -0.99 ~ 0.99!',
  oddsMoreThanValue:
    '[Do Not Bet when Odds >] Setting Error - Value must be ranged from Malay Odds -0.99 ~ 0.99!',
  gameCommissionMoreThanValue:
    '[Do Not Bet when Game Commission >] Setting Error - Value must be ranged from Malay Odds -0.99 ~ 0.99!',
  gameCommissionLessThanValue:
    '[Do Not Bet when Game Commission <] Setting Error - Value must be ranged from Malay Odds -0.99 ~ 0.99!'
}

export const HDP_OPTIONS = [
  { key: 'betAll', label: 'Bet All' },
  { key: 'hdp_0', label: '0' },
  { key: 'hdp_0_25', label: '0.25' },
  { key: 'hdp_0_5', label: '0.5' },
  { key: 'hdp_0_75', label: '0.75' },
  { key: 'hdp_1', label: '1' },
  { key: 'hdp_1_25', label: '1.25' },
  { key: 'hdp_1_5', label: '1.5' },
  { key: 'hdp_1_75', label: '1.75' },
  { key: 'hdp_2', label: '2' },
  { key: 'hdp_2_25', label: '2.25' },
  { key: 'hdp_2_5', label: '2.5' },
  { key: 'hdp_2_75', label: '2.75' },
  { key: 'hdp_3', label: '3' },
  { key: 'hdp_3_25', label: '3.25' },
  { key: 'hdp_3_5', label: '3.5' },
  { key: 'hdp_3_75', label: '3.75' },
  { key: 'hdp_4', label: '4' },
  { key: 'hdp_4_25', label: '4.25' },
  { key: 'hdp_4_5', label: '4.5' },
  { key: 'hdp_4_75', label: '4.75' },
  { key: 'hdp_5', label: '5' },
  { key: 'hdp_5_25', label: '5.25' },
  { key: 'hdp_5_5', label: '5.5' },
  { key: 'hdp_5_75', label: '5.75' },
  { key: 'hdp_6', label: '6' },
  { key: 'hdp_6_25', label: '6.25' },
  { key: 'hdp_6_5', label: '6.5' },
  { key: 'hdp_6_75', label: '6.75' },
  { key: 'hdp_7', label: '7' },
  { key: 'hdp_7_25', label: '7.25' },
  { key: 'hdp_7_5', label: '7.5' },
  { key: 'hdp_7_75', label: '7.75' },
  { key: 'hdp_8', label: '8' },
  { key: 'hdp_8_25', label: '8.25' },
  { key: 'hdp_8_5', label: '8.5' },
  { key: 'hdp_8_75', label: '8.75' },
  { key: 'hdp_9', label: '9' },
  { key: 'hdp_9_25', label: '9.25' },
  { key: 'hdp_9_5', label: '9.5' },
  { key: 'hdp_9_75', label: '9.75' },
  { key: 'hdp_10', label: '10' },
  { key: 'hdp_10_25', label: '10.25' },
  { key: 'hdp_10_5', label: '10.5' },
  { key: 'hdp_10_75', label: '10.75' },
  { key: 'hdp_11', label: '11' },
  { key: 'hdp_11_25', label: '11.25' },
  { key: 'hdp_11_5', label: '11.5' },
  { key: 'hdp_11_75', label: '11.75' },
  { key: 'hdp_12', label: '12' },
  { key: 'hdp_12_25', label: '12.25' },
  { key: 'hdp_12_5', label: '12.5' },
  { key: 'hdp_12_75', label: '12.75' },
  { key: 'hdp_13', label: '13' },
  { key: 'hdp_13_25', label: '13.25' },
  { key: 'hdp_13_5', label: '13.5' },
  { key: 'hdp_13_75', label: '13.75' },
  { key: 'hdp_14', label: '14' },
  { key: 'hdp_14_25', label: '14.25' },
  { key: 'hdp_14_5', label: '14.5' },
  { key: 'hdp_14_75', label: '14.75' },
  { key: 'hdp_15', label: '15' },
  { key: 'hdp_15_25', label: '15.25' },
  { key: 'hdp_15_5', label: '15.5' },
  { key: 'hdp_15_75', label: '15.75' },
  { key: 'hdp_16', label: '16' },
  { key: 'hdp_16_25', label: '16.25' },
  { key: 'hdp_16_5', label: '16.5' },
  { key: 'hdp_16_75', label: '16.75' },
  { key: 'hdp_17', label: '17' },
  { key: 'hdp_17_25', label: '17.25' },
  { key: 'hdp_17_5', label: '17.5' },
  { key: 'hdp_17_75', label: '17.75' },
  { key: 'hdp_18', label: '18' },
  { key: 'hdp_18_25', label: '18.25' },
  { key: 'hdp_18_5', label: '18.5' },
  { key: 'hdp_18_75', label: '18.75' },
  { key: 'hdp_19', label: '19' },
  { key: 'hdp_19_25', label: '19.25' },
  { key: 'hdp_19_5', label: '19.5' },
  { key: 'hdp_19_75', label: '19.75' },
  { key: 'hdp_20', label: '20' },
  { key: 'hdp_20_25', label: '20.25' },
  { key: 'hdp_20_5', label: '20.5' },
  { key: 'hdp_20_75', label: '20.75' },
  { key: 'hdp_21', label: '21' },
  { key: 'hdp_21_25', label: '21.25' },
  { key: 'hdp_21_5', label: '21.5' },
  { key: 'hdp_21_75', label: '21.75' },
  { key: 'hdp_22', label: '22' }
]

export const CHECK_BOX_DETAIL_SETTING = [
  { key: 'FT_PK', label: 'FT PK' },
  { key: 'FT_Put', label: 'FT Put' },
  { key: 'FT_Eat', label: 'FT Eat' },
  { key: 'FT_Over', label: 'FT Over' },
  { key: 'FT_Under', label: 'FT Under' },
  { key: 'Half_PK', label: 'Half PK' },
  { key: 'Half_Put', label: 'Half Put' },
  { key: 'Half_Eat', label: 'Half Eat' },
  { key: 'Half_Over', label: 'Half Over' },
  { key: 'Half_Under', label: 'Half Under' }
]

export const PROGRAM_SETTING_LIST = [
  { id: 'general-setting', label: 'General Settings', key: 'general_settings' },
  { id: 'platform-pair', label: 'Platform Pair', key: 'platform_pair' },
  { id: 'bet-setting', label: 'Bet Settings', key: 'bet_settings' },
  { id: 'proxy-setting', label: 'Proxy Server Setting', key: 'proxy_server_setting' },
  { id: 'language', label: 'Language', key: 'language' }
]
