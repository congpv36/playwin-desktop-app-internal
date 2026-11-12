import { RowType } from '@shared/common/types'

export function handleDataTableMinutes(dataTable: RowType[]) {
  return dataTable
    .filter((item) => item.minutesFrom !== '' && item.minutesTo !== '')
    .map((item) => {
      let minutesFrom = isNaN(Number(item.minutesFrom)) ? 0 : Number(item.minutesFrom)
      let minutesTo = isNaN(Number(item.minutesTo)) ? 0 : Number(item.minutesTo)

      minutesFrom = Math.min(minutesFrom, 150)
      minutesTo = Math.min(minutesTo, 150)

      if (minutesFrom > minutesTo) {
        ;[minutesFrom, minutesTo] = [minutesTo, minutesFrom]
      }

      return { ...item, minutesFrom: String(minutesFrom), minutesTo: String(minutesTo) }
    })
    .filter(
      (item, index, self) =>
        index ===
        self.findIndex((t) => t.minutesFrom === item.minutesFrom && t.minutesTo === item.minutesTo)
    )
}
