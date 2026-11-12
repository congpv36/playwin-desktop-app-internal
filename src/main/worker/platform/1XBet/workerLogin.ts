import { MessagePort, parentPort } from 'worker_threads'

import { Account, Setting } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'
import { HttpsProxyAgent } from 'https-proxy-agent'

import { AccountType } from '@shared/common/types'
import { OPTIONS_PROXY, STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { exitWithLog } from '@/worker/lib/exitWithLog'
import { fetchWithTimeoutRetry } from '@/worker/lib/fetchWithTimeoutRetry'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { mergeCookies } from '@/worker/lib/mergeCookies'
import { updateAccountStatus } from '@/worker/lib/updateAccountStatus'
import { getBalance1XBet } from '@/worker/platform/1XBet/actions/getBalance'
import { API_ENDPOINTS, buildHeaders1XBet, X_FC } from '@/worker/platform/1XBet/common/constant'
import { AuthResponse, VerifyResponse } from '@/worker/platform/1XBet/common/types'
import { buildDeviceCookie1XBet, encodeAuth1XBet } from '@/worker/platform/1XBet/helper'
import { executeHdScript1XBet } from '@/worker/platform/1XBet/helper/executeHdScript'

const USER_AGENT_1XBET =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36'

const port = parentPort
if (!port) throw new Error('IllegalState')

port.on('message', async ({ account }: { account: AccountType }) => {
  try {
    await loginTo1XBet(port, account)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error loginTo1XBet:', errorMessage)

    await exitWithLog(port, account, `Login error: ${buildLoginErrorLog(errorMessage)}`)
  }
})

function buildLoginErrorLog(errorMessage: string): string {
  if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('_CONNECTION_FAILED')) {
    return '(ERROR) - Proxy connection failed.'
  }

  if (errorMessage.includes('The user aborted a request') || errorMessage.includes('timeout')) {
    return '(ERROR) - Request timed out, will retry automatically.'
  }

  return errorMessage
}

