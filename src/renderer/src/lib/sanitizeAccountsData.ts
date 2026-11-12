import { PlatformPairType } from '@shared/common/types'

export function sanitizeAccountsData(data: PlatformPairType[]) {
  const sanitizeBetAmount = (value) => {
    if (typeof value === 'string') {
      value = value.replace(/^0+(?!$)/, '')
    }

    const num = parseInt(value)
    if (isNaN(num) || num < 0) return '100'
    if (num > 9999999) return '9999999'
    return num.toString()
  }

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

  return data.map((item) => {
    ;['sportBook1', 'sportBook2'].forEach((accKey) => {
      const acc = item[accKey]
      acc.betAmount = sanitizeBetAmount(acc.betAmount)
      acc.oddFrom = sanitizeOdd(acc.oddFrom, '0.01')
      acc.oddTo = sanitizeOdd(acc.oddTo, '-0.01')

      if (acc.generalSetting === 'BetSelected') {
        const betTypes = [
          'FT_PK',
          'FT_Put',
          'FT_Eat',
          'FT_Over',
          'FT_Under',
          'Half_PK',
          'Half_Put',
          'Half_Eat',
          'Half_Over',
          'Half_Under'
        ]
        const allZero = betTypes.every((key) => acc[key] === 0)
        if (allZero) {
          acc.generalSetting = 'NoBet'
        }
      }
    })
    return item
  })
}
