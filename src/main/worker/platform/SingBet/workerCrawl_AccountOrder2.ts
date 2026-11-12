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
import { PLATFORM } from '@/worker/platform/platform.config'
import { getBalanceSingBet } from '@/worker/platform/SingBet/actions/getBalance'

const port = parentPort
if (!port) throw new Error('IllegalState')

port.on('message', async (action: string) => {
  if (action == 'Start') {
    try {
      await handleCrawlData()
    } catch (error) {
      await systemLogToFile(
        `Error Handle Crawl Data Account Order2 SingBet: ${JSON.stringify(error)}`,
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
      platformName: PLATFORM.SINGBET,
      status: STATUS_ACCOUNT.LOGOUT,
      statusLogin: STATUS_LOGIN.SUCCESS,
      orderID: 2
    }) as AccountType

    if (!account) {
      await setTimeout(2000)
      continue
    }

    await fnCrawlData(account)
    await setTimeout(9000)
  }
}
const fnCrawlData = async (account: AccountType) => {
  const { ErrorCode, Message, credit, cashBalance, outstanding, givenCredit, currency } =
    await getBalanceSingBet(account)

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
