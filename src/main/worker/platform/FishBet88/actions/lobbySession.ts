import fetch from 'node-fetch'

import { AccountType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import {
  buildHeadersApi,
  buildHeadersLobby,
  LOBBY_ORIGIN_FISHBET88,
  LOBBY_TS_OFFSET_SECONDS_FISHBET88,
  OPEN_GAME_HOST_FISHBET88
} from '@/worker/platform/FishBet88/common/constants'
import { LobbySession_FishBet88 } from '@/worker/platform/FishBet88/common/types'
import { ProxyAgent_FishBet88 } from '@/worker/platform/FishBet88/helper'

const REQUEST_TIMEOUT_MS = 15_000

/**
 * Vendor of the lobby.sspv2.com sportsbook: `BF` ("BF Sport", theme betfred) — confirmed by log.
 * `SSport` opens another lobby (lobbybt.sspv2.com) and is only kept as a fallback.
 */
const LOBBY_VENDORS_FISHBET88 = ['BF', 'SSport']
let lobbyVendorFishBet88: string | null = null

/** Body of `POST /api/play/login`, same as the site's gameplay page (gameplay chunk -> loginData). */
const buildPlayLoginPayload = (vendor: string) => ({
  vendor,
  SeatId: '',
  GameCode: '',
  GamePlat: '',
  browser: 'chrome',
  device: 'unknown',
  os: 'windows',
  url: '',
  Lang: 'en-us'
})

/** One lobby session per account, reused until the AccessToken changes or the lobby logs us out. */
const sessionCache = new Map<string, { accessToken: string; session: LobbySession_FishBet88 }>()

export const invalidateLobbySessionFishBet88 = (account: AccountType) => {
  sessionCache.delete(account.id)
}

const logBet = (account: AccountType, message: string) =>
  accountLogToFile(account.platformName, account.loginID, message, 'BetList')

/** The lobby URL can come back as a plain string or inside an object, depending on the vendor. */
const findLobbyUrl = (value: unknown): string | null => {
  if (typeof value === 'string')
    return value.includes(new URL(LOBBY_ORIGIN_FISHBET88).host) ? value : null
  if (!value || typeof value !== 'object') return null

  for (const item of Object.values(value as Record<string, unknown>)) {
    const url = findLobbyUrl(item)
    if (url) return url
  }
  return null
}

const playLogin = async (
  account: AccountType,
  vendor: string,
  proxyAgent: ProxyAgent_FishBet88
) => {
  const res = await fetch(`${OPEN_GAME_HOST_FISHBET88}/api/play/login`, {
    method: 'POST',
    headers: buildHeadersApi(account, account.token),
    body: JSON.stringify(buildPlayLoginPayload(vendor)),
    timeout: REQUEST_TIMEOUT_MS,
    ...(proxyAgent && { agent: proxyAgent })
  })

  const raw = await res.text()
  await logBet(
    account,
    `Response PlayLogin [${vendor}]: Status ${res.status}, ${raw.slice(0, 1000)}`
  )

  let data: unknown = raw
  try {
    data = JSON.parse(raw)
  } catch {
    // keep raw text
  }

  return findLobbyUrl(data)
}

const getLobbyUrl = async (account: AccountType, proxyAgent: ProxyAgent_FishBet88) => {
  const vendors = lobbyVendorFishBet88
    ? [lobbyVendorFishBet88, ...LOBBY_VENDORS_FISHBET88.filter((v) => v !== lobbyVendorFishBet88)]
    : LOBBY_VENDORS_FISHBET88

  for (const vendor of vendors) {
    const lobbyUrl = await playLogin(account, vendor, proxyAgent)
    if (lobbyUrl) {
      lobbyVendorFishBet88 = vendor
      return lobbyUrl
    }
  }

  throw new Error(`Lobby URL not found (play/login vendors: ${vendors.join(', ')})`)
}

const mergeCookies = (current: string, setCookies: string[]) => {
  const jar = new Map<string, string>()
  for (const pair of current.split(';')) {
    const [name, ...rest] = pair.trim().split('=')
    if (name) jar.set(name, rest.join('='))
  }
  for (const setCookie of setCookies) {
    const [pair] = setCookie.split(';')
    const [name, ...rest] = pair.trim().split('=')
    if (name) jar.set(name, rest.join('='))
  }
  return [...jar].map(([name, value]) => `${name}=${value}`).join('; ')
}

/** Opens the lobby URL like the browser does, following redirects by hand to keep every cookie. */
const openLobby = async (
  account: AccountType,
  lobbyUrl: string,
  proxyAgent: ProxyAgent_FishBet88
) => {
  let cookie = ''
  let url = lobbyUrl
  let html = ''

  for (let hop = 0; hop < 5; hop++) {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        ...buildHeadersLobby(account, { cookie, lobbyUrl: '' }),
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Sec-Fetch-Dest': 'iframe',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site'
      },
      redirect: 'manual',
      timeout: REQUEST_TIMEOUT_MS,
      ...(proxyAgent && { agent: proxyAgent })
    })

    cookie = mergeCookies(cookie, res.headers.raw()['set-cookie'] ?? [])

    const location = res.headers.get('location')
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url).toString()
      continue
    }

    html = await res.text()
    break
  }

  return { cookie, html }
}

export const getLobbySessionFishBet88 = async (
  account: AccountType,
  proxyAgent: ProxyAgent_FishBet88,
  { force = false }: { force?: boolean } = {}
): Promise<LobbySession_FishBet88> => {
  const cached = sessionCache.get(account.id)
  if (!force && cached && cached.accessToken === account.token) return cached.session

  const lobbyUrl = await getLobbyUrl(account, proxyAgent)
  const params = new URL(lobbyUrl).searchParams
  const authToken = params.get('token')
  const agentName = params.get('agentName') ?? ''
  if (!authToken) throw new Error('Lobby token not found in lobby URL')

  const { cookie, html } = await openLobby(account, lobbyUrl, proxyAgent)

  // The lobby page holds the user id (agentName + login id, e.g. m0112qeg0ax); fall back to building it.
  const userId =
    /userId["']?\s*[:=]\s*["']([\w.-]+)["']/i.exec(html)?.[1] ??
    `${agentName}${account.loginID}`.toLowerCase()

  const pageTs = Number(/var\s+ts\s*=\s*["'](\d+)["']/.exec(html)?.[1])
  const stepOddsCal = Number(/SSportStepOddsCal\s*=\s*["'](-?[\d.]+)["']/.exec(html)?.[1])

  const session: LobbySession_FishBet88 = {
    authToken,
    userId,
    cookie,
    lobbyUrl,
    ts:
      Number.isFinite(pageTs) && pageTs > 0
        ? pageTs
        : Math.floor(Date.now() / 1000) + LOBBY_TS_OFFSET_SECONDS_FISHBET88,
    stepOddsCal: Number.isFinite(stepOddsCal) ? stepOddsCal : 0
  }

  await logBet(
    account,
    `Lobby session opened: userId ${userId}, ts ${session.ts}, stepOddsCal ${session.stepOddsCal}, cookies [${cookie
      .split(';')
      .map((pair) => pair.split('=')[0].trim())
      .join(', ')}]`
  )

  sessionCache.set(account.id, { accessToken: account.token, session })
  return session
}
