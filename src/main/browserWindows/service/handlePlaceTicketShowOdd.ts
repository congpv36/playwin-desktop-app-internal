import { Account, SuccessListShowOdd } from '@db/model'
import { BrowserWindow } from 'electron'
import { v4 as uuidv4 } from 'uuid'

import {
  AccountType,
  GetTicketShowOdd,
  PlaceTicketShowOdd,
  WaitingSuccessContraDBType
} from '@shared/common/types'

import { handleBetTicket } from '@/worker/lib/betService'
import handleSuccessListShowOdd from '@/worker/lib/handleSuccessListShowOdd'
import { sendCount } from '@/worker/lib/sendCount'

export const handlePlaceTicketShowOdd = async (
  data: {
    ticketShowOdd: GetTicketShowOdd
    stake: number
  },
  mainWindow: BrowserWindow
): Promise<PlaceTicketShowOdd> => {
  const { ticketShowOdd, stake } = data

  const account = Account.findOne({ id: ticketShowOdd.ticket.idAccount }) as AccountType

  const standardizeData = { ...ticketShowOdd.ticket, betAmount_Standard: String(stake) }
  const { ErrorCode: code, Data: response } = await handleBetTicket(
    standardizeData,
    account,
    ticketShowOdd.response
  )

  if (code == 0) {
    const recordDB = SuccessListShowOdd.create({
      uuid: uuidv4(),
      dataPair: JSON.stringify([
        {
          ...standardizeData,
          profit: null,
          info: 'Bet Success',
          receiptID: response.receiptID,
          receiptStatus: 'Confirm'
        }
      ])
    }) as WaitingSuccessContraDBType

    await sendCount('TotalSuccessListShowOdd', SuccessListShowOdd, mainWindow)
    await handleSuccessListShowOdd(recordDB, mainWindow)
  }

  return {
    code,
    response
  }
}
