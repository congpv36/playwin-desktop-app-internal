/* eslint-disable no-constant-condition */
import { setTimeout } from 'timers/promises'
import { parentPort } from 'worker_threads'

import { Account, clearTable, createModel, Setting } from '@db/model'
import dataCrawlByPlatformSchema from '@db/schema/dataCrawlByPlatform'
import { SettingSchemaType } from '@db/schema/setting'
import { HttpsProxyAgent } from 'https-proxy-agent'

import { GAME_TYPES } from '@shared/common/constants'
import { AccountType } from '@shared/common/types'
import { OPTIONS_PROXY, STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { isAccountActive } from '@/worker/lib/checkAccount'
import { logAndNotify, logCrawlError } from '@/worker/lib/exitAccountWithLog'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { systemLogToFile } from '@/worker/lib/systemLogToFile'
import { PLATFORM } from '@/worker/platform/platform.config'
import { KEY_UX_MATCH_ODDS, PARAM_UX_MATCH } from '@/worker/platform/Wbet/common/constants'
import {
  buildBodyBalance,
  buildBodyMarket,
  buildBodyMatch,
  buildPlatformUrl_WBet,
  fetchJsonWithDecompress,
  handleDataOdds_HDP,
  handleDataOdds_OU
} from '@/worker/platform/Wbet/helper'

let gameType: string | null = null

const port = parentPort
if (!port) throw new Error('IllegalState')

port.on('message', async (action: string) => {
  if (action === 'Start') {
    try {
      await handleCrawlData()
    } catch (error) {
      await systemLogToFile(`Error Handle Crawl Data WBet: ${JSON.stringify(error)}`, 'Error')
    }
  }
})

const handleCrawlData = async () => {
  while (true) {
    clearTable(PLATFORM.WBET)

    const account = Account.findOne({
      platformName: PLATFORM.WBET,
      status: STATUS_ACCOUNT.LOGOUT,
      statusLogin: STATUS_LOGIN.SUCCESS,
      orderID: 1
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
  const settings = Setting.findAll() as SettingSchemaType[]
  if (!settings.length) return

  gameType = settings[0].gameType
  if (!gameType || gameType === GAME_TYPES.NONE) return

  const accountInfo = Account.findOne({
    id: account.id,
    orderID: 1,
    status: STATUS_ACCOUNT.LOGOUT,
    statusLogin: STATUS_LOGIN.SUCCESS
  }) as AccountType
  if (!accountInfo) return

  if (accountInfo.typeCrawl !== gameType) {
    await logAndNotify(port, account, 'GameType changed, check box refresh to sync.', {
      fields: { status: STATUS_ACCOUNT.EXIT }
    })

    clearTable(PLATFORM.WBET)
    return
  }

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

    const credit = String(dataBalance.balance) || 0
    const currency = 'USD'
    await logAndNotify(port, account, `Balance updated: ${credit} ${currency}`, {
      fields: {
        credit,
        cashBalance: String(dataBalance.account_balance) || 0,
        outstanding: String(dataBalance.outstanding_balance) || 0,
        givenCredit:
          String(Math.round(dataBalance.balance + Math.abs(dataBalance.account_balance))) || 0,
        currency
      }
    })

    const dataMarket = await fetchJsonWithDecompress(
      buildPlatformUrl_WBet(account, 'UX_MARKET'),
      account,
      {
        method: 'POST',
        body: JSON.stringify(buildBodyMarket(gameType, account)),
        ...(proxyAgent && { agent: proxyAgent })
      }
    )

    await handleData({ dataMarket, account, proxyAgent })
  } catch (error) {
    await logCrawlError(port, account, error, 'Crawl Data WBet', {
      clearTablePlatform: PLATFORM.WBET
    })
  }
}

const handleData = async ({ dataMarket, account, proxyAgent }) => {
  clearTable(PLATFORM.WBET)
  if (!gameType || gameType === GAME_TYPES.NONE) return
  const WBet = createModel(PLATFORM.WBET, dataCrawlByPlatformSchema)

  if (
    !(await logAndNotify(port, account, `Get Soccer ${gameType}...`, {
      strictMatch: { orderID: 1, platformName: PLATFORM.WBET }
    }))
  )
    return

  const leagues = dataMarket.data[0]
  const matchs = dataMarket.data[1]

  if (leagues.length === 0 || matchs.length === 0) {
    await logAndNotify(port, account, `Soccer ${gameType}: No data.`, {
      strictMatch: { orderID: 1, platformName: PLATFORM.WBET }
    })

    port.postMessage({
      type: 'CrawlDone',
      platformName: PLATFORM.WBET
    })
    return
  }

  const eventsLength = matchs.length
  const timeStart = new Date().getTime()

  const payload = buildBodyMatch(gameType, account, matchs)
  try {
    const res_UX_MATCH = await fetchJsonWithDecompress(
      `${buildPlatformUrl_WBet(account, 'UX_MATCH')}?match=${PARAM_UX_MATCH[gameType]}`,
      account,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        ...(proxyAgent && { agent: proxyAgent })
      }
    )
    const data = res_UX_MATCH.data

    const dataOdds = data[0][Object.keys(data[0])[0]]
    if (!dataOdds) {
      await accountLogToFile(
        account.platformName,
        account.loginID,
        `No ${gameType} data found for any active account.`,
        'Program'
      )

      if (isAccountActive(account.id)) {
        Account.updateMany(
          {
            platformName: PLATFORM.WBET,
            status: STATUS_ACCOUNT.LOGOUT,
            statusDelete: 0,
            statusLogin: STATUS_LOGIN.SUCCESS
          },
          {
            textLog: `No ${gameType} data found for any active account.`
          }
        )
        port.postMessage({ type: 'LogHandleDataWbet' })
      } else return

      return
    }

    const dataOdds_HDP = dataOdds[KEY_UX_MATCH_ODDS.HDP]
    const dataOdds_OU = dataOdds[KEY_UX_MATCH_ODDS.OU]

    await Promise.all([
      handleDataOdds_HDP(dataOdds_HDP, leagues, matchs, gameType, WBet, port, account),
      handleDataOdds_OU(dataOdds_OU, leagues, matchs, gameType, WBet, port, account)
    ])

    port.postMessage({
      type: 'CrawlDone',
      platformName: PLATFORM.WBET
    })
    const timeEnd = new Date().getTime()
    await logAndNotify(
      port,
      account,
      `Handle Data Event Done All. (${eventsLength}, ${timeEnd - timeStart}ms)`,
      { strictMatch: { orderID: 1, platformName: PLATFORM.WBET } }
    )
  } catch (error) {
    throw new Error(
      `Error fetching odds: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
