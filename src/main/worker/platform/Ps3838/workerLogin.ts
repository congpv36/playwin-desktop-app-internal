import { MessagePort, parentPort } from 'worker_threads'

import { Account, Setting } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'
import { authenticator } from 'otplib'

import { AccountType } from '@shared/common/types'
import { DEFAULT_ACCOUNT_STATUS, STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { accountLogToFile, flushLogQueue } from '@/worker/lib/accountLogToFile'
import { exitWithLog, terminateWorker } from '@/worker/lib/exitWithLog'
import { updateAccountStatus } from '@/worker/lib/updateAccountStatus'
import { getBalancePs3838 } from '@/worker/platform/Ps3838/actions/getBalance'
import { buildHeadersLogin, buildHeadersVerifyOtp } from '@/worker/platform/Ps3838/common/contants'
import {
  buildPlatformUrl,
  buildProxyAgent,
  extractCookie,
  parseLoginResponse
} from '@/worker/platform/Ps3838/helper'

const port = parentPort
if (!port) throw new Error('IllegalState')

port.on('message', async (message: { account?: AccountType }) => {
  if (!message?.account) return

  const { account } = message

  try {
    await loginToPs3838(port, account)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    console.error('Error login To Ps3838:', errorMessage)
    port.postMessage({ type: 'OtpVerified', data: { accountId: account.id } })

    const resetTextLogByError: Record<string, string> = {
      [OTP_CANCELLED_ERROR]: 'Login cancelled by user.',
      [RATE_LIMIT_CANCELLED_ERROR]: 'Login cancelled by user while rate-limited by Cloudflare.',
      [ACCOUNT_LOCKED_ERROR]:
        'Account temporarily disabled: too many incorrect authentication attempts.',
      [ACCOUNT_DISABLED_ERROR]: 'Account disabled: too many incorrect authentication attempts.',
      [LOGIN_NAME_EXPIRED_ERROR]:
        'Login name has expired. Please go to the website to change it, then come back and try again.'
    }

    if (errorMessage in resetTextLogByError) {
      const textLog = resetTextLogByError[errorMessage]
      port.postMessage({
        type: 'DataUpdateAccount',
        data: Account.update(
          { id: account.id },
          {
            ...DEFAULT_ACCOUNT_STATUS,
            textLog
          }
        )
      })
      await accountLogToFile(account.platformName, account.loginID, textLog, 'Program')
      await flushLogQueue(account.platformName, account.loginID, 'Program')
      terminateWorker()
      return
    }

    await exitWithLog(port, account, `Login error: ${String(errorMessage)}`)
  }
})

const OTP_CANCELLED_ERROR = 'OTP_CANCELLED'
const RATE_LIMIT_CANCELLED_ERROR = 'RATE_LIMIT_CANCELLED'
const ACCOUNT_LOCKED_ERROR = 'ACCOUNT_LOCKED'
const ACCOUNT_DISABLED_ERROR = 'ACCOUNT_DISABLED'
const LOGIN_NAME_EXPIRED_ERROR = 'LOGIN_NAME_EXPIRED'

const AUTH_STEP_DELAY_MS = 3_000
const RATE_LIMIT_MAX_RETRIES = 5
const RATE_LIMIT_DEFAULT_DELAY_MS = 30_000
const AUTO_OTP_MAX_ATTEMPTS = 2
const AUTO_OTP_RETRY_DELAY_MS = 1_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function waitForOtp(port: MessagePort): Promise<string> {
  return new Promise((resolve) => {
    const handleOtpMessage = (message: { type?: string; otp?: string }) => {
      if (message?.type === 'SubmitOtp') {
        port.off('message', handleOtpMessage)
        resolve(message.otp ?? '')
      }
    }
    port.on('message', handleOtpMessage)
  })
}

function generateAutoOtp(secret: string, clockOffsetMs = 0): string {
  authenticator.options = { epoch: Date.now() + clockOffsetMs }
  return authenticator.generate(secret)
}

function postAccountLocked(
  port: MessagePort,
  account: AccountType,
  failedAttempts?: number
): never {
  port.postMessage({
    type: 'AccountLocked',
    data: {
      accountId: account.id,
      loginID: account.loginID,
      platformName: account.platformName,
      failedAttempts
    }
  })
  throw new Error(ACCOUNT_LOCKED_ERROR)
}

function postAccountDisabled(port: MessagePort, account: AccountType): never {
  port.postMessage({
    type: 'AccountDisabled',
    data: {
      accountId: account.id,
      loginID: account.loginID,
      platformName: account.platformName
    }
  })
  throw new Error(ACCOUNT_DISABLED_ERROR)
}

function postLoginNameExpired(port: MessagePort, account: AccountType): never {
  port.postMessage({
    type: 'LoginNameExpired',
    data: {
      accountId: account.id,
      loginID: account.loginID,
      platformName: account.platformName
    }
  })
  throw new Error(LOGIN_NAME_EXPIRED_ERROR)
}

function createOtpCancellation(port: MessagePort) {
  let reject: (error: Error) => void = () => {}
  const promise = new Promise<never>((_, rejectFn) => {
    reject = rejectFn
  })

  const handleCancelMessage = (message: { type?: string }) => {
    if (message?.type === 'CancelOtp') reject(new Error(OTP_CANCELLED_ERROR))
  }
  port.on('message', handleCancelMessage)

  return {
    promise,
    dispose: () => port.off('message', handleCancelMessage)
  }
}

function createRateLimitCancellation(port: MessagePort) {
  let reject: (error: Error) => void = () => {}
  const promise = new Promise<never>((_, rejectFn) => {
    reject = rejectFn
  })

  const handleCancelMessage = (message: { type?: string }) => {
    if (message?.type === 'CancelRateLimit') reject(new Error(RATE_LIMIT_CANCELLED_ERROR))
  }
  port.on('message', handleCancelMessage)

  return {
    promise,
    dispose: () => port.off('message', handleCancelMessage)
  }
}

async function performAuthRequest(
  port: MessagePort,
  account: AccountType,
  label: string,
  requestLogPayload: unknown,
  doFetch: () => ReturnType<typeof fetch>
) {
  let res: Awaited<ReturnType<typeof fetch>>
  let raw: string

  for (let attempt = 0; ; attempt++) {
    res = await doFetch()

    if (res.status === 405) {
      throw new Error('OUR WEBSITE IS UNDER SYSTEM MAINTENANCE')
    }

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `[${label}] Request: ${JSON.stringify(requestLogPayload)}`,
      'Program'
    )

    raw = await res.text()

    if (res.status === 429) {
      if (attempt >= RATE_LIMIT_MAX_RETRIES) {
        throw new Error('Login failed: Rate-limited by Cloudflare. Please try again later.')
      }

      let retryAfterSec = RATE_LIMIT_DEFAULT_DELAY_MS / 1000
      try {
        const parsedRetry = JSON.parse(raw) as { retry_after?: number }
        if (typeof parsedRetry.retry_after === 'number') {
          retryAfterSec = parsedRetry.retry_after
        }
      } catch {
        // keep default
      }

      const delayMs = retryAfterSec * 1000 * 2 ** attempt
      await accountLogToFile(
        account.platformName,
        account.loginID,
        `[${label}] Rate limited by Cloudflare (attempt ${attempt + 1}/${RATE_LIMIT_MAX_RETRIES}). Retrying in ${delayMs}ms.`,
        'Program'
      )

      port.postMessage({
        type: 'RateLimited',
        data: {
          accountId: account.id,
          loginID: account.loginID,
          platformName: account.platformName,
          retryAfterSec: Math.round(delayMs / 1000)
        }
      })

      const cancellation = createRateLimitCancellation(port)
      try {
        await Promise.race([sleep(delayMs), cancellation.promise])
      } finally {
        cancellation.dispose()
        port.postMessage({ type: 'RateLimitCleared', data: { accountId: account.id } })
      }

      continue
    }

    break
  }
  const cookie = extractCookie(res.headers.get('set-cookie'))
  const serverDate = res.headers.get('date')
  const vHucode = res.headers.get('v-hucode')

  await accountLogToFile(
    account.platformName,
    account.loginID,
    `[${label}] Response: ${raw}`,
    'Program'
  )

  let parsed: unknown = null
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = null
  }

  const code =
    parsed && typeof parsed === 'object'
      ? (parsed as { code?: number }).code
      : (parsed as number | null)
  const failedAttempts =
    parsed && typeof parsed === 'object'
      ? (parsed as { failedAttempts?: number }).failedAttempts
      : undefined
  const tokens =
    parsed && typeof parsed === 'object'
      ? (parsed as { tokens?: Record<string, string> }).tokens
      : undefined

  return { raw, cookie, code, failedAttempts, serverDate, vHucode, tokens }
}

