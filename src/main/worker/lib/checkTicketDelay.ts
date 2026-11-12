import { TicketDelaySec } from '@db/model'

import { TicketInfoDataBetType } from '@shared/common/types'
import { SportsBookType } from '@shared/common/types'
import { TicketForDelaySecType } from '@shared/main/types'

import { getTimeDifferenceInSeconds } from '@/worker/lib/getTimeDifferenceInSeconds'

export function checkTicketDelay(
  ticket: TicketInfoDataBetType,
  sportsBook: SportsBookType
): boolean {
  // Check same game delay
  const sameGameTicket = TicketDelaySec.findOne({
    company: ticket.company,
    idLeague: ticket.idLeague,
    idEvent: ticket.idEvent,
    number: ticket.number,
    type: ticket.type,
    hdp_point: ticket.hdp_point,
    bet: ticket.bet
  }) as TicketForDelaySecType

  if (sameGameTicket) {
    const sameGameDelayMs = Number(sportsBook.delaySameGame)

    if (getTimeDifferenceInSeconds(sameGameTicket.timestamp, ticket.time) < sameGameDelayMs) {
      return false
    }
  }
  // Check normal delay
  const normalTicket = TicketDelaySec.findOneWithMaxTimestamp({
    platform: ticket.platform
  }) as TicketForDelaySecType

  if (normalTicket) {
    const normalDelayMs = Number(sportsBook.delayNormal)
    if (getTimeDifferenceInSeconds(normalTicket.timestamp, ticket.time) < normalDelayMs) {
      return false
    }
  }

  return true
}
