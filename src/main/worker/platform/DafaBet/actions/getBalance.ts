import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'

import { AccountType } from '@shared/common/types'
import { OPTIONS_PROXY } from '@shared/main/constants'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { buildHeadersBalance } from '@/worker/platform/DafaBet/common/contants'
import { BalanceResponse_DafaBet } from '@/worker/platform/DafaBet/common/types'
import { buildPlatformUrl } from '@/worker/platform/DafaBet/helper'

const DAFA_SPORTS_LABEL = 'Dafa Sports'

export const getBalanceDafaBet = async (account: AccountType) => {
  const { status, data } = isProxyConfigValid(account)
  const { newIpAddress, newPort, newUsername, newPassword } = data

  const proxyUrl =
    status && account.proxyScope !== OPTIONS_PROXY.NONE
      ? `http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`
      : undefined

  const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

  try {
    const res = await fetch(buildPlatformUrl(account, 'BALANCE'), {
      method: 'GET',
      headers: {
        ...buildHeadersBalance(account),
        Cookie: account.cookie
      },
      ...(proxyAgent && { agent: proxyAgent })
    })

    const resData = (await res.json()) as BalanceResponse_DafaBet

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Response AccountBalance: ${JSON.stringify(resData)}`,
      'Program'
    )

    const dafaSports = resData?.breakdown?.find((item) => item.label === DAFA_SPORTS_LABEL)

    if (!dafaSports) {
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
      cashBalance: '0',
      outstanding: '0',
      givenCredit: '0',
      credit: String(dafaSports.total ?? '0').replace(/,/g, ''),
      currency: 'VND'
    }
  } catch (error) {
    console.error('Error fetching account-balance DafaBet:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unstable network, proxy or server-side issue.'

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Error getBalance DafaBet: ${errorMessage}`,
      'Program'
    )

    return {
      ErrorCode: -1,
      Message: `Error Res Balance: ${errorMessage}`,
      cashBalance: '',
      outstanding: '',
      givenCredit: '',
      credit: '',
      currency: ''
    }
  }
}
