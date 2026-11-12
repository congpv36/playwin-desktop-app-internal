import { FH, FT, GAME_TYPES } from '@shared/common/constants'

export const GAME_TYPE_SHOW_TYPE = {
  [GAME_TYPES.EARLY]: 'early',
  [GAME_TYPES.TODAY]: 'today',
  [GAME_TYPES.RUNNING]: 'live'
}

export const GAME_TYPE_R_TYPE = {
  [GAME_TYPES.EARLY]: 'r',
  [GAME_TYPES.TODAY]: 'rnou',
  [GAME_TYPES.RUNNING]: 'rrnou'
}

export const GAME_TYPE_FILTER = {
  [GAME_TYPES.EARLY]: 'FT',
  [GAME_TYPES.TODAY]: 'FT', //FT   OU|MIX
  [GAME_TYPES.RUNNING]: ''
}

export const PREFIXES = ['', 'A_sub_', 'B_sub_', 'C_sub_']

export const MARKET_CONFIG = {
  RUNNING: {
    SPREAD: [
      { gid: 'GID', ratio: 'RATIO_RE', rh: 'IOR_REH', rc: 'IOR_REC', rs: 'STRONG', number: FT },
      { gid: 'HGID', ratio: 'RATIO_HRE', rh: 'IOR_HREH', rc: 'IOR_HREC', rs: 'HSTRONG', number: FH }
    ],
    TOTAL: [
      { gid: 'GID', ratio: 'RATIO_ROUO', rh: 'IOR_ROUC', rc: 'IOR_ROUH', rs: '', number: FT },
      { gid: 'HGID', ratio: 'RATIO_HROUO', rh: 'IOR_HROUC', rc: 'IOR_HROUH', rs: '', number: FH }
    ]
  },
  NORMAL: {
    SPREAD: [
      { gid: 'GID', ratio: 'RATIO_R', rh: 'IOR_RH', rc: 'IOR_RC', rs: 'STRONG', number: FT },
      { gid: 'HGID', ratio: 'RATIO_HR', rh: 'IOR_HRH', rc: 'IOR_HRC', rs: 'HSTRONG', number: FH }
    ],
    TOTAL: [
      { gid: 'GID', ratio: 'RATIO_OUO', rh: 'IOR_OUC', rc: 'IOR_OUH', rs: '', number: FT },
      { gid: 'HGID', ratio: 'RATIO_HOUO', rh: 'IOR_HOUC', rc: 'IOR_HOUH', rs: '', number: FH }
    ]
  }
}
