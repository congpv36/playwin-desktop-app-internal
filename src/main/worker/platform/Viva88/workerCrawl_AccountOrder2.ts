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
import { getBalanceViva88bet } from '@/worker/platform/Viva88/actions/getBalance'

const port = parentPort
if (!port) throw new Error('IllegalState')

port.on('message', (account: AccountType) => {
  handleCrawlData(account)
})

const handleCrawlData = async (account: AccountType) => {
  while (true) {
    const setting = Setting.findAll()[0] as SettingSchemaType
    if (setting.isBetByOtherAcc == 0) process.exit(0)

    const checkAccount = Account.findOne({
      id: account.id,
      status: STATUS_ACCOUNT.LOGOUT,
      statusLogin: STATUS_LOGIN.SUCCESS,
      orderID: 2
    }) as AccountType

    if (!checkAccount) process.exit(0)

    await fnCrawlData(account)
    await setTimeout(5000)
  }
}

const fnCrawlData = async (account: AccountType) => {
  const { ErrorCode, Message, credit, cashBalance, outstanding, givenCredit, currency } =
    await getBalanceViva88bet(account)

  if (ErrorCode !== 0) {
    await logAndTriggerRelogin(port, account, `Get balance failed: ${Message}`, {
      isActiveFn: isAccountActive_AccountOrder2
    })

    process.exit(0)
  }

  await logAndNotify(port, account, `${logTime()} Ready to bet`, {
    fields: { credit, cashBalance, outstanding, givenCredit, currency },
    isActiveFn: isAccountActive_AccountOrder2
  })
}
