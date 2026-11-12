export const handleUpdateQuickOdds = (arr) => {
  return arr.map((item) => {
    const updatedItem: Record<string, string | number> = {}
    for (const key in item) {
      if (key.includes('heckOdd_From')) {
        updatedItem[key] = processOddField(item[key], true)
      } else if (key.includes('heckOdd_To')) {
        updatedItem[key] = processOddField(item[key], false)
      } else {
        updatedItem[key] = item[key]
      }
    }
    return updatedItem
  })
}

const processOddField = (value: string, isFromField: boolean): string | number => {
  if (value === '' || value === '-0') {
    return isFromField ? '0.01' : '-0.01'
  }
  const numValue = parseFloat(value)
  if (numValue < -1) return '-1'
  if (numValue > 1) return '1'
  return value
}
