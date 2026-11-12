import { MessagePort } from 'worker_threads'

import { Account } from '@db/model'

import { AccountType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'

export function getXsrfToken(cookieString) {
  const match = cookieString.match(/XSRF-TOKEN=([^;]+)/)
  return match ? match[1] : null
}

export async function handleLoginFail(port: MessagePort, account: AccountType, textLog: string) {
  port?.postMessage({
    type: 'DataUpdateAccount',
    data: Account.update(
      { id: account.id },
      {
        status: 'Exit',
        statusLogin: 'Fail',
        textLog
      }
    )
  })

  await accountLogToFile(
    account.platformName,
    account.loginID,
    `Error: Access failed ${account.loginID}: ${textLog}`,
    'Program'
  )
}

export function buildHeaders(
  account: AccountType,
  overrides: Record<string, string> = {}
): Record<string, string> {
  const base = {
    Referer: account.loginURL,
    'Accept-Language':
      'en-US,en;q=0.9,th;q=0.8,zh-CN;q=0.7,zh;q=0.6,ja;q=0.5,cs;q=0.4,zh-TW;q=0.3,ms;q=0.2',
    'Accept-Encoding': 'gzip, deflate, br',
    Origin: account.loginURL,
    'sec-ch-ua': '"Google Chrome";v="135.0", "Chromium";v="135.0", "Not.A/Brand";v="35"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0',
    Connection: 'keep-alive',
    Cookie: account.cookie,
    ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
  }
  return { ...base, ...overrides }
}

export function getMatchMinute(periodStartTimeStr: string, period?: number): string {
  const periodStart = new Date(periodStartTimeStr)
  if (period === 5) {
    return `HT`
  }

  if (!period) {
    return ``
  }
  const nowUtc = new Date()

  const elapsedMs = nowUtc.getTime() - periodStart.getTime()

  if (elapsedMs < 0) return 'Trận chưa bắt đầu'

  const totalMinutes = Math.floor(elapsedMs / 60000)

  const minutes = totalMinutes % 60

  return `${period}H ${minutes}'`
}

export function getDataPreset(gameType: string) {
  const map = {
    Early: { presetFilter: 'NonLive', date: 'EarlyMarket' },
    Running: { presetFilter: 'Live', date: 'All' },
    Today: { presetFilter: 'NonLive', date: 'Today' }
  }

  return map[gameType] || {}
}

export async function parseGraphQLResponse(response, queryType: string) {
  const data = await response.json()

  if (data.errors?.some((e) => e.extensions?.code === 'PERSISTED_QUERY_NOT_FOUND')) {
    return {
      error: Object.assign(new Error('PersistedQueryNotFound'), {
        type: 'PERSISTED_QUERY_NOT_FOUND',
        queryType
      })
    }
  }

  return data
}

export async function checkCloudflare(res, account) {
  const contentType = res.headers.get('content-type')
  if (contentType && !contentType.includes('application/json')) {
    await accountLogToFile(account.platformName, account.loginID, `${await res.text()}`, 'Program')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err: any = new Error(
      'This IP has been blocked by Cloudflare. Please use a proxy, VPN, or try again later.'
    )
    err.code = 'CF_BLOCKED'
    throw err
  }
}
