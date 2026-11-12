import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'

import { AccountType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { AccountBalanceResponse } from '@/worker/platform/Sbobet/common/types'
import { buildHeaders } from '@/worker/platform/Sbobet/helper'

export async function getBalanceSbobet(account: AccountType) {
  const { status, data } = isProxyConfigValid(account)

  const proxyUrl =
    status && account.proxyScope !== 'None'
      ? `http://${data.newUsername}:${data.newPassword}@${data.newIpAddress}:${data.newPort}`
      : undefined

  const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

  try {
    const response = await fetch('https://api-home.sbobet.com/api/AccountBalance/Get', {
      headers: buildHeaders(account, { Host: 'api-home.sbobet.com' }),
      ...(proxyAgent && { agent: proxyAgent })
    })

    const responseText = await response.text()

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Response AccountBalance: ${responseText}`,
      'Program'
    )

    if (responseText == '') {
      return {
        ErrorCode: 106,
        Message: 'Another session logged in. Forced to logout.',
        credit: '',
        cashBalance: '',
        outstanding: '',
        givenCredit: '',
        currency: null
      }
    }

    const accountBalance = JSON.parse(responseText) as AccountBalanceResponse

    const credit = accountBalance?.generalBalance?.betCredit
    const cashBalance = accountBalance?.generalBalance?.cashBalance
    const outstanding = accountBalance?.generalBalance?.outstanding
    const givenCredit = accountBalance?.generalBalance?.givenCredit

    if (credit == null || cashBalance == null || outstanding == null || givenCredit == null) {
      throw new Error('Unable to fetch AccountBalance: One or more balance fields are null')
    }

    return {
      ErrorCode: 0,
      Message: 'OK',
      credit,
      cashBalance,
      outstanding,
      givenCredit,
      currency: 'HKD'
    }
  } catch (error) {
    console.error('Error fetching account-balance Sbobet:', error)

    if (
      error instanceof Error &&
      error.message.includes(
        'Client network socket disconnected before secure TLS connection was established'
      )
    ) {
      return {
        ErrorCode: -2,
        Message: 'Error: TLS connection could not be established (proxy/network issue)',
        credit: '',
        cashBalance: '',
        outstanding: '',
        givenCredit: '',
        currency: null
      }
    }

    return {
      ErrorCode: -1,
      Message: `Error Res Balance: ${
        error instanceof Error ? error.message : 'Unstable network, proxy or server-side issue.'
      }`,
      credit: '',
      cashBalance: '',
      outstanding: '',
      givenCredit: '',
      currency: null
    }
  }
}
