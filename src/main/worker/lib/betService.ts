import { AccountType, TicketBetType } from '@shared/common/types'

import { PLATFORM_SERVICES } from '@/worker/platform/platform.config'

export const handleGetTicket = async (ticket: TicketBetType, accountInfo: AccountType) => {
  const handler = PLATFORM_SERVICES[ticket.platform]
  return await handler.getTicket(accountInfo, ticket)
}

export const handleBetTicket = async (
  ticket: TicketBetType,
  accountInfo: AccountType,
  dataPlaceBet
) => {
  const handler = PLATFORM_SERVICES[ticket.platform]
  return await handler.placeBet(ticket, accountInfo, dataPlaceBet)
}

export const handleReBetTicket = async (
  ticket: TicketBetType,
  accountInfo: AccountType,
  betPlatform: string,
  retries = 10
) => {
  let messageError = 'Error: Retry Failed'

  const platformHandler = PLATFORM_SERVICES[betPlatform]
  if (!platformHandler) {
    throw new Error(`Unsupported betting platform: ${betPlatform}`)
  }

  const { getTicket, placeBet } = platformHandler

  for (let i = 0; i < retries; i++) {
    const {
      ErrorCode: errorCodeGetTicket,
      Message,
      Hdp_point,
      HDP,
      Odds,
      Data: dataGetTicket
    } = await getTicket(accountInfo, ticket)

    if (errorCodeGetTicket === 1 || !dataGetTicket) {
      return {
        ErrorCode: 1,
        Data: { info: Message, receiptID: '', receiptStatus: 'Fail', odd: Odds }
      }
    }

    const ticketUpdate = { ...ticket, hdp_point: Hdp_point, HDP, odd: Odds }
    const { ErrorCode, Data } = await placeBet(ticketUpdate, accountInfo, dataGetTicket)

    if (ErrorCode == 0) {
      return { ErrorCode, Data: { ...Data, odd: Odds } }
    }

    messageError = Data?.info || ''
  }

  return {
    ErrorCode: 1,
    Data: { info: messageError, receiptID: '', receiptStatus: 'Fail', odd: ticket.odd }
  }
}
