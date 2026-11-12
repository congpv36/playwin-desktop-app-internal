import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'

import { AccountType } from '@shared/common/types'
import { OPTIONS_PROXY } from '@shared/main/constants'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { buildHeadersCheckPlayer } from '@/worker/platform/DafaBet/common/contants'
import { CheckPlayerResponse_DafaBet } from '@/worker/platform/DafaBet/common/types'
import { buildCheckPlayerUrl, getCookieValue } from '@/worker/platform/DafaBet/helper'

export const checkPlayerDafaBet = async (account: AccountType) => {
  const { status, data } = isProxyConfigValid(account)
  const { newIpAddress, newPort, newUsername, newPassword } = data
  const proxyAgent =
    status && account.proxyScope !== OPTIONS_PROXY.NONE
      ? new HttpsProxyAgent(`http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`)
      : undefined

  try {
    const token = getCookieValue(account.cookie, 'extToken')
    if (!token) throw new Error('DafaBet extToken not found in cookie')

    const res = await fetch(buildCheckPlayerUrl(), {
      method: 'GET',
      headers: {
        ...buildHeadersCheckPlayer(account, token),
        Cookie: account.cookie
      },
      ...(proxyAgent && { agent: proxyAgent })
    })

    const resData = (await res.json()) as CheckPlayerResponse_DafaBet

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Response CheckPlayer: ${JSON.stringify(resData)}`,
      'Program'
    )

    if (!resData?.alsPlayerId) {
      return {
        ErrorCode: 107,
        Message: 'DafaBet checkplayer: alsPlayerId not found',
        alsPlayerId: ''
      }
    }

    return { ErrorCode: 0, Message: 'OK', alsPlayerId: String(resData.alsPlayerId) }
  } catch (error) {
    console.error('Error fetching checkplayer DafaBet:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unstable network, proxy or server-side issue.'

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Error checkPlayer DafaBet: ${errorMessage}`,
      'Program'
    )

    return { ErrorCode: -1, Message: `Error Res CheckPlayer: ${errorMessage}`, alsPlayerId: '' }
  }
}
