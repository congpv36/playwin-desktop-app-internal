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
import { PLATFORM } from '@/worker/platform/platform.config'
import {
  buildBodyBalance,
  buildPlatformUrl_WBet,
  fetchJsonWithDecompress
} from '@/worker/platform/Wbet/helper'

const port = parentPort
if (!port) throw new Error('IllegalState')

port.on('message', async (action: string) => {
  if (action === 'Start') {
    try {
      await handleCrawlData()
    } catch (error) {
      await systemLogToFile(
        `Error Handle Crawl Account Order2 Data WBet: ${JSON.stringify(error)}`,
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
      platformName: PLATFORM.WBET,
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
    const dataBalance = await fetchJsonWithDecompress(
      buildPlatformUrl_WBet(account, 'BALANCE'),
      account,
      {
        method: 'POST',
        body: JSON.stringify(buildBodyBalance(account)),
        ...(proxyAgent && { agent: proxyAgent })
      }
    )
    await accountLogToFile(
      account.platformName,
      account.loginID,
      `ResdataBalance:  ${JSON.stringify(dataBalance)}`,
      'Program'
    )
    if (!dataBalance || dataBalance.status == -500) {
      throw new Error(`Error fetching balance: ${dataBalance.statusdesc || 'Unknown error'}`)
    }

    await logAndNotify(port, account, `${logTime()} Ready to bet`, {
      fields: {
        credit: String(dataBalance.balance) || 0,
        cashBalance: String(dataBalance.account_balance) || 0,
        outstanding: String(dataBalance.outstanding_balance) || 0,
        givenCredit:
          String(Math.round(dataBalance.balance + Math.abs(dataBalance.account_balance))) || 0,
        currency: 'USD'
      },
      isActiveFn: isAccountActive_AccountOrder2
    })
  } catch (error) {
    await logCrawlError(port, account, error, 'Crawl Data Balance Order2 WBet', {
      isActiveFn: isAccountActive_AccountOrder2
    })
  }
}
