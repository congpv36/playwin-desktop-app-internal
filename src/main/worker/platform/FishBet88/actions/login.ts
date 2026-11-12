import fetch from 'node-fetch'

import { AccountType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { buildHeadersApi } from '@/worker/platform/FishBet88/common/constants'
import {
  ApiResponse_FishBet88,
  LOGIN_CODE_FISHBET88,
  LoginResult_FishBet88,
  LoginResult_FishBet88Raw
} from '@/worker/platform/FishBet88/common/types'
import {
  buildApiUrl,
  isCaptchaErrorMessage,
  ProxyAgent_FishBet88
} from '@/worker/platform/FishBet88/helper'

const fail = (code: LoginResult_FishBet88['code'], message: string): LoginResult_FishBet88 => ({
  code,
  message,
  accessToken: '',
  account: null
})

export const loginFishBet88 = async (
  account: AccountType,
  { captcha, captchaToken }: { captcha: string; captchaToken: string },
  proxyAgent: ProxyAgent_FishBet88
): Promise<LoginResult_FishBet88> => {
  try {
    const payload = {
      username: account.loginID,
      password: account.password,
      captcha,
      token: captchaToken
    }

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Request Login: ${JSON.stringify({ ...payload, password: '***' })}`,
      'Program'
    )

    const res = await fetch(buildApiUrl('LOGIN'), {
      method: 'POST',
      headers: buildHeadersApi(account),
      ...(proxyAgent && { agent: proxyAgent }),
      body: JSON.stringify(payload)
    })

    const raw = await res.text()

    let data: ApiResponse_FishBet88<LoginResult_FishBet88Raw> | null = null
    try {
      data = JSON.parse(raw)
    } catch {
      data = null
    }

    const result = data?.Result
    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Response Login: Status ${res.status}, ErrorCode ${result?.ErrorCode}, Message ${
        result?.Message ?? data?.Error?.Message ?? data?.Message ?? raw.slice(0, 500)
      }, AttemptsRemain ${result?.AttemptsRemain}, BlockedTimeInMinutes ${result?.BlockedTimeInMinutes}`,
      'Program'
    )

    if (data?.Success && result?.ErrorCode === 0 && result.AccessToken) {
      return {
        code: LOGIN_CODE_FISHBET88.SUCCESS,
        message: result.Message || 'Login success',
        accessToken: result.AccessToken,
        account: result.Account
      }
    }

    const message =
      result?.Message ||
      data?.Error?.Message ||
      data?.Message ||
      `Login failed (status ${res.status})`

    if (result?.BlockedTimeInMinutes && result.BlockedTimeInMinutes > 0) {
      return fail(
        LOGIN_CODE_FISHBET88.BLOCKED,
        `Account blocked for ${result.BlockedTimeInMinutes} minutes: ${message}`
      )
    }

    if (result?.Account?.Suspended) {
      return fail(LOGIN_CODE_FISHBET88.BLOCKED, 'Account suspended')
    }

    if (isCaptchaErrorMessage(message)) {
      return fail(LOGIN_CODE_FISHBET88.CAPTCHA_INVALID, message)
    }

    return fail(LOGIN_CODE_FISHBET88.FAILED, message)
  } catch (error) {
    console.error('Error action login FishBet88:', error)

    const errorMessage = error instanceof Error ? error.message : String(error)
    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Login Fail: ${errorMessage}`,
      'Program'
    )

    return fail(LOGIN_CODE_FISHBET88.UNEXPECTED, `Unexpected error: ${errorMessage}`)
  }
}
