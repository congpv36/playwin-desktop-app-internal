import { MessagePort } from 'worker_threads'

import { FailedBetList } from '@db/model'

import { TicketBetType } from '@shared/common/types'

import { checkClearData } from '@/worker/lib/checkClearData'
import { formatTime } from '@/worker/lib/formatTime'

export function handleOutOfCommission(
  port: MessagePort,
  profit: number,
  ticketI: TicketBetType,
  ticketII: TicketBetType,
  oddI: number | string,
  oddII: number | string,
  originalOddI: number,
  originalOddII: number
) {
  const ticketUpdate = [
    {
      ...ticketI,
      profit,
      odd: oddI,
      info: `Out of Commission${originalOddI !== Number(oddI) ? `: ${originalOddI} -> ${oddI}` : ''}`,
      time: formatTime()
    },
    {
      ...ticketII,
      profit,
      odd: oddII,
      info: `Out of Commission${originalOddII !== Number(oddII) ? `: ${originalOddII} -> ${oddII}` : ''}`,
      time: formatTime()
    }
  ]

  checkClearData()
  const recordDB = FailedBetList.create({
    dataPair: JSON.stringify(ticketUpdate)
  })
  port.postMessage({ type: 'FailedBetList', recordDB })
}