async function requestAuth(
  port: MessagePort,
  account: AccountType,
  proxyAgent: HttpsProxyAgent<string> | undefined,
  options: { label: string }
) {
  const payload = {
    captcha: '',
    captchaToken: '',
    loginId: account.loginID,
    password: account.password
  }

  return performAuthRequest(port, account, options.label, { ...payload, password: '***' }, () =>
    fetch(buildPlatformUrl(account, 'AUTH'), {
      method: 'POST',
      headers: buildHeadersLogin(account),
      ...(proxyAgent && { agent: proxyAgent }),
      body: new URLSearchParams(payload)
    })
  )
}

async function requestVerifyOtp(
  port: MessagePort,
  account: AccountType,
  proxyAgent: HttpsProxyAgent<string> | undefined,
  options: { otp: string; cookie: string; label: string }
) {
  const payload = { otp: options.otp }

  return performAuthRequest(port, account, options.label, payload, () =>
    fetch(buildPlatformUrl(account, 'VERIFY_OTP'), {
      method: 'POST',
      headers: {
        ...buildHeadersVerifyOtp(account),
        Cookie: options.cookie
      },
      ...(proxyAgent && { agent: proxyAgent }),
      body: JSON.stringify(payload)
    })
  )
}

async function loginToPs3838(port: MessagePort, account: AccountType) {
  if (!Account.findOne({ id: account.id })) {
    throw new Error('Account not found')
  }

  await updateAccountStatus(port, account, 'Checking Login Info...')

  // build proxy agent
  const { status, proxyAgent } = buildProxyAgent(account)
  if (!status) {
    throw new Error('Invalid proxy address format – unable to determine valid URI.')
  }

  // call API
  await updateAccountStatus(port, account, 'Sending login request...')
  await sleep(2_000)
  const initialAuth = await requestAuth(port, account, proxyAgent, { label: 'Auth API 1 - Login' })
  let raw = initialAuth.raw
  let cookieHeader = initialAuth.cookie
  let vHucodeHeader = initialAuth.vHucode
  let tokensHeader = initialAuth.tokens
  let code = initialAuth.code
  const failedAttempts = initialAuth.failedAttempts
  const serverTime = initialAuth.serverDate ? new Date(initialAuth.serverDate).getTime() : NaN
  const clockOffsetMs = Number.isNaN(serverTime) ? 0 : serverTime - Date.now()

  if (code === 0) {
    throw new Error('Please enter a valid username and password.')
  }

  if (code === 19 && (failedAttempts ?? 0) >= 5) {
    postAccountLocked(port, account, failedAttempts)
  }

  if (code === 20) {
    postAccountDisabled(port, account)
  }

  if (code === 22) {
    postLoginNameExpired(port, account)
  }

  if (code === 17 || code === 19) {
    await updateAccountStatus(port, account, 'Waiting for authentication code...')

    const authCookie = cookieHeader
    let needsManualOtp = true

    if (account.secret) {
      await sleep(AUTH_STEP_DELAY_MS)

      for (let attempt = 1; attempt <= AUTO_OTP_MAX_ATTEMPTS; attempt++) {
        const otp = generateAutoOtp(account.secret, clockOffsetMs)
        const result = await requestVerifyOtp(port, account, proxyAgent, {
          otp,
          cookie: authCookie,
          label: 'Auth API 2 - Verify OTP (Auto)'
        })

        if (result.code === 19) {
          postAccountLocked(port, account, result.failedAttempts)
        }

        if (result.code === 20) {
          postAccountDisabled(port, account)
        }

        if (result.code === 22) {
          postLoginNameExpired(port, account)
        }

        if (result.code === 18) {
          await accountLogToFile(
            account.platformName,
            account.loginID,
            `[Auth API 2 - Verify OTP (Auto)] Automatic OTP generated from the saved secret was rejected (attempt ${attempt}/${AUTO_OTP_MAX_ATTEMPTS}).`,
            'Program'
          )

          if (attempt < AUTO_OTP_MAX_ATTEMPTS) {
            await sleep(AUTO_OTP_RETRY_DELAY_MS)
            continue
          }

          await accountLogToFile(
            account.platformName,
            account.loginID,
            `[Auth API 2 - Verify OTP (Auto)] Automatic OTP failed after ${AUTO_OTP_MAX_ATTEMPTS} attempts. Falling back to manual entry.`,
            'Program'
          )
          break
        }

        raw = result.raw
        cookieHeader = result.cookie
        vHucodeHeader = result.vHucode
        tokensHeader = result.tokens
        code = result.code
        needsManualOtp = false
        break
      }
    }

    if (needsManualOtp) {
      const cancellation = createOtpCancellation(port)
      port.postMessage({
        type: 'RequireOtp',
        data: { accountId: account.id, autoOtpFailed: Boolean(account.secret) }
      })

      try {
        for (;;) {
          const otp = await Promise.race([waitForOtp(port), cancellation.promise])
          const result = await Promise.race([
            requestVerifyOtp(port, account, proxyAgent, {
              otp,
              cookie: authCookie,
              label: 'Auth API 2 - Verify OTP'
            }),
            cancellation.promise
          ])

          if (result.code === 19) {
            postAccountLocked(port, account, result.failedAttempts)
          }

          if (result.code === 20) {
            postAccountDisabled(port, account)
          }

          if (result.code === 22) {
            postLoginNameExpired(port, account)
          }

          if (result.code === 18) {
            port.postMessage({ type: 'OtpInvalid', data: { accountId: account.id } })
            continue
          }

          raw = result.raw
          cookieHeader = result.cookie
          vHucodeHeader = result.vHucode
          tokensHeader = result.tokens
          code = result.code
          port.postMessage({ type: 'OtpVerified', data: { accountId: account.id } })
          break
        }
      } finally {
        cancellation.dispose()
      }
    }
  }

  const { status: loginStatus, message } = parseLoginResponse(raw)

  if (loginStatus === 'success') {
    const accountUpdated = Account.update(
      { id: account.id },
      {
        cookie: cookieHeader,
        vHucode: vHucodeHeader,
        token: JSON.stringify(tokensHeader ?? {})
      }
    ) as AccountType

    await updateAccountStatus(port, account, 'Login successful. Fetching account balance...')
    const { ErrorCode, cashBalance, outstanding, givenCredit, credit, currency } =
      await getBalancePs3838(accountUpdated)

    if (
      ErrorCode == 0 &&
      !Number.isNaN(Number(credit)) &&
      !Number.isNaN(Number(cashBalance)) &&
      !Number.isNaN(Number(outstanding)) &&
      !Number.isNaN(Number(givenCredit))
    ) {
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

    throw new Error('Failed to get balance for account')
  }

  throw new Error(`Login failed: ${message}`)
}
