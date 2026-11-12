import { HttpsProxyAgent } from 'https-proxy-agent'

import { AccountType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { LoginCheckinIndex } from '@/worker/platform/Viva88/common/types'
import { configHeaders } from '@/worker/platform/Viva88/helper'

export async function loginCheckin_Viva88Bet(accountInfo: AccountType) {
  try {
    const { proxyIP, proxyPort, proxyUsername, proxyPassword, proxyScope } = accountInfo
    const proxyUrl =
      proxyScope !== 'None' && proxyIP && proxyPort && proxyUsername && proxyPassword
        ? `http://${proxyUsername}:${proxyPassword}@${proxyIP}:${proxyPort}`
        : undefined

    const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined
    const urlLoginCheckin = `${accountInfo.host || 'https://d.viva88.net'}/LoginCheckin/Index`
    const resLoginCheckin = await fetch(urlLoginCheckin, {
      method: 'POST',
      headers: configHeaders(accountInfo),
      ...(proxyAgent && { agent: proxyAgent })
    })

    const dataLoginCheckInIndex: LoginCheckinIndex =
      (await resLoginCheckin.json()) as LoginCheckinIndex
    if (dataLoginCheckInIndex.ErrorCode !== 0) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `Get LoginCheckin/Index Fail:${JSON.stringify(dataLoginCheckInIndex)}`,
        'BetList'
      )
      return {
        ErrorCode: 1,
        Data: 'Error: Get LoginCheckin Fail'
      }
    }

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Response LoginCheckin/Index: ${JSON.stringify(dataLoginCheckInIndex)}`,
      'BetList'
    )

    return {
      ErrorCode: 0,
      Data: dataLoginCheckInIndex.Data.at
    }
  } catch (error) {
    console.log(
      'Fetch Viva88 LoginCheckinIndex Fail:',
      error instanceof Error ? error.message : String(error)
    )
    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `LoginCheckin/Index: ${error instanceof Error ? error.message : String(error)}`,
      'BetList'
    )

    return {
      ErrorCode: 1,
      Data: `Error: Get LoginCheckin Fail ${error instanceof Error ? error.message : 'Unknown Error'}`
    }
  }
}
