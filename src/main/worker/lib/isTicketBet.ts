import { RowType, SportBookSettingType, TicketInfoDataBetType } from '@shared/common/types'
import { DataPairPlatformType } from '@shared/common/types'
import { HDP_VALUES } from '@shared/main/constants'

import { isOddInRange } from '@/worker/lib/isOddInRange'

export function isTicketBet(
  platform: {
    info: string
    setting: SportBookSettingType
    ticket: DataPairPlatformType | TicketInfoDataBetType
  },
  gameType: string
): boolean {
  const { setting, ticket } = platform
  const { typeOdd, number, hdp_point, bet, nameHome, nameAway } = ticket

  if (setting.generalSetting == 'BetAll') return true
  if (setting.generalSetting == 'NoBet') return false

  const checks = [
    {
      typeOdd: typeOdd === 'SPREAD',
      enabled: setting.FT_PK,
      numberRequired: number === 0,
      hdpRequired: hdp_point === 0,
      detail: setting.FT_PK_Detail,
      betConditions: true
    },
    {
      typeOdd: typeOdd === 'SPREAD',
      enabled: setting.Half_PK,
      numberRequired: number === 1,
      hdpRequired: hdp_point === 0,
      detail: setting.Half_PK_Detail,
      betConditions: true
    },
    {
      typeOdd: typeOdd === 'SPREAD',
      enabled: setting.FT_Put,
      numberRequired: number === 0,
      hdpRequired: (hdp_point < 0 && bet === nameHome) || (hdp_point > 0 && bet === nameAway),
      detail: setting.FT_Put_Detail,
      betConditions:
        setting.FT_Put_Detail.betTo.betAll ||
        HDP_VALUES.some((val) => {
          const key = `hdp_${val.toString().replace('.', '_')}`
          let checkPoint = false
          if (hdp_point < 0 && bet === nameHome) {
            checkPoint = hdp_point === -val
          }

          if (hdp_point > 0 && bet === nameAway) {
            checkPoint = hdp_point === val
          }
          return setting.FT_Put_Detail.betTo[key] && checkPoint
        })
    },
    {
      typeOdd: typeOdd === 'SPREAD',
      enabled: setting.Half_Put,
      numberRequired: number === 1,
      hdpRequired: (hdp_point < 0 && bet === nameHome) || (hdp_point > 0 && bet === nameAway),
      detail: setting.Half_Put_Detail,
      betConditions:
        setting.Half_Put_Detail.betTo.betAll ||
        HDP_VALUES.some((val) => {
          const key = `hdp_${val.toString().replace('.', '_')}`
          let checkPoint = false
          if (hdp_point < 0 && bet === nameHome) {
            checkPoint = hdp_point === -val
          }

          if (hdp_point > 0 && bet === nameAway) {
            checkPoint = hdp_point === val
          }
          return setting.Half_Put_Detail.betTo[key] && checkPoint
        })
    },

    {
      typeOdd: typeOdd === 'SPREAD',
      enabled: setting.FT_Eat,
      numberRequired: number === 0,
      hdpRequired: (hdp_point > 0 && bet === nameHome) || (hdp_point < 0 && bet === nameAway),
      detail: setting.FT_Eat_Detail,
      betConditions:
        setting.FT_Eat_Detail.betTo.betAll ||
        HDP_VALUES.some((val) => {
          const key = `hdp_${val.toString().replace('.', '_')}`
          let checkPoint = false
          if (hdp_point > 0 && bet === nameHome) {
            checkPoint = hdp_point === val
          }

          if (hdp_point < 0 && bet === nameAway) {
            checkPoint = hdp_point === -val
          }
          return setting.FT_Eat_Detail.betTo[key] && checkPoint
        })
    },
    {
      typeOdd: typeOdd === 'SPREAD',
      enabled: setting.Half_Eat,
      numberRequired: number === 1,
      hdpRequired: (hdp_point > 0 && bet === nameHome) || (hdp_point < 0 && bet === nameAway),
      detail: setting.Half_Eat_Detail,
      betConditions:
        setting.Half_Eat_Detail.betTo.betAll ||
        HDP_VALUES.some((val) => {
          const key = `hdp_${val.toString().replace('.', '_')}`
          let checkPoint = false
          if (hdp_point > 0 && bet === nameHome) {
            checkPoint = hdp_point === val
          }

          if (hdp_point < 0 && bet === nameAway) {
            checkPoint = hdp_point === -val
          }
          return setting.Half_Eat_Detail.betTo[key] && checkPoint
        })
    },

    {
      typeOdd: typeOdd === 'TOTAL',
      enabled: setting.FT_Over,
      numberRequired: number === 0,
      hdpRequired: hdp_point > 0 && bet === 'Over',
      detail: setting.FT_Over_Detail,
      betConditions:
        setting.FT_Over_Detail.betTo.betAll ||
        HDP_VALUES.some((val) => {
          const key = `hdp_${val.toString().replace('.', '_')}`
          return setting.FT_Over_Detail.betTo[key] && hdp_point === val
        })
    },
    {
      typeOdd: typeOdd === 'TOTAL',
      enabled: setting.Half_Over,
      numberRequired: number === 1,
      hdpRequired: hdp_point > 0 && bet === 'Over',
      detail: setting.Half_Over_Detail,
      betConditions:
        setting.Half_Over_Detail.betTo.betAll ||
        HDP_VALUES.some((val) => {
          const key = `hdp_${val.toString().replace('.', '_')}`
          return setting.Half_Over_Detail.betTo[key] && hdp_point === val
        })
    },
    {
      typeOdd: typeOdd === 'TOTAL',
      enabled: setting.FT_Under,
      numberRequired: number === 0,
      hdpRequired: hdp_point > 0 && bet === 'Under',
      detail: setting.FT_Under_Detail,
      betConditions:
        setting.FT_Under_Detail.betTo.betAll ||
        HDP_VALUES.some((val) => {
          const key = `hdp_${val.toString().replace('.', '_')}`
          return setting.FT_Under_Detail.betTo[key] && hdp_point === val
        })
    },
    {
      typeOdd: typeOdd === 'TOTAL',
      enabled: setting.Half_Under,
      numberRequired: number === 1,
      hdpRequired: hdp_point > 0 && bet === 'Under',
      detail: setting.Half_Under_Detail,
      betConditions:
        setting.Half_Under_Detail.betTo.betAll ||
        HDP_VALUES.some((val) => {
          const key = `hdp_${val.toString().replace('.', '_')}`
          return setting.Half_Under_Detail.betTo[key] && hdp_point === val
        })
    }
  ]

  for (const check of checks) {
    if (!check.typeOdd) continue
    if (!check.enabled) continue
    if (!check.numberRequired) continue
    if (!check.hdpRequired) continue

    const range = check.detail?.range
    const isInRange =
      (range?.running && gameType === 'Running') ||
      (range?.today && gameType === 'Today') ||
      (range?.early && gameType === 'Early')

    if (!isInRange) continue

    if (range?.running && !range.allMinutes && gameType === 'Running') {
      if (!checkTimeInRange(ticket.stat, range.arrayMinutes)) continue
    }

    if (check.detail?.range.checkOdd) {
      if (!isOddInRange(setting.oddFrom, setting.oddTo, String(ticket.odd))) continue
    }

    if (check.betConditions) {
      return true
    }
  }

  return false
}

function checkTimeInRange(stat: string, arr: RowType[]): boolean {
  if (stat === 'HT') return true

  const regex = /(\d+)H\s*(\d+)'?/
  const match = stat.match(regex)
  if (!match) return false

  const hour = parseInt(match[1], 10)
  const minute = parseInt(match[2], 10)

  let totalMinutes = 0
  if (hour === 1) {
    totalMinutes = minute // 1H = 0'
  } else if (hour === 2) {
    totalMinutes = 45 + minute // 2H = 45'
  } else {
    return false
  }

  return arr.some((row) => {
    const from = parseInt(row.minutesFrom, 10)
    const to = parseInt(row.minutesTo, 10)
    return totalMinutes >= from && totalMinutes <= to
  })
}
