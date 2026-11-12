import { Account } from '@db/model'

import { AccountType } from '@shared/common/types'
import { DEFAULT_ACCOUNT_STATUS, STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { accountLogToFile, flushLogQueue } from '@/worker/lib/accountLogToFile'

export function terminateWorker() {
  process.exit(0)
}

export async function exitWithLog(
  port: import('worker_threads').MessagePort,
  account: AccountType,
  textLog: string,
  statusLogin = STATUS_LOGIN.FAIL,
  status = STATUS_ACCOUNT.EXIT
) {
  const autoLoginAttempts = (account.autoLoginAttempts ?? 0) + 1

  if (autoLoginAttempts >= 2) {
    port.postMessage({
      type: 'MoveAccountToEnd',
      data: Account.update({ id: account.id }, DEFAULT_ACCOUNT_STATUS)
    })

    terminateWorker()
  }

  port.postMessage({
    type: 'DataUpdateAccount',
    data: Account.update(
      { id: account.id },
      {
        textLog,
        statusLogin,
        status,
        checkBoxAutoLogin: 1,
        autoLoginAttempts
      }
    )
  })
  await accountLogToFile(account.platformName, account.loginID, textLog, 'Program')
  await flushLogQueue(account.platformName, account.loginID, 'Program')

  terminateWorker()
}
