import { AccountType, TicketBetType } from '@shared/common/types'

import { CreatePerMatchLimit } from '@/worker/lib/createPerMatchLimit'

export const UpdatePerMatchLimit = (account: AccountType, Ticket: TicketBetType) => {
  try {
    const { id: idAccount } = account
    const { league = '', home = '', away = '' } = Ticket

    if (league && home && away) {
      CreatePerMatchLimit(idAccount, Ticket)
    }
  } catch (error) {
    console.log('Error UpdatePerMatchLimit', error)
  }
}
