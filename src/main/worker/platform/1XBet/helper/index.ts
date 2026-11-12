import crypto from 'crypto'

import { AsiaGameScore } from '@/worker/platform/1XBet/common/types'

export function encodeAuth1XBet(str: string, urlSafe = false) {
  let encoded = Buffer.from(String(str), 'utf8').toString('base64')
  if (urlSafe) {
    encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }
  return encoded
}

function toUuid(bytes: Buffer) {
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

export function buildDeviceCookie1XBet(loginID: string) {
  const auid = crypto.createHash('sha256').update(`auid:${loginID}`).digest().subarray(0, 16)
  const cheG = crypto.createHash('sha256').update(`che_g:${loginID}`).digest().subarray(0, 16)
  const sessionId = crypto
    .createHash('sha256')
    .update(`session:${loginID}`)
    .digest()
    .subarray(0, 16)

  return [
    'platform_type=desktop',
    `auid=${auid.toString('base64')}`,
    'lng=en',
    'cookies_agree_type=3',
    'tzo=9',
    'is12h=0',
    'window_width=1920',
    `che_g=${toUuid(cheG)}`,
    'ggru=160',
    `sh.session.id=${toUuid(sessionId)}`,
    '_gcl_au=1.1.553521830.1787110129',
    '_ga=GA1.1.1111902528.1787110129',
    '_ga_7JGWL9SV66=GS2.1.s1787110129$o1$g0$t1787110132$j57$l0$h858346483'
  ].join('; ')
}

export function buildLiveStat1XBet(score?: AsiaGameScore) {
  const periodText = (score?.CPS ?? '').toLowerCase()
  if (
    periodText.includes('half time') ||
    periodText.includes('halftime') ||
    periodText.includes('break')
  ) {
    return 'HT'
  }

  const totalSeconds = score?.TS
  if (typeof totalSeconds !== 'number' || totalSeconds <= 0) return 'LIVE'

  const minutes = Math.floor(totalSeconds / 60)
  const period = score?.CP === 1 || score?.CP === 2 ? score.CP : minutes < 45 ? 1 : 2
  return `${period}H ${minutes}'`
}
