/* eslint-disable no-constant-condition */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { setTimeout } from 'timers/promises'
import { parentPort } from 'worker_threads'

import { Account } from '@db/model'

import { AccountType } from '@shared/common/types'
import { STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { getBalanceSbobet } from './actions/getBalance'

import { isAccountActive_AccountOrder2 } from '@/worker/lib/checkAccount'
import { logAndNotify, logAndTriggerRelogin } from '@/worker/lib/exitAccountWithLog'
import { logTime } from '@/worker/lib/logTime'
import { systemLogToFile } from '@/worker/lib/systemLogToFile'
import { PLATFORM } from '@/worker/platform/platform.config'

const port = parentPort
if (!port) throw new Error('IllegalState')

port.on('message', async (action: string) => {
  if (action == 'Start') {
    try {
      await handleCrawlData()
    } catch (error) {
      await systemLogToFile(
        `Error Handle Crawl Data Account Order2 Sbobet: ${JSON.stringify(error)}`,
        'Error'
      )
    }
  }
})

const handleCrawlData = async () => {
  while (true) {
    const account = Account.findOne({
      platformName: PLATFORM.SBOBET,
      status: STATUS_ACCOUNT.LOGOUT,
      statusLogin: STATUS_LOGIN.SUCCESS,
      orderID: 2
    }) as AccountType

    if (!account) {
      await setTimeout(2000)
      continue
    }

    await fnCrawlData(account)
    await setTimeout(3000)
  }
}
const fnCrawlData = async (account: AccountType) => {
  const { ErrorCode, Message, credit, cashBalance, outstanding, givenCredit, currency } =
    (await getBalanceSbobet(account)) as any

  if (ErrorCode == 0) {
    await logAndNotify(port, account, `${logTime()} Ready to bet`, {
      fields: { credit, cashBalance, outstanding, givenCredit, currency },
      isActiveFn: isAccountActive_AccountOrder2
    })
    return
  }

  await logAndTriggerRelogin(port, account, `Get balance failed: ${Message}`, {
    isActiveFn: isAccountActive_AccountOrder2
  })
}
