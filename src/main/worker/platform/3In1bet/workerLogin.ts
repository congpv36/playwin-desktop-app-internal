import { parentPort } from 'worker_threads'

import { Account, Setting } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'

import { AccountType } from '@shared/common/types'
import { OPTIONS_PROXY, STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { exitWithLog } from '@/worker/lib/exitWithLog'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { mergeCookies } from '@/worker/lib/mergeCookies'
import { updateAccountStatus } from '@/worker/lib/updateAccountStatus'
import { UserInfoResponse } from '@/worker/platform/3In1bet/common/types'
import { buildPlatformUrl_3In1Bet } from '@/worker/platform/3In1bet/helper'

const port = parentPort
if (!port) throw new Error('IllegalState')

port.on('message', async ({ account }: { account: AccountType }) => {
  try {
    await loginToPlatform(port, account)
  } catch (error) {
    let errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Fail login:', errorMessage)

    if (
      errorMessage.includes('invalid json response body') &&
      errorMessage.includes('Unexpected token') &&
      errorMessage.includes('MULTI')
    ) {
      errorMessage = 'Account temporarily locked due to failed logins. Contact your upline.'
    }
    console.error('Error login To 3In1Bet:', errorMessage)

    await exitWithLog(port, account, `Login error: ${String(errorMessage)}`)
  }
})

export async function loginToPlatform(
  port: import('worker_threads').MessagePort,
  account: AccountType
) {
  const updateLog = (textLog: string, statusLogin?: string, status?: string) =>
    updateAccountStatus(port, account, textLog, { statusLogin, status })

  await updateLog('Checking Login Info...')

  // Proxy check
  const { status, data } = isProxyConfigValid(account)
  if (!status) {
    throw new Error('Proxy Error: Invalid proxy address format.')
  }

  const { newIpAddress, newPort, newUsername, newPassword } = data
  const proxyUrl =
    account.proxyScope !== OPTIONS_PROXY.NONE
      ? `http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`
      : undefined
  const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

  let cookieHeader = ''

  // Step 0: homepage
  await updateLog('Step 0: Requesting homepage...')
  const preRes = await fetch(buildPlatformUrl_3In1Bet(account), {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
    },
    redirect: 'manual',
    ...(proxyAgent && { agent: proxyAgent })
  })
  cookieHeader = mergeCookies(cookieHeader, preRes.headers.get('set-cookie'))

  // Step 0.1: check.aspx
  await updateLog('Step 0.1: Verifying session...')
  const checkRes = await fetch(buildPlatformUrl_3In1Bet(account, 'CHECK'), {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Referer: account.loginURL,
      Cookie: cookieHeader,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
    },
    redirect: 'manual',
    ...(proxyAgent && { agent: proxyAgent })
  })
  cookieHeader = mergeCookies(cookieHeader, checkRes.headers.get('set-cookie'))
  cookieHeader += (cookieHeader.endsWith(';') ? ' ' : '; ') + `userName=${account.loginID}`

  // Step 1: login
  await updateLog('Step 1: Sending login request...')
  const loginRes = await fetch(buildPlatformUrl_3In1Bet(account, 'PROCESSLOGIN'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0',
      Origin: account.loginURL,
      Referer: account.loginURL,
      Cookie: cookieHeader,
      ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
    },
    body: new URLSearchParams({
      isEncrypt: '0',
      button: 'Login',
      UserName: account.loginID,
      Password: account.password
    }).toString(),
    redirect: 'manual',
    ...(proxyAgent && { agent: proxyAgent })
  })

  const response = await loginRes.text()
  if (response.includes('<a href="/member/lists/password.aspx?type=2">here</a>')) {
    throw new Error('Account password has expired. Please update it on website.')
  }

  cookieHeader = mergeCookies(cookieHeader, loginRes.headers.get('set-cookie'))

  // Step 2: validate redirect
  await updateLog('Step 2: Validating login redirect...')
  const location = loginRes.headers.get('location')
  if (loginRes.status !== 302 || !location) {
    throw new Error('Login failed: unexpected response (no redirect).')
  }
  if (location.includes('InvalidLogin')) {
    throw new Error('Login failed: invalid username or password')
  }

  // Step 3: topheader
  await updateLog('Step 3: Verifying login session...')
  const homeRes = await fetch(buildPlatformUrl_3In1Bet(account, 'MAIN_TOP_HEADER'), {
    headers: {
      Cookie: cookieHeader,
      'User-Agent': 'Mozilla/5.0',
      ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
    },
    redirect: 'follow',
    ...(proxyAgent && { agent: proxyAgent })
  })
  cookieHeader = mergeCookies(cookieHeader, homeRes.headers.get('set-cookie'))

  const text = await homeRes.text()
  if (!text.includes('Logout')) {
    throw new Error('Login failed: Our website is currently under maintenance.')
  }

  // Step 4: UserInfo
  await updateLog('Step 4: Fetching account info...')
  cookieHeader += (cookieHeader.endsWith(';') ? ' ' : '; ') + `DefaultOddsType=MY`
  const userInfoRes = await fetch(buildPlatformUrl_3In1Bet(account, 'USER_INFO_PANEL_HOST'), {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Origin: account.loginURL,
      Referer: account.loginURL + 'main/index.aspx',
      Cookie: cookieHeader,
      ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
    },
    ...(proxyAgent && { agent: proxyAgent })
  })

  if (!userInfoRes.ok) {
    throw new Error('Login failed: cannot fetch user info.')
  }

  const userInfoJson: unknown = await userInfoRes.json()
  const userInfo = userInfoJson as Partial<UserInfoResponse>

  if (!userInfo || !('BetCredit' in userInfo)) {
    throw new Error('Login failed: invalid user info response.')
  }

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
        cookie: cookieHeader,
        typeCrawl: setting.gameType,
        currency: userInfo.Currency || 'USD',
        cashBalance: String(userInfo.Balance ?? '0'),
        outstanding: String(userInfo.Outstanding ?? '0'),
        givenCredit: String(userInfo.GivenCredit ?? '0'),
        credit: String(userInfo.BetCredit ?? '0'),
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
