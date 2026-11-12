import { DataCrawlType, GenerateTicketUpdateType } from '@shared/common/types'

import { formatTime } from '@/worker/lib/formatTime'

export const generateTicketUpdate = (
  dataTicketI: DataCrawlType,
  bet1: string,
  bet1Sub: string,
  odd1: number,
  odd1Sub: number,
  infoOdd1: string,
  dataTicketII: DataCrawlType,
  bet2: string,
  bet2Sub: string,
  odd2: number,
  odd2Sub: number,
  infoOdd2: string,
  profit: number,
  gameType: string
): GenerateTicketUpdateType[] => {
  const createTicket = (
    data: DataCrawlType,
    bet: string,
    betSub: string,
    odd: number,
    oddSub: number,
    info: string
  ) => {
    return {
      ...data,
      bet,
      betSub,
      odd,
      oddSub,
      profit,
      info,
      betAmount_Standard: '0',
      company: data.platform,
      coverage: data.number === 0 ? 'FT' : 'FirstHalf',
      gameType,
      time: formatTime(),
      receiptID: '',
      receiptStatus: ''
    }
  }

  return [
    createTicket(dataTicketI, bet1, bet1Sub, odd1, odd1Sub, infoOdd1),
    createTicket(dataTicketII, bet2, bet2Sub, odd2, odd2Sub, infoOdd2)
  ]
}
