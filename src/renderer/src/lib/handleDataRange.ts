import { RangeType } from '@shared/common/types'

export function handleDataRange(obj: RangeType) {
  const result = { ...obj }

  // Điều kiện 1: Nếu betAll = 1 thì gán allMinutes, early, running, today bằng 1
  if (result.betAll === 1) {
    result.allMinutes = 1
    result.early = 1
    result.running = 1
    result.today = 1
  }

  // Điều kiện 2: Nếu allMinutes, early, running, today đều bằng 1 thì gán betAll = 1
  if (result.allMinutes === 1 && result.early === 1 && result.running === 1 && result.today === 1) {
    result.betAll = 1
  }

  // Điều kiện 3: Xử lý oddFrom và oddTo

  const sanitizeOdd = (value, defaultValue) => {
    if (typeof value === 'string') {
      value = value.replace(/^0+(?=\d)/, '')
    }

    const num = parseFloat(value)

    if (isNaN(num)) {
      return defaultValue
    }

    if (['0.0', '000.', '0.000', '0.', '0000'].includes(value)) {
      return '0'
    }

    if (num > 1) return '1'
    if (num < -1) return '-1'
    return num.toString()
  }

  result.oddFrom = sanitizeOdd(result.oddFrom, '0.01')
  result.oddTo = sanitizeOdd(result.oddTo, '-0.01')

  return result
}
