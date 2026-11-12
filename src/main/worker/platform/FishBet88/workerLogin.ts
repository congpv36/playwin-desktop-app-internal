import { MessagePort, parentPort } from 'worker_threads'

import { Account, Setting } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'

import { AccountType } from '@shared/common/types'
import { DEFAULT_ACCOUNT_STATUS, STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { accountLogToFile, flushLogQueue } from '@/worker/lib/accountLogToFile'
import { exitWithLog, terminateWorker } from '@/worker/lib/exitWithLog'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { updateAccountStatus } from '@/worker/lib/updateAccountStatus'
import { getBalanceFishBet88 } from '@/worker/platform/FishBet88/actions/getBalance'
import {
  getCaptchaImageFishBet88,
  getLoginModelFishBet88
} from '@/worker/platform/FishBet88/actions/getCaptcha'
import { loginFishBet88 } from '@/worker/platform/FishBet88/actions/login'
import {
  LOGIN_CODE_FISHBET88,
  LoginAccount_FishBet88
} from '@/worker/platform/FishBet88/common/types'
import { buildProxyAgent, ProxyAgent_FishBet88 } from '@/worker/platform/FishBet88/helper'
import { recognizeCaptcha } from '@/worker/platform/FishBet88/helper/captchaSolver'

const port = parentPort
if (!port) throw new Error('IllegalState')

const CAPTCHA_CANCELLED_ERROR = 'CAPTCHA_CANCELLED'
const CAPTCHA_TIMEOUT_ERROR = 'CAPTCHA_TIMEOUT'

const MAX_INVALID_CAPTCHA_ATTEMPTS = 5
/**
 * Captchas solved automatically before asking the user. The solver is ~100% accurate on the
 * current format, so repeated rejections mean something changed: let the user take over.
 */
const MAX_AUTO_CAPTCHA_ATTEMPTS = 3
const CAPTCHA_WAIT_TIMEOUT_MS = 180_000

port.on('message', async (message: { account?: AccountType }) => {
  if (!message?.account) return

  const { account } = message

  try {
    await loginToFishBet88(port, account)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error login To FishBet88:', errorMessage)

    port.postMessage({ type: 'CaptchaClosed', data: { accountId: account.id } })

    if (errorMessage === CAPTCHA_CANCELLED_ERROR) {
      const textLog = 'Login cancelled by user.'
      port.postMessage({
        type: 'DataUpdateAccount',
        data: Account.update({ id: account.id }, { ...DEFAULT_ACCOUNT_STATUS, textLog })
      })
      await accountLogToFile(account.platformName, account.loginID, textLog, 'Program')
      await flushLogQueue(account.platformName, account.loginID, 'Program')
      terminateWorker()
      return
    }

    const textLog =
      errorMessage === CAPTCHA_TIMEOUT_ERROR
        ? 'Login error: captcha was not entered in time.'
        : `Login error: ${errorMessage}`

    await exitWithLog(port, account, textLog)
  }
})

type CaptchaInput = { kind: 'submit'; captcha: string } | { kind: 'refresh' }

/** Waits for the user to submit / refresh / cancel the captcha shown in the renderer. */
function waitForCaptcha(port: MessagePort): Promise<CaptchaInput> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer)
      port.off('message', handleMessage)
    }

    const timer = setTimeout(() => {
      cleanup()
      reject(new Error(CAPTCHA_TIMEOUT_ERROR))
    }, CAPTCHA_WAIT_TIMEOUT_MS)

    const handleMessage = (message: { type?: string; captcha?: string }) => {
      switch (message?.type) {
        case 'SubmitCaptcha':
          cleanup()
          resolve({ kind: 'submit', captcha: (message.captcha ?? '').trim() })
          break
        case 'RefreshCaptcha':
          cleanup()
          resolve({ kind: 'refresh' })
          break
        case 'CancelCaptcha':
          cleanup()
          reject(new Error(CAPTCHA_CANCELLED_ERROR))
          break
      }
    }

    port.on('message', handleMessage)
  })
}

type CaptchaAnswer = { captcha: string; captchaToken: string; auto: boolean }

/**
 * Fetches a captcha and reads it with the template solver.
 * Returns null when the auto budget is used up or the image is not in the known captcha format
 * (auto-solving is then disabled for this login), so the caller asks the user.
 */
