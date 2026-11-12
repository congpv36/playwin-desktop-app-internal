import { ScoreListType, SettingScoreListType, SettingTotalGoalType } from '@shared/common/types'

const DEFAULT_SETTING_TOTAL_GOAL: SettingTotalGoalType = {
  enable: 0,
  from: 0,
  to: 0
}

export function validateSettingTotalGoal(data): SettingTotalGoalType {
  if (
    typeof data === 'object' &&
    data !== null &&
    typeof data.enable === 'number' &&
    typeof data.from === 'number' &&
    typeof data.to === 'number'
  ) {
    return data
  }

  return DEFAULT_SETTING_TOTAL_GOAL
}

const DEFAULT_SETTING_SCORE_LIST: SettingScoreListType = {
  enable: 0,
  list: []
}

function normalizeNumberString(value): string {
  if (typeof value !== 'string') return ''

  let cleaned = value.replace(/\D/g, '')

  if (cleaned.length >= 2) {
    cleaned = cleaned.replace(/^0+/, '')
  }

  return cleaned
}

export function validateSettingScoreList(data): SettingScoreListType {
  if (typeof data !== 'object' || data === null) return DEFAULT_SETTING_SCORE_LIST

  const enable = [0, 1].includes(data.enable) ? data.enable : 0

  if (!Array.isArray(data.list)) {
    return { enable, list: [] }
  }

  const seen = new Set<string>()

  const list = data.list
    .map((item: ScoreListType) => {
      const home = normalizeNumberString(item?.home)
      const away = normalizeNumberString(item?.away)

      return { home, away }
    })

    .filter((item) => item.home !== '' && item.away !== '')

    .filter((item) => {
      const key = `${item.home}-${item.away}`

      if (seen.has(key)) return false

      seen.add(key)
      return true
    })

  return {
    enable,
    list
  }
}
