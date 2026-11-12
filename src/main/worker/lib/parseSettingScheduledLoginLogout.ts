import { ScheduledLoginLogoutType } from '@db/schema/scheduledLoginLogout'

import { ScheduledLoginLogoutParseType } from '@shared/common/types'

export function parseSetting(list: ScheduledLoginLogoutType[]): ScheduledLoginLogoutParseType[] {
  return list.map((item) => {
    try {
      return {
        ...item,
        loginSetting: JSON.parse(item.loginSetting),
        logoutSetting: JSON.parse(item.logoutSetting)
      }
    } catch (e) {
      return {
        ...item,
        loginSetting: { enabled: 0, schedules: [] },
        logoutSetting: { enabled: 0, schedules: [] }
      }
    }
  })
}