async function solveCaptchaAutomatically(
  account: AccountType,
  proxyAgent: ProxyAgent_FishBet88,
  autoState: { attemptsLeft: number }
): Promise<CaptchaAnswer | null> {
  if (autoState.attemptsLeft <= 0) return null
  autoState.attemptsLeft--

  const captchaToken = await getLoginModelFishBet88(account, proxyAgent)
  const image = await getCaptchaImageFishBet88(account, captchaToken, proxyAgent)

  let captcha: string | null = null
  let failReason = 'unknown captcha format'
  try {
    captcha = recognizeCaptcha(image)
  } catch (error) {
    failReason = error instanceof Error ? error.message : String(error)
  }

  if (captcha) {
    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Captcha auto-solved: ${captcha}`,
      'Program'
    )
    return { captcha, captchaToken, auto: true }
  }

  // Not the known format: retrying won't help, let the user handle the rest of this login.
  autoState.attemptsLeft = 0
  await accountLogToFile(
    account.platformName,
    account.loginID,
    `Captcha auto-solve failed (${failReason}), fallback to manual input.`,
    'Program'
  )
  return null
}

async function requestCaptchaFromUser(
  port: MessagePort,
  account: AccountType,
  proxyAgent: ProxyAgent_FishBet88,
  invalid: boolean
) {
  for (;;) {
    const captchaToken = await getLoginModelFishBet88(account, proxyAgent)
    const image = await getCaptchaImageFishBet88(account, captchaToken, proxyAgent)

    port.postMessage({
      type: 'RequireCaptcha',
      data: {
        accountId: account.id,
        loginID: account.loginID,
        platformName: account.platformName,
        image,
        invalid
      }
    })
    await updateAccountStatus(port, account, 'Waiting for captcha input...')

    const input = await waitForCaptcha(port)
    if (input.kind === 'submit' && input.captcha) {
      return { captcha: input.captcha, captchaToken, auto: false }
    }
    // refresh (or empty submit): fetch a new token + image and ask again
    invalid = false
  }
}

async function loginToFishBet88(port: MessagePort, account: AccountType) {
  if (!Account.findOne({ id: account.id })) {
    throw new Error('Account not found')
  }

  await updateAccountStatus(port, account, 'Checking Login Info...')

  const { status } = isProxyConfigValid(account)
  if (!status) {
    throw new Error('Invalid proxy address format – unable to determine valid URI.')
  }

  // Every login is a brand-new session: drop the previous AccessToken so it is never reused.
  Account.update({ id: account.id }, { token: '' })

  const proxyAgent = buildProxyAgent(account)
  const autoState = { attemptsLeft: MAX_AUTO_CAPTCHA_ATTEMPTS }

  let invalidCount = 0
  while (invalidCount < MAX_INVALID_CAPTCHA_ATTEMPTS) {
    await updateAccountStatus(port, account, 'Loading captcha...')

    let answer = await solveCaptchaAutomatically(account, proxyAgent, autoState)
    if (!answer) {
      answer = await requestCaptchaFromUser(port, account, proxyAgent, invalidCount > 0)
    }

    const { captcha, captchaToken, auto } = answer

    await updateAccountStatus(port, account, 'Sending login request...')
    const result = await loginFishBet88(account, { captcha, captchaToken }, proxyAgent)

    if (result.code === LOGIN_CODE_FISHBET88.CAPTCHA_INVALID) {
      // A wrong auto guess only burns the auto budget; the user's own attempts are capped separately.
      if (!auto) invalidCount++
      continue
    }

    port.postMessage({ type: 'CaptchaClosed', data: { accountId: account.id } })

    if (result.code === LOGIN_CODE_FISHBET88.SUCCESS) {
      return handleLoginSuccess(port, account, result.accessToken, result.account)
    }

    throw new Error(result.message)
  }

  throw new Error(`Captcha was rejected ${MAX_INVALID_CAPTCHA_ATTEMPTS} times`)
}

async function handleLoginSuccess(
  port: MessagePort,
  account: AccountType,
  accessToken: string,
  loginAccount: LoginAccount_FishBet88 | null
) {
  const accountWithToken = Account.update(
    { id: account.id },
    { token: accessToken, ...(loginAccount?.Id ? { parent_id: String(loginAccount.Id) } : {}) }
  ) as AccountType

  await updateAccountStatus(port, account, 'Login successful. Fetching account balance...')
  const { ErrorCode, Message, credit } = await getBalanceFishBet88(accountWithToken)

  if (ErrorCode != 0 || Number.isNaN(Number(credit))) {
    throw new Error(Message)
  }

  await finishLogin(port, account, credit, loginAccount)
}

async function finishLogin(
  port: MessagePort,
  account: AccountType,
  credit: string,
  loginAccount: LoginAccount_FishBet88 | null
) {
  const creditInfo: Record<string, string> = loginAccount
    ? {
        cashBalance: '0',
        outstanding: String(loginAccount.UsedCredit ?? 0),
        givenCredit: String(loginAccount.CreditLimit ?? credit),
        currency: loginAccount.Currency ?? ''
      }
    : {}

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
        ...creditInfo,
        credit,
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
  await flushLogQueue(account.platformName, account.loginID, 'Program')

  process.exit(0)
}
