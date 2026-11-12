import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'

import { AccountType } from '@shared/common/types'
import { OPTIONS_PROXY } from '@shared/main/constants'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { mergeCookies } from '@/worker/lib/mergeCookies'
import { buildHeadersLogin } from '@/worker/platform/DafaBet/common/contants'
import {
  AuthenticateResponse_DafaBet,
  LoginResult_DafaBet
} from '@/worker/platform/DafaBet/common/types'
import { buildPlatformUrl } from '@/worker/platform/DafaBet/helper'

export const loginDafaBet = async (account: AccountType): Promise<LoginResult_DafaBet> => {
  try {
    const { status, data } = isProxyConfigValid(account)
    const { newIpAddress, newPort, newUsername, newPassword } = data

    const proxyUrl =
      status && account.proxyScope !== OPTIONS_PROXY.NONE
        ? `http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`
        : undefined

    const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

    const body = new URLSearchParams({
      username: account.loginID,
      password: account.password
    })

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Request Login: ${JSON.stringify({ username: account.loginID, password: '***' })}`,
      'Program'
    )

    const res = await fetch(buildPlatformUrl(account, 'LOGIN'), {
      method: 'POST',
      redirect: 'manual',
      headers: buildHeadersLogin(account),
      ...(proxyAgent && { agent: proxyAgent }),
      body
    })

    const raw = await res.text()
    const cookie = mergeCookies('', res.headers.get('set-cookie'))

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Response Login: Status ${res.status}, Body: ${raw.slice(0, 500)}`,
      'Program'
    )

    let resData: AuthenticateResponse_DafaBet | null = null
    try {
      resData = JSON.parse(raw) as AuthenticateResponse_DafaBet
    } catch {
      return { code: 1, message: `Login failed with status ${res.status}`, cookie: '' }
    }

    const hasTokens = /(?:^|;\s*)wbcToken=/.test(cookie) && /(?:^|;\s*)extToken=/.test(cookie)

    if (res.status === 200 && resData?.success && resData?.authenticated && hasTokens) {
      return { code: 0, message: 'Login success', cookie }
    }

    const reason = resData?.reasonJson?.responseMessage || resData?.reason || resData?.message
    return {
      code: 1,
      message: reason ? `Login failed: ${reason}` : `Login failed with status ${res.status}`,
      cookie: ''
    }
  } catch (error) {
    console.error('Error action login DafaBet:', error)

    const errorMessage = error instanceof Error ? error.message : String(error)
    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Login Fail: ${errorMessage}`,
      'Program'
    )

    return { code: -1, message: `Unexpected error: ${errorMessage}`, cookie: '' }
  }
}
