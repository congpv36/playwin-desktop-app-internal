import { DAYS_OF_WEEK } from '@shared/common/constants'

export type GetCurrentDateTime = {
  currentDate: string
  dayOfWeek: string
  currentTime: string
}

export function getCurrentDateTime() {
  const now = new Date()

  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const date = now.getDate().toString().padStart(2, '0')

  const dayOfWeek = DAYS_OF_WEEK[now.getDay()]

  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')

  return {
    currentDate: `${year}-${month}-${date}`,
    dayOfWeek,
    currentTime: `${hours}:${minutes}`
  }
}
