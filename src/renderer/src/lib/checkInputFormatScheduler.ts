export const checkInputFormatScheduler = (input: string): string => {
  const pattern = /^\d{4}-\d{4}$/
  if (!pattern.test(input)) {
    return ''
  }

  const [firstPart, secondPart] = input.split('-')

  if (firstPart == secondPart) {
    return ''
  }
  const firstHour = firstPart.slice(0, 2)
  const firstMinute = firstPart.slice(2, 4)
  const secondHour = secondPart.slice(0, 2)
  const secondMinute = secondPart.slice(2, 4)

  const firstHourNum = parseInt(firstHour, 10)
  const firstMinuteNum = parseInt(firstMinute, 10)
  const secondHourNum = parseInt(secondHour, 10)
  const secondMinuteNum = parseInt(secondMinute, 10)

  if (
    firstHourNum < 0 ||
    firstHourNum > 23 ||
    firstMinuteNum < 0 ||
    firstMinuteNum > 59 ||
    secondHourNum < 0 ||
    secondHourNum > 23 ||
    secondMinuteNum < 0 ||
    secondMinuteNum > 59
  ) {
    return ''
  }

  return input
}
