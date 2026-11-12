import { Setting } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'

export function calculateProfit(odd1: number, odd2: number) {
  const settingInfo = Setting.findAll() as SettingSchemaType[]

  let profit = 0
  if (odd1 == 0 || odd2 == 0) return { status: 'Fail', profit }

  if ((odd1 > 0 && odd2 < 0) || (odd1 < 0 && odd2 > 0)) {
    profit = Math.round((odd1 + odd2) * 1000) / 1000
    if (profit == 0) {
      return { status: 'Fail', profit }
    }

    const minProfit = parseFloat(settingInfo[0].profitMin)
    const maxProfit = parseFloat(settingInfo[0].profitMax)
    const status = profit >= minProfit && profit <= maxProfit ? 'OK' : 'Fail'

    return { status, profit }
  }

  if (odd1 > 0 && odd2 > 0) {
    profit = Math.round((odd1 + odd2 - 2) * 1000) / 1000
  }

  if (odd1 < 0 && odd2 < 0) {
    profit = Math.round((odd1 + odd2 + 2) * 1000) / 1000
  }

  return { status: 'Fail', profit }
}
