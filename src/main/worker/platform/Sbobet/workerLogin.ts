/* eslint-disable @typescript-eslint/no-explicit-any */
import { MessagePort } from 'worker_threads'
import { parentPort } from 'worker_threads'

import { Account, Setting } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'
import FormData from 'form-data'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'

import { AccountType } from '@shared/common/types'
import { OPTIONS_PROXY, STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { exitWithLog } from '@/worker/lib/exitWithLog'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { updateAccountStatus } from '@/worker/lib/updateAccountStatus'
import { AccountBalanceResponse } from '@/worker/platform/Sbobet/common/types'
import { buildHeaders, getXsrfToken } from '@/worker/platform/Sbobet/helper'

const port = parentPort
if (!port) throw new Error('IllegalState')

let globalCookie = ''
let proxyAgent: HttpsProxyAgent<string> | undefined

// ==== COOKIE MERGE ====
function mergeCookie(res: fetch.Response) {
  const setCookie = res.headers.get('set-cookie')
  if (!setCookie) return

  const cookieMap = {}

  if (globalCookie) {
    globalCookie.split(';').forEach((pair) => {
      const [key, value] = pair.trim().split('=')
      if (key && value) {
        cookieMap[key] = value
      }
    })
  }

  setCookie.split(',').forEach((cookieStr) => {
    const cookiePair = cookieStr.split(';')[0].trim()
    const [key, value] = cookiePair.split('=')
    if (key && value) {
      cookieMap[key] = value
    }
  })

  globalCookie = Object.entries(cookieMap)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ')
}

// ==== FETCH SESSION ====
async function fetchWithSession(url: string, options: any = {}): Promise<fetch.Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Cookie: globalCookie
    },
    ...(proxyAgent && { agent: proxyAgent })
  })
  mergeCookie(res)
  return res
}

port.on('message', async ({ account }: { account: AccountType }) => {
  try {
    await loginToSbobet(port, account)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('Error login To Sbobet:', errorMessage)

    await exitWithLog(port, account, `Login error: ${errorMessage}`)
  }
})

async function loginToSbobet(port: MessagePort, account: AccountType) {
  const accountData = await Account.findOne({ id: account.id })
  if (!accountData) throw new Error('Account not found')

  // Validate  proxy
  const { status, data } = isProxyConfigValid(account)
  if (!status) {
    const errorMessage = 'Invalid proxy address format – unable to determine valid URI.'
    throw new Error(errorMessage)
  }

  // Build proxy agent
  proxyAgent =
    account.proxyScope !== OPTIONS_PROXY.NONE
      ? new HttpsProxyAgent(
          `http://${data.newUsername}:${data.newPassword}@${data.newIpAddress}:${data.newPort}`
        )
      : undefined

  await updateAccountStatus(port, account, 'Verifying login information...')

  // Step 1: init homepage
  await fetchWithSession(account.loginURL)
  await updateAccountStatus(port, account, 'Step 1: Init homepage (OK)')

  // Step 2: get product (redirect)
  const response2 = await fetchWithSession(
    'https://api-home.sbobet.com/api/Product/GetCurrentAsiProduct?product=Sports',
    { headers: buildHeaders(account) }
  )
  const location2 = response2.headers.get('location')
  if (!location2) {
    throw new Error('No redirect location2 found in response')
  }
  await updateAccountStatus(port, account, 'Step 2: Get product (OK)')

  // Step 3: authorize
  const urlObj = new URL(location2)
  const url3 = urlObj.href

  const response3 = await fetchWithSession(url3, {
    headers: buildHeaders(account),
    redirect: 'manual'
  })

  const location3 = response3.headers.get('location')
  if (!location3) {
    throw new Error('No redirect location3 found in response')
  }
  await updateAccountStatus(port, account, 'Step 3: Get authorize (OK)')

  // Step 4: redirect
  const url4 = location3
  await fetchWithSession(url4, { headers: buildHeaders(account) })
  await updateAccountStatus(port, account, 'Step 4: Redirect (OK)')

  // Step 5: redirect get xsrf
  const url5 = location3
  const response5 = await fetchWithSession(url5, { headers: buildHeaders(account) })
  const setCookie = response5.headers.get('set-cookie')
  const xsrfToken = getXsrfToken(setCookie)

  await updateAccountStatus(port, account, 'Step 5: Get xsrf-token (OK)')

  // Step 6: login POST
  const url6 = location3
  const form = new FormData()
  form.append('Username', account.loginID)
  form.append('Password', account.password)
  form.append('Version', '1')
  form.append('DeviceType', '0')

  const response6 = await fetchWithSession(url6, {
    method: 'POST',
    headers: buildHeaders(account, { 'X-Xsrf-Token': xsrfToken }),
    body: form,
    redirect: 'manual'
  })

  if ((response6.headers.get('content-type') || '').includes('json')) {
    const dataAuth = await response6.json()
    if (dataAuth?.message) throw new Error(dataAuth.message)
  }

  const location6 = response6.headers.get('location')
  if (!location6) {
    throw new Error('No redirect location6 found in response')
  }

  await updateAccountStatus(port, account, 'Step 6: Request login (OK)')

  // Step 7: redirect
  const url7 = location6
  const response7 = await fetchWithSession(url7, {
    headers: buildHeaders(account, { 'X-Xsrf-Token': xsrfToken })
  })

  const location7 = response7.headers.get('location')
  if (!location7) {
    throw new Error('No redirect location7 found in response')
  }

  await updateAccountStatus(port, account, 'Step 7: Redirect (OK)')

  // Step 8: redirect
  const url8 = location7
  const response8 = await fetchWithSession(url8, {
    headers: buildHeaders(account, { 'X-Xsrf-Token': xsrfToken }),
    redirect: 'manual'
  })

  const location8 = response8.headers.get('location')
  if (!location8) {
    throw new Error('No redirect location8 found in response')
  }
  await updateAccountStatus(port, account, 'Step 8: Redirect (OK)')

  // Bước 9: getCustomerInfo
  const url9 = 'https://sportsbook.sbobet.com/api/account/getCustomerInfo'
  const response9 = await fetchWithSession(url9, {
    headers: buildHeaders(account)
  })
  const dataResponse9 = await response9.json()
  if (!dataResponse9) {
    throw new Error('No redirect location9 found in response')
  }
  await updateAccountStatus(port, account, 'Step 9: Get customer-info (OK)')

  // Bước 10: redirect getBalance
  const url10 = 'https://api-home.sbobet.com/api/AccountBalance/Get'
  const response10 = await fetchWithSession(url10, {
    headers: buildHeaders(account, { Host: 'api-home.sbobet.com' })
  })

  const data10 = (await response10.json()) as AccountBalanceResponse

  const credit = data10?.generalBalance?.betCredit
  const cashBalance = data10?.generalBalance?.cashBalance
  const outstanding = data10?.generalBalance?.outstanding
  const givenCredit = data10?.generalBalance?.givenCredit

  if (credit == null || cashBalance == null || outstanding == null || givenCredit == null) {
    throw new Error('Unable to fetch AccountBalance: One or more balance fields are null')
  }
  await updateAccountStatus(port, account, 'Step 10: Get account-balance (OK)')

  const setting = Setting.findAll()[0] as SettingSchemaType
  port?.postMessage({
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
        currency: 'HKD',
        cookie: globalCookie,
        status: STATUS_ACCOUNT.LOGOUT,
        statusLogin: STATUS_LOGIN.SUCCESS,
        textLog: `Login ${account.loginID} successfully!`,
        host: 'https://sportsbook.sbobet.com/'
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
