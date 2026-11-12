import { TicketDelaySec } from '@db/model'

import { TicketBetType } from '@shared/common/types'
import { TicketForDelaySecType } from '@shared/main/types'

export function UpsertTicketDelaySec(ticket: TicketBetType) {
  const ticketDelaySec = TicketDelaySec.findOne({
    company: ticket.company,
    idLeague: ticket.idLeague,
    idEvent: ticket.idEvent,
    number: ticket.number,
    type: ticket.type,
    hdp_point: ticket.hdp_point,
    bet: ticket.bet
  }) as TicketForDelaySecType

  if (ticketDelaySec) {
    TicketDelaySec.update({ id: ticketDelaySec.id }, { timestamp: ticket.time })
  } else {
    TicketDelaySec.create({
      platform: ticket.platform,
      company: ticket.company,
      idLeague: ticket.idLeague,
      idEvent: ticket.idEvent,
      number: ticket.number,
      type: ticket.type,
      hdp_point: ticket.hdp_point,
      bet: ticket.bet,
      timestamp: ticket.time
    })
  }
}
