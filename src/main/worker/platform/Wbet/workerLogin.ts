import { MessagePort, parentPort } from 'worker_threads'

import { Account, Setting } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'
import { HttpsProxyAgent } from 'https-proxy-agent'

import { AccountType } from '@shared/common/types'
import { OPTIONS_PROXY, STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { exitWithLog } from '@/worker/lib/exitWithLog'
import { fetchWithRetry } from '@/worker/lib/fetchWithRetry'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { updateAccountStatus } from '@/worker/lib/updateAccountStatus'
import { ResAuth_Wbet } from '@/worker/platform/Wbet/common/types'
import { buildPlatformUrl_WBet } from '@/worker/platform/Wbet/helper'

const port = parentPort
if (!port) throw new Error('IllegalState')

port.on('message', async ({ account }: { account: AccountType }) => {
  try {
    await loginToWbet(port, account)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    let textLog = 'Access failed, please try again later...'

    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('_CONNECTION_FAILED')) {
      textLog = '(ERROR) - Proxy connection failed.'
    } else if (
      errorMessage.includes('The user aborted a request') ||
      errorMessage.includes('Status: 404')
    ) {
      textLog = '(ERROR) - Sportsbook system currently under maintenance.'
    } else if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
      textLog = '(ERROR) - Request timed out.'
    } else if (errorMessage.includes('Invalid JSON')) {
      textLog = '(ERROR) - Invalid response from server.'
    } else if (errorMessage.includes('HTTP error')) {
      textLog = `(ERROR) - ${errorMessage}`
    } else {
      textLog = errorMessage
    }
    console.error('Error login To Sbobet:', errorMessage)

    await exitWithLog(port, account, `Login error: ${textLog}`)
  }
})

async function loginToWbet(port: MessagePort, account: AccountType) {
  if (!Account.findOne({ id: account.id })) {
    throw new Error('Account not found')
  }

  await updateAccountStatus(port, account, 'Checking Login Info...')

  const { status, data } = isProxyConfigValid(account)

  if (!status) {
    throw new Error('Invalid proxy address format – unable to determine valid URI.')
  }

  const { newIpAddress, newPort, newUsername, newPassword } = data

  const proxyUrl =
    status && account.proxyScope !== OPTIONS_PROXY.NONE
      ? `http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`
      : undefined

  const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

  await updateAccountStatus(port, account, 'Sending login request...')
  const resAuth = await fetchWithRetry(
    buildPlatformUrl_WBet(account, 'AUTH'),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
      },
      body: JSON.stringify({
        account_id: account.loginID,
        password: account.password
      }),
      ...(proxyAgent && { agent: proxyAgent })
    },
    3,
    10000
  )

  const dataResAuth = resAuth as ResAuth_Wbet
  await accountLogToFile(
    account.platformName,
    account.loginID,
    `ResAuth:${JSON.stringify(dataResAuth)}`,
    'Program'
  )

  if (dataResAuth.status == -500) {
    throw new Error('Incorrect account or password')
  }

  if (dataResAuth.status == 1 && dataResAuth.statusdesc == 'OK') {
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
          cookie: dataResAuth.member_profile.player_info[0].session_token,
          parent_id: dataResAuth.member_profile.player_info[0].parent_id,
          typeCrawl: setting.gameType,
          currency: dataResAuth.member_profile.player_wallet[0].currency_code,
          credit: String(dataResAuth.member_profile.player_wallet[0].available_balance),
          cashBalance: String(dataResAuth.member_profile.player_wallet[0].cash_balance),
          outstanding: String(dataResAuth.member_profile.player_wallet[0].frozen_balance),
          givenCredit: String(dataResAuth.member_profile.player_wallet[0].credit_limit),
          host: account.loginURL,
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

  throw new Error(`Unexpected response code: ${dataResAuth.status}`)
}
