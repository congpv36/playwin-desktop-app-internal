import fetch from 'node-fetch'

import { AccountType } from '@shared/common/types'

import { buildHeadersOdds } from '@/worker/platform/FishBet88/common/constants'
import {
  MatchDetailResponse_FishBet88,
  MatchesResponse_FishBet88,
  OddsRow_FishBet88
} from '@/worker/platform/FishBet88/common/types'
import {
  buildMatchDetailUrl,
  buildMatchesUrl,
  ProxyAgent_FishBet88
} from '@/worker/platform/FishBet88/helper'

const REQUEST_TIMEOUT_MS = 15_000

const fetchOddsJson = async <T>(
  url: string,
  account: AccountType,
  proxyAgent: ProxyAgent_FishBet88
): Promise<T> => {
  const res = await fetch(url, {
    method: 'GET',
    headers: buildHeadersOdds(account),
    timeout: REQUEST_TIMEOUT_MS,
    ...(proxyAgent && { agent: proxyAgent })
  })

  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} - ${url}`)

  return (await res.json()) as T
}

/**
 * API 1: every odds row of a market (one row per line, several rows per match).
 * Running rows come back in `RunningMatches`, the others in `Matches`.
 */
export const getMatchesFishBet88 = async (
  account: AccountType,
  marketId: number,
  proxyAgent: ProxyAgent_FishBet88
): Promise<OddsRow_FishBet88[]> => {
  const data = await fetchOddsJson<MatchesResponse_FishBet88>(
    buildMatchesUrl(marketId),
    account,
    proxyAgent
  )

  return [
    ...(Array.isArray(data?.Matches) ? data.Matches : []),
    ...(Array.isArray(data?.RunningMatches) ? data.RunningMatches : [])
  ]
}

/** API 2: every line of one match, with Malay odds. */
export const getMatchDetailFishBet88 = async (
  account: AccountType,
  matchId: number,
  marketId: number,
  proxyAgent: ProxyAgent_FishBet88
): Promise<OddsRow_FishBet88[]> => {
  const data = await fetchOddsJson<MatchDetailResponse_FishBet88>(
    buildMatchDetailUrl(matchId, marketId),
    account,
    proxyAgent
  )

  return Array.isArray(data?.Matches) ? data.Matches : []
}
