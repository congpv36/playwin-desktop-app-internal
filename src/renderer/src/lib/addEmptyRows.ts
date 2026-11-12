import { newDataTableEmpty } from '@shared/common/constants'
import { TicketInfoDataBetType } from '@shared/common/types'

export const addEmptyRows = (originalData: TicketInfoDataBetType[]): TicketInfoDataBetType[] => {
  const newData: TicketInfoDataBetType[] = []
  originalData.forEach((item, index) => {
    newData.push(item)
    if ((index + 1) % 2 === 0) {
      newData.push(newDataTableEmpty)
    }
  })
  return newData
}
