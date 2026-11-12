import { PerMatchLimit } from '@db/model'

import { TicketBetType } from '@shared/common/types'

export const CreatePerMatchLimit = (idAccount: string, Ticket: TicketBetType) => {
  const { league, home, away, bet, number, type, hdp_point, betAmount_Standard, odd } = Ticket

  PerMatchLimit.create({
    league,
    home,
    away,
    bet,
    time: number,
    type,
    hdp_point,
    odd,
    betAmount_Standard,
    idAccount
  })
}
