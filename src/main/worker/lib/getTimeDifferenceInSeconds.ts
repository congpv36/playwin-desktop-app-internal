export function getTimeDifferenceInSeconds(time1: string, time2: string): number {
  const date1 = new Date(time1)
  const date2 = new Date(time2)
  const diffInMilliseconds = date2.getTime() - date1.getTime()
  return diffInMilliseconds / 1000
}
