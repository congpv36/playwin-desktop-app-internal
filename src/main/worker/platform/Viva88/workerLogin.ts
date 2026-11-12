import { MessagePort, parentPort } from 'worker_threads'

import { Account, Setting } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'
import { HttpsProxyAgent } from 'https-proxy-agent'

import { AccountType } from '@shared/common/types'
import {
  DEFAULT_ACCOUNT_STATUS,
  OPTIONS_PROXY,
  STATUS_ACCOUNT,
  STATUS_LOGIN
} from '@shared/main/constants'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { exitWithLog } from '@/worker/lib/exitWithLog'
import { fetchWithTimeout } from '@/worker/lib/fetchWithTimeout'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { mergeCookies } from '@/worker/lib/mergeCookies'
import { updateAccountStatus } from '@/worker/lib/updateAccountStatus'
import { getBalanceViva88bet } from '@/worker/platform/Viva88/actions/getBalance'
import { LoginResponse } from '@/worker/platform/Viva88/common/types'
import { buildSocketIoWsUrl, CFS, extractTkAndId, RSA } from '@/worker/platform/Viva88/helper'

const port = parentPort

if (!port) throw new Error('IllegalState')

port.on('message', async ({ account }: { account: AccountType }) => {
  try {
    await loginToViva88Bet(port, account)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    console.error('Error login To Viva88Bet:', errorMessage)
    await exitWithLog(port, account, `Login error: ${String(errorMessage)}`)
  }
})

