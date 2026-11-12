import { HttpsProxyAgent } from 'https-proxy-agent'

import { AccountType } from '@shared/common/types'
import { OPTIONS_PROXY } from '@shared/main/constants'

import { BalanceResponse } from '../common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { fetchWithTimeout } from '@/worker/lib/fetchWithTimeout'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { API_ENDPOINTS, buildHeaders1XBet } from '@/worker/platform/1XBet/common/constant'

export const getBalance1XBet = async (account: AccountType) => {
  const { status, data } = isProxyConfigValid(account)
  const { newIpAddress, newPort, newUsername, newPassword } = data

  const proxyUrl =
    status && account.proxyScope !== OPTIONS_PROXY.NONE
      ? `http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`
      : undefined

  const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

  try {
    const res = await fetchWithTimeout(API_ENDPOINTS.BALANCE, {
      method: 'GET',
      headers: buildHeaders1XBet(account),
      ...(proxyAgent && { agent: proxyAgent })
    })

    const resData = (await res.json()) as BalanceResponse

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Response AccountBalance: ${JSON.stringify(resData)}`,
      'Program'
    )

    const mainBalance = resData?.balance?.[0]

    if (!mainBalance) {
      return {
        ErrorCode: -1,
        Message: `Balance data not found: ${JSON.stringify(resData)}`,
        cashBalance: '',
        outstanding: '',
        givenCredit: '',
        credit: '',
        currency: null
      }
    }

    return {
      ErrorCode: 0,
      Message: 'OK',
      cashBalance: '',
      outstanding: String(mainBalance.summ_unplaced_bets),
      givenCredit: '',
      credit: String(mainBalance.money),
      currency: String(mainBalance.kode)
    }
  } catch (error) {
    console.error('Error fetching account-balance 1XBet:', error)

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Error Res Balance: ${error instanceof Error ? error.message : String(error)}`,
      'Program'
    )

    if (
      error instanceof Error &&
      error.message.includes(
        'Client network socket disconnected before secure TLS connection was established'
      )
    ) {
      return {
        ErrorCode: -2,
        Message:
          'Error: Client network socket disconnected before secure TLS connection was established',
        cashBalance: '',
        outstanding: '',
        givenCredit: '',
        credit: '',
        currency: null
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
      currency: null
    }
  }
}
