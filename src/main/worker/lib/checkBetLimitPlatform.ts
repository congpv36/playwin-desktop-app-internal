import { PerMatchLimitPlatform, Setting, SettingPerMatchLimit } from '@db/model'
import { PerMatchLimitPlatformType } from '@db/schema/perMatchLimitPlatform'
import { SettingSchemaType } from '@db/schema/setting'

import { SettingPerMatchLimitType } from '@shared/common/types'

export function checkBetLimitPlatform(dataCheck: {
  league: string
  home: string
  away: string
  platform: string
}) {
  const setting = Setting.findAll() as SettingSchemaType[]

  if (setting[0].enablePerMatchLimitSetting === 1) {
    const settingPerMatchLimit = SettingPerMatchLimit.findOne({
      namePlatform: dataCheck.platform
    }) as SettingPerMatchLimitType
    const perMatchLimitPlatform = PerMatchLimitPlatform.findOne(
      dataCheck
    ) as PerMatchLimitPlatformType

    if (!perMatchLimitPlatform) return false

    if (settingPerMatchLimit.limitType == 'TotalCount') {
      return Number(perMatchLimitPlatform.countCurrent) >= Number(perMatchLimitPlatform.count)
    }

    return Number(perMatchLimitPlatform.amountCurrent) >= Number(perMatchLimitPlatform.amount)
  }
  return false
}
