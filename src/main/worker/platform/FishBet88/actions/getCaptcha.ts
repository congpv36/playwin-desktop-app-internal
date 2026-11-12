import fetch from 'node-fetch'

import { AccountType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { buildHeadersApi, buildHeadersCaptcha } from '@/worker/platform/FishBet88/common/constants'
import {
  ApiResponse_FishBet88,
  LoginModelResult_FishBet88
} from '@/worker/platform/FishBet88/common/types'
import { buildApiUrl, ProxyAgent_FishBet88 } from '@/worker/platform/FishBet88/helper'

/** Step 1: request a login token — each token is bound to one captcha image. */
export const getLoginModelFishBet88 = async (
  account: AccountType,
  proxyAgent: ProxyAgent_FishBet88
): Promise<string> => {
  const res = await fetch(buildApiUrl('LOGIN_MODEL'), {
    method: 'GET',
    headers: buildHeadersApi(account),
    ...(proxyAgent && { agent: proxyAgent })
  })

  const raw = await res.text()
  await accountLogToFile(
    account.platformName,
    account.loginID,
    `Response LoginModel: Status ${res.status}, ${raw}`,
    'Program'
  )

  let data: ApiResponse_FishBet88<LoginModelResult_FishBet88> | null = null
  try {
    data = JSON.parse(raw)
  } catch {
    data = null
  }

  const token = data?.Success ? data.Result?.Token : ''
  if (!token) {
    throw new Error(`Unable to get login token (status ${res.status})`)
  }

  return token
}

/** Step 2: download the captcha image for a token, as a data URL the renderer can display. */
export const getCaptchaImageFishBet88 = async (
  account: AccountType,
  captchaToken: string,
  proxyAgent: ProxyAgent_FishBet88
): Promise<string> => {
  const res = await fetch(buildApiUrl('CAPTCHA', captchaToken), {
    method: 'GET',
    headers: buildHeadersCaptcha(account),
    ...(proxyAgent && { agent: proxyAgent })
  })

  const contentType = res.headers.get('content-type') ?? ''
  if (!res.ok || !contentType.startsWith('image/')) {
    throw new Error(`Unable to load captcha image (status ${res.status}, type ${contentType})`)
  }

  const buffer = await res.buffer()
  return `data:${contentType.split(';')[0]};base64,${buffer.toString('base64')}`
}
