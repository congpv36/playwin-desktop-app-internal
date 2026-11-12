export const isOddInRange = (oddFrom: string, oddTo: string, odd: string) => {
  const from = parseFloat(oddFrom)
  const to = parseFloat(oddTo)
  const value = parseFloat(odd)

  if (from <= to) {
    return value >= from && value <= to
  } else {
    return value >= to && value <= from
  }
}
