import { BetToType } from '@shared/common/types'

export function updateObject(obj: BetToType): void {
  if (obj.selectAll === 1) {
    obj.betAll = 0
    obj.selectAll = 0
  } else {
    const allZero = Object.entries(obj).every(([key, value]) => key === 'betAll' || value === 0)
    obj.betAll = allZero ? 1 : 0
  }
}
