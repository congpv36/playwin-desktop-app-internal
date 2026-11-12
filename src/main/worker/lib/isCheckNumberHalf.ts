import { SettingSchemaType } from '@db/schema/setting'

import { GAME_TYPES } from '@shared/common/constants'
import { DataCrawlType } from '@shared/common/types'

export function isCheckNumberHalf(data: DataCrawlType, setting: SettingSchemaType): boolean {
  const isRunning = setting.gameType === GAME_TYPES.RUNNING

  if (setting.enableFirstStHalf === 1) {
    if (isRunning && data.stat) {
      if (
        checkTimeInRange(
          data.stat,
          1,
          Number(setting.firstStHalfBettingForm),
          Number(setting.firstStHalfBettingUntil)
        )
      )
        return true
    } else {
      if (setting.betFirstHalf === 1 && data.number === 1) return true
      if (setting.betFullTime === 1 && data.number === 0) return true
    }
  }

  if (setting.enableSecondStHalf === 1) {
    if (isRunning && data.stat) {
      if (
        checkTimeInRange(
          data.stat,
          2,
          Number(setting.secondStHalfBettingForm),
          Number(setting.secondStHalfBettingUntil)
        )
      )
        return true
    }
  }
  if (isRunning && setting.betHalfTime === 1 && data.stat.includes('HT')) return true

  return false
}

function checkTimeInRange(stat: string, targetHour: number, from: number, to: number): boolean {
  const regex = /^(\d+)H(?:\s*(\d+)'?)?$/
  const match = stat.trim().match(regex)
  if (!match) return false

  const hour = parseInt(match[1], 10)
  let minutes = match[2] ? parseInt(match[2], 10) : 0

  // Nếu là hiệp 2 thì cộng thêm 45 phút
  if (hour === 2) {
    minutes += 45
  }

  return hour === targetHour && minutes >= from && minutes <= to
}
