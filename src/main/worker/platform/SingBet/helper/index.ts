/* eslint-disable @typescript-eslint/no-explicit-any */
import https from 'https'

import { XMLParser } from 'fast-xml-parser'
import { HttpsProxyAgent } from 'https-proxy-agent'

import { AccountType } from '@shared/common/types'
import { OPTIONS_PROXY } from '@shared/main/constants'

import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'

const FINAL_URL = 'https://m407.mos077.com/'

export const SINGBET_VER = '7f61a85292d7ce95165d15c0bf1cd21f_1792043030050'

export const SINGBET_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'

export const SINGBET_BASE_COOKIE =
  'protocolstr=aHR0cHM=; loadBB=WQ==; test=aW5pdA; CookieChk=WQ; iorChgSw=WQ==; cu=Tg; cuipv6=Tg; ipv6=Tg'

export function buildPlatformUrl_SingBet(account: AccountType, type: string) {
  const isMosDomain = /^https:\/\/mos\d{3}\.com\/$/.test(account.loginURL)

  const baseUrl = isMosDomain ? FINAL_URL : account.loginURL

  const urlMap: Record<string, string> = {
    BASE: `${baseUrl}transform.php?ver=${SINGBET_VER}`,
    LOGIN: `${baseUrl}transform_nl.php?ver=${SINGBET_VER}`
  }

  return urlMap[type] ?? baseUrl
}

export function convertXmlStringToJson(xmlString) {
  const parsed = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    trimValues: true
  }).parse(xmlString)
  return parsed?.serverresponse ?? null
}

export function formatOdds(input: string) {
  if (!input || !input.includes('/')) return input

  if (input.includes('/')) {
    return input
      .split('/')
      .map((v) => v.trim())
      .join('-')
  }

  return input.trim()
}

export function convertOdd(input: number): number {
  if (input <= 1) return Number(input.toFixed(2))

  const odd = input - 2
  return Number(odd.toFixed(2))
}

function reverseConvertOdds(input: string): number {
  if (!input.includes('/')) {
    return Number(input)
  }

  const [a, b] = input.split('/').map((v) => parseFloat(v.trim()))

  if (isNaN(a) || isNaN(b)) {
    return 0
  }

  return (a + b) / 2
}

export function ratioValue(ratio: string, strongSide?: 'H' | 'C'): number {
  const value = reverseConvertOdds(ratio)
  if (!strongSide) {
    return value
  }

  return strongSide === 'H' ? -value : value
}

export function parseTimeText(text: string) {
  if (typeof text !== 'string') return 'LIVE'

  const matchTime = text.match(/^(\dH)\^(\d+):\d+$/)
  if (matchTime) {
    const [, half, minute] = matchTime
    return `${half} ${minute}'`
  }

  if (text === 'MTIME^HT') {
    return 'HT'
  }

  return 'LIVE'
}

const isValidRatio = (v) => v !== undefined && v !== null && v !== ''

export function pushRecord({ records, base, game, gid, ratioKey, rh, rc, rs, number, typeOdd }) {
  const ratio = game[ratioKey]
  if (!isValidRatio(ratio)) return

  records.push({
    ...base,
    number,
    typeOdd,
    type: typeOdd == 'TOTAL' ? 'OU' : 'HDP',
    altLineId: game[gid],
    home_over: convertOdd(+game[rh]),
    away_under: convertOdd(+game[rc]),
    hdp_point: rs != '' ? ratioValue(String(ratio), game[rs]) : ratioValue(String(ratio)),
    HDP: formatOdds(String(ratio))
  })
}

export const normalizeEvents = (events: any): any[] => {
  if (Array.isArray(events)) return events
  if (events && typeof events === 'object') return [events]
  return []
}

export const fetchOptions = (account: AccountType, proxyAgent?: any) => ({
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language':
      'en-US,en;q=0.9,th;q=0.8,zh-CN;q=0.7,zh;q=0.6,ja;q=0.5,cs;q=0.4,zh-TW;q=0.3,ms;q=0.2',
    Origin: account.loginURL,
    Referer: `${account.loginURL}transform.php?ver=${SINGBET_VER}`,
    'User-Agent': SINGBET_USER_AGENT,
    ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
  },
  ...(proxyAgent && { agent: proxyAgent })
})

export const getProxyAgent_SingBet = (account: AccountType) => {
  const { status, data } = isProxyConfigValid(account)
  if (!status || account.proxyScope === OPTIONS_PROXY.NONE) {
    return new https.Agent({ rejectUnauthorized: false })
  }

  const { newIpAddress, newPort, newUsername, newPassword } = data
  return new HttpsProxyAgent<string>(
    `http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`,
    {
      rejectUnauthorized: false
    }
  )
}

const SSL_ERROR_CODES = [
  'CERT_HAS_EXPIRED',
  'CERT_NOT_YET_VALID',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'ERR_TLS_CERT_ALTNAME_INVALID'
]

export const getSslErrorMessage_SingBet = (account: AccountType, error: any): string | null => {
  const errorCode = [error?.code, error?.cause?.code, error?.errno, error?.cause?.errno].find(
    Boolean
  )
  if (!SSL_ERROR_CODES.includes(errorCode)) return null

  const domain = account.loginURL.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  return `Domain ${domain} has an invalid SSL certificate (${errorCode}). Please change Login URL to another domain.`
}
