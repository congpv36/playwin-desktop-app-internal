import { MessagePort, parentPort } from 'worker_threads'

import { Account, Setting } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'

import { AccountType } from '@shared/common/types'
import { STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { exitWithLog } from '@/worker/lib/exitWithLog'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { updateAccountStatus } from '@/worker/lib/updateAccountStatus'
import { checkPlayerDafaBet } from '@/worker/platform/DafaBet/actions/checkPlayer'
import { getBalanceDafaBet } from '@/worker/platform/DafaBet/actions/getBalance'
import { loginDafaBet } from '@/worker/platform/DafaBet/actions/login'

const port = parentPort
if (!port) throw new Error('IllegalState')

port.on('message', async ({ account }: { account: AccountType }) => {
  try {
    await loginToDafaBet(port, account)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error login To DafaBet:', errorMessage)

    await exitWithLog(port, account, `Login error: ${String(errorMessage)}`)
  }
})

async function loginToDafaBet(port: MessagePort, account: AccountType) {
  if (!Account.findOne({ id: account.id })) {
    throw new Error('Account not found')
  }

  await updateAccountStatus(port, account, 'Checking Login Info...')

  const { status } = isProxyConfigValid(account)
  if (!status) {
    throw new Error('Invalid proxy address format – unable to determine valid URI.')
  }

  await updateAccountStatus(port, account, 'Sending login request...')
  const { code, message, cookie } = await loginDafaBet(account)

  if (code == 0) {
    Account.update({ id: account.id }, { cookie })

    const checkPlayer = await checkPlayerDafaBet({ ...account, cookie })
    if (checkPlayer.ErrorCode != 0) {
      throw new Error(checkPlayer.Message)
    }

    const accountUpdated = Account.update(
      { id: account.id },
      { parent_id: checkPlayer.alsPlayerId }
    ) as AccountType

    const { ErrorCode, Message, cashBalance, outstanding, givenCredit, credit, currency } =
      await getBalanceDafaBet(accountUpdated)

    if (ErrorCode == 0 && !Number.isNaN(Number(credit))) {
      await updateAccountStatus(port, account, 'Login successful. Fetching account balance...')

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
            cashBalance,
            outstanding,
            givenCredit,
            credit,
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
