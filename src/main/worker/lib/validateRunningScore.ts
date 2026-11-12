import { SettingSchemaType } from '@db/schema/setting'

import { GAME_TYPES } from '@shared/common/constants'
import { SettingScoreListType, SettingTotalGoalType } from '@shared/common/types'

export function validateRunningScore(score: string, settingInfo: SettingSchemaType): boolean {
  if (settingInfo.gameType !== GAME_TYPES.RUNNING) return true

  const settingTotalGoal = settingInfo?.settingTotalGoal
    ? (JSON.parse(settingInfo?.settingTotalGoal) as SettingTotalGoalType)
    : {
        enable: 0,
        from: 0,
        to: 0
      }
  const settingScoreList = settingInfo?.settingScoreList
    ? (JSON.parse(settingInfo?.settingScoreList) as SettingScoreListType)
    : {
        enable: 0,
        list: []
      }

  if (settingTotalGoal.enable === 0 && settingScoreList.enable === 0) return true

  const match = score.match(/^(\d+)-(\d+)$/)
  if (!match) return false

  const home = Number(match[1])
  const away = Number(match[2])

  if (Number.isNaN(home) || Number.isNaN(away)) return false

  let isValidTotalGoal = true
  let isValidScoreList = true

  if (settingTotalGoal?.enable === 1) {
    const total = home + away
    const min = Math.min(settingTotalGoal.from, settingTotalGoal.to)
    const max = Math.max(settingTotalGoal.from, settingTotalGoal.to)

    isValidTotalGoal = total >= min && total <= max
  }

  if (settingScoreList?.enable === 1) {
    if (settingScoreList.list.length === 0) {
      isValidScoreList = true
    } else {
      isValidScoreList = settingScoreList.list.some((item) => {
        return Number(item.home) === home && Number(item.away) === away
      })
    }
  }

  return isValidTotalGoal && isValidScoreList
}