async function loginToViva88Bet(port: MessagePort, account: AccountType) {
  const accountData = (await Account.findOne({
    id: account.id,
    statusDelete: 0
  })) as AccountType

  if (!accountData || accountData.status === STATUS_ACCOUNT.LOGIN) {
    throw new Error('Account not found or already logged in')
  }

  const loginURL = account.loginURL

  const updateLog = (textLog: string, statusLogin?: string, status?: string) =>
    updateAccountStatus(port, account, textLog, { statusLogin, status })

  const abortIfLoginUrlChanged = async () => {
    const latestAccount = (await Account.findOne({
      id: account.id,
      statusDelete: 0
    })) as AccountType

    if (!latestAccount || latestAccount.loginURL === loginURL) {
      return false
    }

    port.postMessage({
      type: 'DataUpdateAccount',
      data: Account.update({ id: account.id }, DEFAULT_ACCOUNT_STATUS)
    })
    process.exit(0)
  }

  let cookieHeader = `LOGIN_PLATFORM=desktop;rememberMe=false;_culture=en-US`

  await updateLog('Checking Login Info...')

  const { status, data } = isProxyConfigValid(account)

  if (!status) {
    throw new Error('Invalid proxy address format – unable to determine valid URI.')
  }

  const { proxyScope, newIpAddress, newPort, newUsername, newPassword } = data
  const proxyUrl =
    proxyScope !== OPTIONS_PROXY.NONE
      ? `http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`
      : undefined
  const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

  // Step 0: homepage
  await updateLog('Step 0: Requesting homepage...')
  const preRes = await fetchWithTimeout(account.loginURL, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
    },
    redirect: 'follow',
    ...(proxyAgent && { agent: proxyAgent })
  })

  const html = await preRes.text()

  const mkeyMatch = html.match(/"mkey":"(.*?)"/i)
  const ekeyMatch = html.match(/"ekey":"(.*?)"/i)

  const mkey = mkeyMatch?.[1] || ''
  const ekey = ekeyMatch?.[1] || ''

  cookieHeader = mergeCookies(cookieHeader, preRes.headers.get('set-cookie'))
  await accountLogToFile(
    account.platformName,
    account.loginID,
    `Step 0: Requesting homepage (OK)`,
    'Program'
  )

  // Step 1: login
  await abortIfLoginUrlChanged()
  await updateLog('Step 1: Sending login request...')
  const loginRes = await fetchWithTimeout(`${account.loginURL}api/Login`, {
    method: 'POST',
    headers: {
      Host: 'api.viva88.net',
      'Content-Type': 'application/json',
      Accept: '*/*',
      Origin: account.loginURL,
      Referer: account.loginURL,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'max-age=0',
      ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
    },
    body: JSON.stringify({
      username: account.loginID,
      password: CFS(account.password),
      rsaPassword: RSA(account.password, { mkey, ekey }),
      platform: 'desktop',
      language: 'en',
      loginCode: ''
    }),
    ...(proxyAgent && { agent: proxyAgent })
  })

  cookieHeader = mergeCookies(cookieHeader, loginRes.headers.get('set-cookie'))

  const resData = (await loginRes.json()) as LoginResponse
  const errorCode = resData.errorCode
  const errorMessage = resData.errorMessage
  const redirectUrl = resData.redirectUrl
  await accountLogToFile(
    account.platformName,
    account.loginID,
    `Response Step 1: ${JSON.stringify(resData)}`,
    'Program'
  )

  if (errorCode !== 408 && errorCode !== 0) {
    throw new Error(errorMessage)
  }

  if (!redirectUrl) {
    throw new Error('No data redirectUrl')
  }

  await accountLogToFile(
    account.platformName,
    account.loginID,
    `Step 1: Sending login request (OK)`,
    'Program'
  )

  // Step 2: Goto RedirectUrl
  await abortIfLoginUrlChanged()
  await updateLog('Step 2: Following redirect URL...')

  const resRedirectUrl = await fetchWithTimeout(redirectUrl, {
    method: 'GET',
    headers: {
      Host: 'd.viva88.net',
      Cookie: 'LOGIN_PLATFORM=desktop; rememberMe=false',
      'Sec-Ch-Ua': `"Not=A?Brand";v="24", "Chromium";v="140"`,
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': `"Windows"`,
      'Accept-Language': 'en-US,en;q=0.9',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Sec-Fetch-Site': 'same-site',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-User': '?1',
      'Sec-Fetch-Dest': 'document',
      Referer: account.loginURL,
      'Accept-Encoding': 'gzip, deflate, br',
      Priority: 'u=0, i'
    },
    redirect: 'manual',
    ...(proxyAgent && { agent: proxyAgent })
  })

  const location = resRedirectUrl.headers.get('location')
  const setCookieRedirectUrl = resRedirectUrl.headers.get('set-cookie')
  const currentUserMatch = setCookieRedirectUrl?.match(/CurrentUser=([^;]+)/)

  if (!currentUserMatch?.[1]) {
    throw new Error('No data currentUserMatch')
  }

  Account.update({ id: account.id }, { loginID: String(currentUserMatch[1]) })

  cookieHeader = mergeCookies(cookieHeader, setCookieRedirectUrl)

  if (!location) {
    throw new Error('No data location')
  }
  await accountLogToFile(
    account.platformName,
    account.loginID,
    `Step 2: Following redirect URL (OK)`,
    'Program'
  )

  // Step 3: Goto Home/Index by location
  await abortIfLoginUrlChanged()
  await updateLog('Step 3: Accessing Home/Index page...')
  const resHomeIndex = await fetchWithTimeout(location, {
    method: 'GET',
    headers: {
      Host: 'd.viva88.net',
      Cookie: cookieHeader,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      Referer: account.loginURL,
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br'
    },
    redirect: 'manual',
    ...(proxyAgent && { agent: proxyAgent })
  })
  const dataHomeIndex = await resHomeIndex.text()
  const result = await extractTkAndId(dataHomeIndex)
  if (!result) {
    throw new Error('Failed to extract tk and ID socket')
  }

  const socketUrl = buildSocketIoWsUrl(result.tk, result.ID)

  const accountUpdate = Account.update(
    { id: account.id },
    { host: 'https://d.viva88.net', socketUrl, cookie: cookieHeader, parent_id: result.ID }
  ) as AccountType

  await accountLogToFile(
    account.platformName,
    account.loginID,
    `Step 3: Accessing Home/Index page (OK)`,
    'Program'
  )
  // Step 4: Get data balance
  await abortIfLoginUrlChanged()
  await updateLog('Step 4: Fetching balance...')
  const { ErrorCode, Message, credit, cashBalance, outstanding, givenCredit, currency } =
    await getBalanceViva88bet(accountUpdate)

  if (ErrorCode !== 0) {
    throw new Error(`Failed to get balance for account (ErrorCode: ${ErrorCode}): ${Message}`)
  }

  await abortIfLoginUrlChanged()
  const setting = Setting.findAll()[0] as SettingSchemaType
  port.postMessage({
    type: 'LoginSuccess',
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
  await updateLog(`Login ${account.loginID} successfully!`)

  process.exit(0)
}
