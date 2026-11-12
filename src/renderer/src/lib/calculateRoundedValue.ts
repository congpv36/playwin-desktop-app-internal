export const calculateRoundedValue = (
  value: number,
  testRoundingValue: string,
  roundValue: number,
  roundType: string
): number => {
  const testLength = testRoundingValue.length
  let roundedValue: number = 0

  if (testLength === 1) {
    return value
  }

  if (roundValue >= testLength) {
    const factor = Math.pow(10, testLength - 1)

    if (roundType === 'roundDown') {
      roundedValue = Math.floor(value / factor) * factor
    } else if (roundType === 'roundUp') {
      roundedValue = Math.ceil(value / factor) * factor
    } else {
      roundedValue = Math.round(value / factor) * factor
    }
  } else {
    const factor = Math.pow(10, roundValue)

    if (roundType === 'roundDown') {
      roundedValue = Math.floor(value / factor) * factor
    } else if (roundType === 'roundUp') {
      roundedValue = Math.ceil(value / factor) * factor
    } else {
      roundedValue = Math.round(value / factor) * factor
    }
  }

  return roundedValue
}
