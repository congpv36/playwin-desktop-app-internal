import fetch from 'node-fetch'

import { AccountType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { buildHeadersBalancePs3838 } from '@/worker/platform/Ps3838/common/contants'
import {
  buildPlatformUrl,
  buildProxyAgent,
  buildTokenHeaders,
  DEBUG_X_APP_DATA,
  parseTokens,
  withDebugCookie
} from '@/worker/platform/Ps3838/helper'

export const getBalancePs3838 = async (account: AccountType) => {
  const { cookie, vHucode, token } = account

  const tokens = parseTokens(token)
  const { proxyAgent } = buildProxyAgent(account)

  try {
    const res = await fetch(buildPlatformUrl(account, 'BALANCE'), {
      method: 'POST',
      headers: {
        ...buildHeadersBalancePs3838(account, vHucode),
        ...buildTokenHeaders(tokens),
        'x-app-data': DEBUG_X_APP_DATA,
        Cookie: withDebugCookie(cookie),
        ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
      },
      body: '',
      ...(proxyAgent && { agent: proxyAgent })
    })

    const resText = await res.text()
    let resData: Record<string, unknown>
    try {
      resData = JSON.parse(resText)
    } catch {
      await accountLogToFile(
        account.platformName,
        account.loginID,
        `Invalid JSON response AccountBalance (status ${res.status}): ${resText.slice(0, 2000)}`,
        'Program'
      )
      throw new Error(`Invalid JSON response, status ${res.status}: ${resText.slice(0, 300)}`)
    }

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Response AccountBalance: ${JSON.stringify(resData)}`,
      'Program'
    )

    if (resData.error === 'MULTIPLE_LOGIN') {
      return {
        ErrorCode: 106,
        Message: 'Another session logged in. Forced to logout.',
        cashBalance: '',
        outstanding: '',
        givenCredit: '',
        credit: '',
        currency: ''
      }
    }

    if (!('betCredit' in resData)) {
      return {
        ErrorCode: 107,
        Message: 'EXCEPTION in DoSpiderTask: Account has been logged out.',
        cashBalance: '',
        outstanding: '',
        givenCredit: '',
        credit: '',
        currency: ''
      }
    }

    return {
      ErrorCode: 0,
      Message: 'OK',
      cashBalance: String(resData.cashBalance),
      outstanding: String(resData.outstanding),
      givenCredit: String(
        Math.abs(Number(resData.cashBalance)) +
          Number(resData.betCredit) +
          Number(resData.outstanding)
      ),
      credit: String(resData.betCredit),
      currency: String(resData.currency)
    }
  } catch (error) {
    console.error('Error fetching account-balance Ps3838:', error)

    if (
      error instanceof Error &&
      error.message.includes(
        'Client network socket disconnected before secure TLS connection was established'
      )
    ) {
      return {
        ErrorCode: -2,
        Message: `Error: Client network socket disconnected before secure TLS connection was established`,
        cashBalance: '',
        outstanding: '',
        givenCredit: '',
        credit: '',
        currency: ''
      }
    }

    return {
      ErrorCode: -1,
      Message: `Error Res Balance: ${
        error instanceof Error ? error.message : 'Unstable network, proxy or server-side issue.'
      }`,
      cashBalance: '',
      outstanding: '',
      givenCredit: '',
      credit: '',
      currency: ''
    }
  }
}
