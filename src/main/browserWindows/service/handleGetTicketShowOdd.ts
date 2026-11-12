import { Account, Setting } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'

import { AccountType, DataCrawlType, GetTicketShowOdd, TicketBetType } from '@shared/common/types'

import { handleGetTicket } from '@/worker/lib/betService'
import { formatTime } from '@/worker/lib/formatTime'

export const handleGetTicketShowOdd = async (data: {
  ticket: DataCrawlType
  infoBet: {
    account: {
      id: string
      loginID: string
      platform: string
    }
    bet: string
    odd: number
  }
}): Promise<GetTicketShowOdd> => {
  const { ticket, infoBet } = data

  const setting = Setting.findAll()[0] as SettingSchemaType
  const account = Account.findOne({ id: infoBet.account.id }) as AccountType

  const standardizeData = {
    ...ticket,
    bet: infoBet.bet,
    odd: infoBet.odd,
    idAccount: infoBet.account.id,

    profit: 0,
    info: 'Bet Mode Show Odds',
    betAmount_Standard: '',
    company: `${infoBet.account.platform}-${infoBet.account.loginID}`,
    coverage: ticket.number == 0 ? 'FT' : 'FirstHalf',
    gameType: setting.gameType,
    betOpposite: 0,
    betSub: '',
    oddSub: 0,
    time: formatTime(),
    receiptID: '',
    receiptStatus: '',
    checkOdd: 0,
    oddFrom: '',
    oddTo: '',
    checkContra: 1,
    isBetAllowed: true,
    betRejectionReason: ''
  } as TicketBetType

  if (!account) {
    return {
      code: 1,
      message: 'No account selected for this platform',
      odds: infoBet.odd,
      oldsOdd: infoBet.odd,
      min: 0,
      max: 0,
      ticket: standardizeData,
      response: null
    }
  }

  const {
    ErrorCode: code,
    Message: message,
    Odds: odds,
    OldsOdd: oldsOdd,
    Data: response,
    Min: min,
    Max: max
  } = await handleGetTicket(standardizeData, account)

  return {
    code,
    message,
    odds,
    oldsOdd,
    min,
    max,
    ticket: { ...standardizeData, odd: odds },
    response
  }
}
