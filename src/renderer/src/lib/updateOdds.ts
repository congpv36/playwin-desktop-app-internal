export const updateOdds = (data) => {
  return data.map((item) => {
    const oddFromNum = parseFloat(item.oddFrom)
    const oddToNum = parseFloat(item.oddTo)

    const isValidNumber = (num: number) => !isNaN(num) && num >= -1 && num <= 1
    const hasValidPrecision = (value: string) => {
      const decimalPart = value.split('.')[1]
      return !decimalPart || decimalPart.length < 3
    }

    const normalizeOdd = (value: string) => {
      if (value === '-0') return '0'
      if (
        value === '0.' ||
        value === '0.0' ||
        value === '0.00' ||
        value === '0.000' ||
        value === '0'
      )
        return '0'

      const normalizedValue = parseFloat(value).toString()

      return normalizedValue
    }

    const validOddFrom = isValidNumber(oddFromNum) && hasValidPrecision(item.oddFrom)
    const validOddTo = isValidNumber(oddToNum) && hasValidPrecision(item.oddTo)

    return {
      ...item,
      oddFrom: validOddFrom ? normalizeOdd(item.oddFrom) : '0.01',
      oddTo: validOddTo ? normalizeOdd(item.oddTo) : '-0.01'
    }
  })
}
