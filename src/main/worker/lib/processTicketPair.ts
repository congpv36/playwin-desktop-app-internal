import { SportsBook } from '@db/model'

import { TicketInfoDataBetType } from '@shared/common/types'
import { SportsBookType } from '@shared/common/types'

import { checkTicketDelay } from '@/worker/lib/checkTicketDelay'

export function processTicketPair(ticketPair: TicketInfoDataBetType[]): boolean {
  const [firstTicket, secondTicket] = ticketPair

  // Process first ticket
  const firstSportsBook = SportsBook.findOne({ platform: firstTicket.platform }) as SportsBookType
  if (!firstSportsBook) return false

  if (!checkTicketDelay(firstTicket, firstSportsBook)) return false

  // Process second ticket
  const secondSportsBook = SportsBook.findOne({ platform: secondTicket.platform }) as SportsBookType
  if (!secondSportsBook) return false

  if (!checkTicketDelay(secondTicket, secondSportsBook)) return false

  return true
}
