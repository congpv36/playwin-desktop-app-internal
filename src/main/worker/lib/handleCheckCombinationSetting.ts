import type { MessagePort } from 'worker_threads'

import { SportBookSettingType } from '@shared/common/types'
import { GenerateTicketUpdateType, TicketCombinationType } from '@shared/common/types'

import { validateSettingBeforeBet } from '@/worker/lib/validateSettingBeforeBet'

export const handleCheckCombinationSetting = (
  ticketUpdate: GenerateTicketUpdateType[],
  sportBook1: SportBookSettingType,
  sportBook2: SportBookSettingType,
  gameType: string,
  port: MessagePort
): TicketCombinationType[] | undefined => {
  const resultValidate = validateSettingBeforeBet(
    ticketUpdate,
    sportBook1,
    sportBook2,
    gameType,
    port
  )
  if (!resultValidate.valid) return

  const { platforms, betAmountStandardValid, isTicketBetFlags } = resultValidate

  const validBetTicketPairs = platforms.map((platform, idx) => {
    const { setting, ticket } = platform
    const betAmount_Standard = betAmountStandardValid[idx]

    // Determine if betting is allowed
    let isBetAllowed = setting.generalSetting !== 'NoBet'
    let betRejectionReason = isBetAllowed ? '' : 'No Bet By User'

    if (setting.generalSetting === 'BetSelected') {
      isBetAllowed = isTicketBetFlags[idx] === 1
      betRejectionReason = isBetAllowed ? '' : 'No Bet By User'
    }

    const commonFields = {
      isBetAllowed,
      betRejectionReason,
      betAmount_Standard,
      checkOdd: platform.setting.checkOdd,
      oddFrom: platform.setting.oddFrom,
      oddTo: platform.setting.oddTo
    }

    // Construct ticket object depending on betOpposite
    const ticketData =
      setting.betOpposite === 0
        ? {
            ...ticket,
            betOpposite: 0,
            ...commonFields
          }
        : {
            ...ticket,
            bet: ticket.betSub,
            odd: ticket.oddSub,
            profit: ticket.profit - ticket.odd + ticket.oddSub,
            betOpposite: 1,
            ...commonFields
          }

    return ticketData
  })

  return validBetTicketPairs
}
