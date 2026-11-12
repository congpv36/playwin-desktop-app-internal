/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-constant-condition */
import { setTimeout } from 'timers/promises'
import { parentPort } from 'worker_threads'

import { Account, Setting } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'
import { HttpsProxyAgent } from 'https-proxy-agent'

import { AccountType } from '@shared/common/types'
import { OPTIONS_PROXY, STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { isAccountActive_AccountOrder2 } from '@/worker/lib/checkAccount'
import { logAndNotify, logCrawlError } from '@/worker/lib/exitAccountWithLog'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { logTime } from '@/worker/lib/logTime'
import { systemLogToFile } from '@/worker/lib/systemLogToFile'
import { UserInfoResponse } from '@/worker/platform/3In1bet/common/types'
import { buildPlatformUrl_3In1Bet, isArError } from '@/worker/platform/3In1bet/helper'
import { PLATFORM } from '@/worker/platform/platform.config'

const port = parentPort
if (!port) throw new Error('IllegalState')

port.on('message', async (action: string) => {
  if (action === 'Start') {
    try {
      await handleCrawlData()
    } catch (error) {
      await systemLogToFile(
        `Error Handle Crawl Data Account Order2 3in1Bet: ${JSON.stringify(error)}`,
        'Error'
      )
    }
  }
})

const handleCrawlData = async () => {
  while (true) {
    const setting = Setting.findAll()[0] as SettingSchemaType
    if (setting.isBetByOtherAcc == 0) process.exit(0)

    const account = Account.findOne({
      platformName: PLATFORM['3IN1BET'],
      status: STATUS_ACCOUNT.LOGOUT,
      statusLogin: STATUS_LOGIN.SUCCESS,
      orderID: 2
    }) as AccountType

    if (!account) {
      await setTimeout(2000)
      continue
    }

    await fnCrawlData(account)
    await setTimeout(5000)
  }
}

const fnCrawlData = async (account: AccountType) => {
  const { status, data } = isProxyConfigValid(account)
  const { newIpAddress, newPort, newUsername, newPassword } = data

  const proxyUrl =
    status && account.proxyScope !== OPTIONS_PROXY.NONE
      ? `http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`
      : undefined

  const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

  try {
    const arRes = await fetch(buildPlatformUrl_3In1Bet(account, 'AR'), {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Origin: account.loginURL,
        Referer: account.loginURL + 'main/index.aspx',
        Cookie: account.cookie,
        ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
      },
      ...(proxyAgent && { agent: proxyAgent }),
      body: JSON.stringify({
        a: '',
        r: ''
      })
    })

    if (!arRes.ok) {
      throw new Error(`Request failed ${arRes.status}`)
    }
    const arResJson: unknown = await arRes.json()
    await accountLogToFile(
      account.platformName,
      account.loginID,
      `ArResJson: ${JSON.stringify(arResJson)}`,
      'Program'
    )

    if (isArError(arResJson) && arResJson.Au === 0) {
      throw new Error(`Your account has been log off due to multiple login.`)
    }

    const userInfoRes = await fetch(buildPlatformUrl_3In1Bet(account, 'USER_INFO_PANEL_HOST'), {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Origin: account.loginURL,
        Referer: account.loginURL + 'main/index.aspx',
        Cookie: account.cookie,
        ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
      },
      ...(proxyAgent && { agent: proxyAgent })
    })
    if (!userInfoRes.ok) {
      throw new Error(`Request failed ${userInfoRes.status}`)
    }

    const userInfoJson: unknown = await userInfoRes.json()
    const userInfo = userInfoJson as Partial<UserInfoResponse>

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `BetCredit: ${JSON.stringify(userInfo)}`,
      'Program'
    )

    if (!userInfo || !('BetCredit' in userInfo)) {
      throw new Error('Data userInfo is invalid or missing BetCredit property')
    }

    await logAndNotify(port, account, `${logTime()} Ready to bet`, {
      fields: {
        currency: userInfo.Currency || 'USD',
        cashBalance: String(userInfo.Balance ?? '0'),
        outstanding: String(userInfo.Outstanding ?? '0'),
        givenCredit: String(userInfo.GivenCredit ?? '0'),
        credit: String(userInfo.BetCredit ?? '0')
      },
      isActiveFn: isAccountActive_AccountOrder2
    })
  } catch (error) {
    await logCrawlError(port, account, error, 'Crawl Data Balance Order2 3in1Bet', {
      isActiveFn: isAccountActive_AccountOrder2
    })
  }
}
