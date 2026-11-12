/* eslint-disable no-constant-condition */
import { setTimeout } from 'timers/promises'
import { parentPort } from 'worker_threads'

import { Account, Setting } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'

import { AccountType } from '@shared/common/types'
import { STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { isAccountActive_AccountOrder2 } from '@/worker/lib/checkAccount'
import { logAndNotify, logAndTriggerRelogin } from '@/worker/lib/exitAccountWithLog'
import { logTime } from '@/worker/lib/logTime'
import { systemLogToFile } from '@/worker/lib/systemLogToFile'
import { getBalance1XBet } from '@/worker/platform/1XBet/actions/getBalance'
import { PLATFORM } from '@/worker/platform/platform.config'

const port = parentPort
if (!port) throw new Error('IllegalState')

port.on('message', async (action: string) => {
  if (action == 'Start') {
    try {
      await handleCrawlData()
    } catch (error) {
      await systemLogToFile(
        `Error Handle Crawl Data Account Order2 1XBet: ${JSON.stringify(error)}`,
        'Error'
      )
    }
  }
})

const handleCrawlData = async () => {
  while (true) {
    const setting = Setting.findAll()[0] as SettingSchemaType
    if (setting.isBetByOtherAcc == 0) process.exit(0)

    const account = Account.findOne({
      platformName: PLATFORM['1XBET'],
      status: STATUS_ACCOUNT.LOGOUT,
      statusLogin: STATUS_LOGIN.SUCCESS,
      orderID: 2
    }) as AccountType

    if (!account) {
      await setTimeout(2000)
      continue
    }

    await fnCrawlData(account)
    await setTimeout(5000)
  }
}

const fnCrawlData = async (account: AccountType) => {
  const { ErrorCode, Message, cashBalance, outstanding, givenCredit, credit, currency } =
    await getBalance1XBet(account)

  if (ErrorCode === 0) {
    await logAndNotify(port, account, `${logTime()} Ready to bet`, {
      fields: { cashBalance, outstanding, givenCredit, credit, currency },
      isActiveFn: isAccountActive_AccountOrder2
    })
    return
  }

  await logAndTriggerRelogin(port, account, `Get balance failed: ${Message}`, {
    isActiveFn: isAccountActive_AccountOrder2
  })
}
