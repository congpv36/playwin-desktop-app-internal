import { Account } from '@db/model'

import { TicketBetType } from '@shared/common/types'

export const checkAccountContinues = (ticketPair: TicketBetType[]) => {
  const [ticketI, ticketII]: TicketBetType[] = ticketPair

  const checkAccount = (ticket: TicketBetType) =>
    Account.findOne({
      id: ticket.idAccount,
      status: 'Logout',
      checkBoxBet: 1,
      statusLogin: 'Success'
    })

  const accountInfoI = checkAccount(ticketI)
  const accountInfoII = checkAccount(ticketII)

  if (accountInfoI && accountInfoII) {
    return { accountInfoI, accountInfoII }
  }

  return false
}