async function loginTo1XBet(port: MessagePort, account: AccountType) {
  if (!Account.findOne({ id: account.id })) throw new Error('Account not found')

  await updateAccountStatus(port, account, 'Checking Login Info...')

  const { status, data } = isProxyConfigValid(account)
  if (!status) {
    throw new Error('Proxy Error: Invalid proxy address format – unable to determine valid URI.')
  }

  const proxyUrl =
    account.proxyScope !== OPTIONS_PROXY.NONE
      ? `http://${data.newUsername}:${data.newPassword}@${data.newIpAddress}:${data.newPort}`
      : undefined
  const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

  let Cookie = buildDeviceCookie1XBet(account.loginID)

  await updateAccountStatus(port, account, 'Getting Fatman UUID...')

  const response_fatman_uuid = await fetchWithTimeoutRetry(API_ENDPOINTS.FATMAN_FC, {
    method: 'POST',
    headers: {
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Content-Length': '0',
      'Content-Type': 'application/json',
      Origin: 'https://1xbetjap.com',
      Referer: 'https://1xbetjap.com/en',
      'Sec-Ch-Ua': '"Not;A=Brand";v="8", "Chromium";v="150"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Linux"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
      'X-Fc': X_FC,
      Cookie
    }
  })

  if (!response_fatman_uuid.ok) {
    const text = await response_fatman_uuid.text()
    throw new Error(`HTTP ${response_fatman_uuid.status}: ${text}`)
  }

  const xUuid = response_fatman_uuid.headers.get('x-uuid')

  if (!xUuid) {
    throw new Error('Failed to retrieve Fatman-Uuid data')
  }

  Cookie += `; fatman_uuid=${xUuid}`

  await updateAccountStatus(port, account, 'Getting Session Cookie...')

  const response_welcome_bonuses = await fetchWithTimeoutRetry(API_ENDPOINTS.WELCOME_BONUSES, {
    method: 'GET',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Content-Type': 'application/json',
      'Is-Srv': 'false',
      Referer: 'https://1xbetjap.com/en',
      'Sec-Ch-Ua': '"Not;A=Brand";v="8", "Chromium";v="150"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Linux"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
      'X-App-N': '__V3_HOST_APP__',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Svc-Source': '__V3_HOST_APP__',
      Cookie
    }
  })

  if (!response_welcome_bonuses.ok) {
    const text = await response_welcome_bonuses.text()
    throw new Error(`HTTP ${response_welcome_bonuses.status}: ${text}`)
  }

  const setCookies_welcome_bonuses = response_welcome_bonuses.headers.raw()['set-cookie'] ?? []

  const sessionCookie = setCookies_welcome_bonuses
    .map((setCookie) => setCookie.split(';')[0])
    .find((cookie) => cookie.startsWith('SESSION='))

  if (!sessionCookie) {
    throw new Error('Failed to retrieve SESSION cookie')
  }

  Cookie += `; ${sessionCookie}`

  await updateAccountStatus(port, account, 'Verifying Device...')

  const res_hd_external_script = await fetchWithTimeoutRetry(API_ENDPOINTS.HD_EXTERNAL_SCRIPT(), {
    method: 'GET',
    headers: {
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: 'https://1xbetjap.com/en',
      'Sec-Ch-Ua': '"Not;A=Brand";v="8", "Chromium";v="150"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Linux"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
      Cookie
    }
  })

  if (!res_hd_external_script.ok) {
    const text = await res_hd_external_script.text()
    throw new Error(`HTTP ${res_hd_external_script.status}: ${text}`)
  }

  const xHdTraceId = res_hd_external_script.headers.get('x-hd-trace-id')

  if (!xHdTraceId) {
    throw new Error('Failed to retrieve X-Hd-Trace-Id header')
  }

  const hdExternalScript = await res_hd_external_script.text()

  const compD = await executeHdScript1XBet(hdExternalScript, {
    url: 'https://1xbetjap.com/en',
    userAgent: USER_AGENT_1XBET,
    xHdTraceId
  })

  const res_verify = await fetchWithTimeoutRetry(API_ENDPOINTS.VERIFY, {
    method: 'POST',
    headers: {
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Content-Type': 'text/plain;charset=UTF-8',
      Origin: 'https://1xbetjap.com',
      Referer: 'https://1xbetjap.com/en',
      'Sec-Ch-Ua': '"Not;A=Brand";v="8", "Chromium";v="150"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Linux"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': USER_AGENT_1XBET,
      Cookie
    },
    ...(proxyAgent && { agent: proxyAgent }),
    body: compD
  })

  if (!res_verify.ok) {
    const text = await res_verify.text()
    throw new Error(`HTTP ${res_verify.status}: ${text}`)
  }

  const res_verify_json = (await res_verify.json()) as VerifyResponse

  if (!res_verify_json.token) {
    throw new Error('Failed to retrieve verify token')
  }

  account = Account.update(
    { id: account.id },
    {
      hdToken: res_verify_json.token
    }
  ) as AccountType

  await updateAccountStatus(port, account, 'Securing Session...')

  const res_secure = await fetchWithTimeoutRetry(API_ENDPOINTS.SECURE, {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      Origin: 'https://1xbetjap.com',
      Referer: 'https://1xbetjap.com/en/user/login?return-url=%252Fen%252Foffice%252Faccount',
      'X-Requested-With': 'XMLHttpRequest',
      'X-App-N': '__WELCOME_APP__',
      'X-Svc-Source': '__WELCOME_APP__',
      'Is-Srv': 'false',
      'X-Hd': account.hdToken,
      Cookie
    }
  })

  if (!res_secure.ok) {
    const text = await res_secure.text()
    throw new Error(`HTTP ${res_secure.status}: ${text}`)
  }

  const res_secure_json = await res_secure.json()

  const grantEntry = Object.entries(res_secure_json).find(([key]) => key.startsWith('_grant_'))

  if (grantEntry) {
    const [key, value] = grantEntry
    Cookie += `; ${key}=${value}`
  }

  const setCookies_secure = res_secure.headers.raw()['set-cookie'] ?? []

  for (const setCookie of setCookies_secure) {
    const cookie = setCookie.split(';')[0]

    if (cookie) {
      Cookie += `; ${cookie}`
    }
  }

  const uLogin = encodeAuth1XBet(account.loginID)
  const uPassword = encodeAuth1XBet(account.password)

  const payload = {
    uLogin,
    uPassword,
    comp_d: compD
  }

  await updateAccountStatus(port, account, 'Authenticating...')

  const resAuth = await fetchWithTimeoutRetry(API_ENDPOINTS.AUTH, {
    method: 'POST',
    headers: {
      ...buildHeaders1XBet(account),
      Cookie
    },
    ...(proxyAgent && { agent: proxyAgent }),
    body: JSON.stringify(payload)
  })

  if (!resAuth.ok) {
    const text = await resAuth.text()
    throw new Error(`HTTP ${resAuth.status}: ${text}`)
  }

  const resDataAuth = (await resAuth.json()) as AuthResponse
  await accountLogToFile(
    account.platformName,
    account.loginID,
    `ResDataAuth: ${JSON.stringify(resDataAuth)}`,
    'Program'
  )

  if (resDataAuth.success == true) {
    Cookie = mergeCookies(Cookie, resAuth.headers.get('set-cookie'))

    const accountUpdated = Account.update(
      { id: account.id },
      {
        cookie: Cookie,
        token: resDataAuth.token
      }
    ) as AccountType

    await updateAccountStatus(port, account, 'Getting Balance...')

    const { ErrorCode, Message, cashBalance, outstanding, givenCredit, credit, currency } =
      await getBalance1XBet(accountUpdated)

    if (ErrorCode == 0 && !Number.isNaN(Number(cashBalance.trim()))) {
      const setting = Setting.findAll()[0] as SettingSchemaType
      port.postMessage({
        type: 'DataUpdateAccount',
        data: Account.update(
          { id: account.id },
          {
            checkBoxBet: 1,
            checkBoxRefresh: 1,
            checkBoxAutoLogin: 1,
            typeCrawl: setting.gameType,
            cashBalance,
            outstanding,
            givenCredit,
            credit,
            currency,
            parent_id: resDataAuth.user.id,
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

    throw new Error(`Failed to get balance for account (ErrorCode: ${ErrorCode}): ${Message}`)
  }

  const textLog =
    resDataAuth.type === 10
      ? 'Log in on the website to verify you’re not a robot, then return to the app.'
      : resDataAuth.message || `Login failed (type: ${resDataAuth.type})`

  throw new Error(textLog)
}
