import { MessagePort, parentPort } from 'worker_threads'

import { Account, Setting } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'

import { AccountType } from '@shared/common/types'
import { STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { exitWithLog } from '@/worker/lib/exitWithLog'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { updateAccountStatus } from '@/worker/lib/updateAccountStatus'
import { getBalanceSingBet } from '@/worker/platform/SingBet/actions/getBalance'
import { loginSingBet } from '@/worker/platform/SingBet/actions/login'

const port = parentPort
if (!port) throw new Error('IllegalState')

port.on('message', async ({ account }: { account: AccountType }) => {
  try {
    await loginToSingBet(port, account)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error login To SingBet:', errorMessage)

    await exitWithLog(port, account, `Login error: ${String(errorMessage)}`)
  }
})

async function loginToSingBet(port: MessagePort, account: AccountType) {
  if (!Account.findOne({ id: account.id })) {
    throw new Error('Account not found')
  }

  await updateAccountStatus(port, account, 'Checking Login Info...')

  const { status } = isProxyConfigValid(account)
  if (!status) {
    const errorMessage = 'Invalid proxy address format – unable to determine valid URI.'
    throw new Error(errorMessage)
  }

  await updateAccountStatus(port, account, 'Sending login request...')
  const { code, message, dataJson, cookie } = await loginSingBet(account)

  if (code == 0) {
    const accountUpdated = Account.update(
      { id: account.id },
      {
        uid: dataJson.uid,
        cookie
      }
    ) as AccountType

    await updateAccountStatus(port, account, 'Login successful. Fetching account balance...')
    const { ErrorCode, Message, credit, cashBalance, outstanding, givenCredit, currency } =
      await getBalanceSingBet(accountUpdated)

    if (ErrorCode == 0 && credit !== '' && !Number.isNaN(Number(credit))) {
      const setting = Setting.findAll()[0] as SettingSchemaType
      port.postMessage({
        type: 'DataUpdateAccount',
        data: Account.update(
          { id: account.id },
          {
            checkBoxBet: 1,
            checkBoxRefresh: 1,
            checkBoxAutoLogin: 1,
            autoLoginAttempts: 0,
            typeCrawl: setting.gameType,
            credit,
            cashBalance,
            outstanding,
            givenCredit,
            currency,
            status: STATUS_ACCOUNT.LOGOUT,
            statusLogin: STATUS_LOGIN.SUCCESS,
            textLog: `Login ${account.loginID} successfully!`
          }
        )
      })
      await accountLogToFile(
        account.platformName,
        account.loginID,
        `Login Status: Login ${account.loginID} successfully!`,
        'Program'
      )

      process.exit(0)
    }
    throw new Error(Message)
  }

  throw new Error(message)
}
