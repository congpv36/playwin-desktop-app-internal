import fetch from 'node-fetch'

import { AccountType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { buildHeadersApi } from '@/worker/platform/FishBet88/common/constants'
import { ApiResponse_FishBet88 } from '@/worker/platform/FishBet88/common/types'
import { buildApiUrl, buildProxyAgent } from '@/worker/platform/FishBet88/helper'

/** Uses `account.token` (the AccessToken saved at login) as the Bearer token. */
export const getBalanceFishBet88 = async (account: AccountType) => {
  const proxyAgent = buildProxyAgent(account)

  try {
    const res = await fetch(buildApiUrl('BALANCE'), {
      method: 'GET',
      headers: buildHeadersApi(account, account.token),
      ...(proxyAgent && { agent: proxyAgent })
    })

    const raw = await res.text()
    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Response GetBalance: Status ${res.status}, AuthenticationStatus ${res.headers.get(
        'authenticationstatus'
      )}, ${raw}`,
      'Program'
    )

    let data: ApiResponse_FishBet88<number> | null = null
    try {
      data = JSON.parse(raw)
    } catch {
      data = null
    }

    if (res.status === 401 || !data?.Success || Number.isNaN(Number(data.Result))) {
      return {
        ErrorCode: 107,
        Message: 'EXCEPTION in DoSpiderTask: Account has been logged out.',
        credit: ''
      }
    }

    return { ErrorCode: 0, Message: 'OK', credit: String(data.Result) }
  } catch (error) {
    console.error('Error fetching GetBalance FishBet88:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unstable network, proxy or server-side issue.'

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Error getBalance FishBet88: ${errorMessage}`,
      'Program'
    )

    return { ErrorCode: -1, Message: `Error Res Balance: ${errorMessage}`, credit: '' }
  }
}
