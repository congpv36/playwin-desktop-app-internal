/* eslint-disable no-constant-condition */
import crypto from 'crypto'
import { setTimeout as delay } from 'timers/promises'
import { setTimeout } from 'timers/promises'
import { MessagePort, parentPort } from 'worker_threads'

import { Account, clearTable, Setting } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'
import { HttpsProxyAgent } from 'https-proxy-agent'
import WebSocket from 'ws'

import { GAME_TYPES } from '@shared/common/constants'
import { AccountType } from '@shared/common/types'
import { OPTIONS_PROXY, STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { isAccountActive } from '@/worker/lib/checkAccount'
import {
  logAndNotify,
  logAndTriggerRelogin,
  updateAccountAndNotify
} from '@/worker/lib/exitAccountWithLog'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { PLATFORM } from '@/worker/platform/platform.config'
import { getBalanceViva88bet } from '@/worker/platform/Viva88/actions/getBalance'
import { gameTypeMapViva88 } from '@/worker/platform/Viva88/common/constants'

let pingIntervalId: NodeJS.Timeout | null = null
const pingInterval = 8000
let ws: WebSocket
let gameType: string | null = null

const port = parentPort as MessagePort
if (!port) throw new Error('IllegalState')

port.on('message', (account: AccountType) => {
  startTimer(account)
  handleCrawlData(account)
})

const handleCrawlData = async (account: AccountType) => {
  while (true) {
    const settings = Setting.findAll() as SettingSchemaType[]
    if (!settings.length) {
      await setTimeout(1000)
      continue
    }

    gameType = settings[0].gameType
    if (!gameType || gameType == GAME_TYPES.NONE) {
      await setTimeout(1000)
      continue
    }

    const checkAccount = Account.findOne({
      id: account.id,
      status: STATUS_ACCOUNT.LOGOUT,
      statusLogin: STATUS_LOGIN.SUCCESS,
      orderID: 1
    }) as AccountType

    if (!checkAccount) process.exit(0)

    if (checkAccount.typeCrawl !== gameType) {
      await accountLogToFile(
        checkAccount.platformName,
        checkAccount.loginID,
        `GameType changed, refresh to sync.`,
        'Program'
      )

      await logAndNotify(port, checkAccount, 'GameType changed, check box refresh to sync.', {
        fields: { status: STATUS_ACCOUNT.EXIT }
      })
      clearTable(PLATFORM.VIVA88BET)
      continue
    }
    initializeWebSocket(checkAccount)
    return
  }
}

async function initializeWebSocket(account: AccountType) {
  if (ws) {
    ws.terminate()
    await setTimeout(2000)
  }

  const socketUrl = account.socketUrl
  const { searchParams } = new URL(socketUrl)
  const gid = searchParams.get('gid')
  const token = searchParams.get('token')
  const id = searchParams.get('id')
  const rid = searchParams.get('rid')

  const { status, data } = isProxyConfigValid(account)
  const { newIpAddress, newPort, newUsername, newPassword } = data

  const proxyUrl =
    status && account.proxyScope !== OPTIONS_PROXY.NONE
      ? `http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`
      : undefined
  const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

  ws = new WebSocket(socketUrl, {
    ...(proxyAgent && { agent: proxyAgent }),
    headers: {
      Host: 'agnj3.viva88.net',
      Connection: 'Upgrade',
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      Upgrade: 'websocket',
      Origin: 'https://d.viva88.net',
      'Sec-WebSocket-Version': 13,
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8,vi;q=0.7',
      'Sec-WebSocket-Key': `${crypto.randomBytes(16).toString('base64')}`,
      'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits'
    }
  })

  ws.on('open', () => {
    if (pingIntervalId) {
      clearInterval(pingIntervalId)
    }
    pingIntervalId = setInterval(() => {
      sendPing(account)
      port?.postMessage({
        type: 'CrawlDone',
        platformName: PLATFORM.VIVA88BET
      })
    }, 6000)

    const init =
      42 +
      JSON.stringify([
        'init',
        {
          gid,
          token,
          id,
          rid,
          v: 2
        }
      ])

    ws.send(init)

    const marketid: string = gameTypeMapViva88[account.typeCrawl] //(E-early;T-today;L-live)
    const sub =
      42 +
      JSON.stringify([
        'subscribe',
        [
          [
            'odds',
            [
              {
                id: 'c3',
                rev: null,
                sorting: 't',
                condition: {
                  sporttype: 1,
                  marketid,
                  no_stream: true,
                  bettype: [1, 3, 7, 8]
                }
              }
            ]
          ]
        ]
      ])

    ws.send(sub)
  })

  ws.on('message', async (message) => {
    if (!isAccountActive(account.id)) {
      ws?.close()
      process.exit(0)
    }

    const data = message.toString()

    let dataLength = 0

    const dataAccount = Account.findOne({
      id: account.id,
      status: STATUS_ACCOUNT.LOGOUT,
      statusLogin: STATUS_LOGIN.SUCCESS,
      orderID: 1
    }) as AccountType
    if (!dataAccount) {
      ws?.close()
      process.exit(0)
    }

    if (data.startsWith('42')) {
      if (data.includes('disconnectReason')) {
        await logAndTriggerRelogin(port, account, `[ERROR] Disconnect Reason. (${data})`)
        ws?.close()
        process.exit(0)
      }
      if (data.includes('42["err","A002"]')) {
        await logAndTriggerRelogin(port, account, `[ERROR] Failed to connect to Socket.(${data})`)
        ws?.close()
        process.exit(0)
      }

      const [type, message, content] = JSON.parse(data.substring(2))
      if (type === 'm' && message && content) {
        dataLength = content.length
      }
      await logAndNotify(port, account, `Data Received: ${dataLength} / Soccer ${gameType}`, {
        fields: { status: STATUS_ACCOUNT.LOGOUT, statusLogin: STATUS_LOGIN.SUCCESS }
      })
      const settingInfo = Setting.findAll() as SettingSchemaType[]
      if (settingInfo[0].gameType === gameType) {
        isAccountActive(account.id) &&
          port.postMessage({
            type: 'DataViva88',
            data
          }) &&
          port.postMessage({
            type: 'CrawlDone',
            platformName: PLATFORM.VIVA88BET
          })
      }
    }
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })

  ws.on('close', async () => {
    const checkAccount = Account.findOne({
      id: account.id,
      status: STATUS_ACCOUNT.LOGOUT,
      statusLogin: STATUS_LOGIN.SUCCESS,
      orderID: 1
    }) as AccountType

    if (!checkAccount) process.exit(0)

    await accountLogToFile(
      checkAccount.platformName,
      checkAccount.loginID,
      `WebSocket connection closed. WebSocket.CLOSED [${gameType}]`,
      'Program'
    )

    if (pingInterval) {
      clearInterval(pingInterval)
      pingIntervalId = null
    }
    await setTimeout(2000)
    handleCrawlData(checkAccount)
    return
  })
}

async function sendPing(account: AccountType) {
  const { ErrorCode, Message, credit, cashBalance, outstanding, givenCredit, currency } =
    await getBalanceViva88bet(account)

  if (ErrorCode !== 0) {
    const dataAccount = Account.findOne({
      id: account.id,
      status: STATUS_ACCOUNT.LOGOUT,
      statusLogin: STATUS_LOGIN.SUCCESS,
      orderID: 1
    }) as AccountType
    if (!dataAccount) {
      ws.close()
      process.exit(0)
    }

    await logAndTriggerRelogin(port, account, `Get balance failed: ${Message}`)
    ws.close()
    process.exit(0)
  }

  const checkAccount = Account.findOne({
    id: account.id,
    status: STATUS_ACCOUNT.LOGOUT,
    statusLogin: STATUS_LOGIN.SUCCESS,
    orderID: 1
  }) as AccountType

  if (!checkAccount) {
    ws.close()
    process.exit(0)
  }

  const settingInfo = Setting.findAll() as SettingSchemaType[]
  if (gameType !== settingInfo[0].gameType || checkAccount.typeCrawl !== gameType) {
    await logAndNotify(port, checkAccount, 'GameType changed during crawl, stop processing.')

    if (pingIntervalId) {
      clearInterval(pingIntervalId)
    }
    clearTable(PLATFORM.VIVA88BET)
    ws.close()

    return
  }

  updateAccountAndNotify(port, account.id, {
    credit,
    cashBalance,
    outstanding,
    givenCredit,
    currency
  })

  if (ws.readyState === WebSocket.OPEN) {
    ws.send('2')
  }
}

async function startTimer(account: AccountType) {
  const min = 2 * 60 // 120 phút
  const max = 3 * 60 // 180 phút

  // random integer từ 120 đến 180 (bao gồm cả 180)
  const randomMinutes = Math.floor(Math.random() * (max - min + 1)) + min
  const ms = randomMinutes * 60 * 1000

  console.log(`Timer started, se log sau ${randomMinutes} minute`)
  await delay(ms)

  await logAndTriggerRelogin(port, account, 'Session timer expired, forcing re-login.')
  process.exit(0)
}
