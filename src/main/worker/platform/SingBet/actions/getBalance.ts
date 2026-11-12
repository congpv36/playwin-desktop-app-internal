/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'node-fetch'

import { AccountType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import {
  buildPlatformUrl_SingBet,
  convertXmlStringToJson,
  fetchOptions,
  getProxyAgent_SingBet,
  getSslErrorMessage_SingBet,
  SINGBET_BASE_COOKIE,
  SINGBET_VER
} from '@/worker/platform/SingBet/helper'

export const getBalanceSingBet = async (account: AccountType) => {
  const proxyAgent = getProxyAgent_SingBet(account)

  try {
    const bodyBalance = new URLSearchParams({
      p: 'get_member_data',
      uid: account.uid,
      ver: SINGBET_VER,
      langx: 'en-us',
      change: 'all'
    })

    const bodyWager = new URLSearchParams({
      p: 'get_today_wagers',
      uid: account.uid,
      langx: 'en-us',
      LS: 'e',
      selGtype: 'ALL',
      chk_cw: 'N',
      ts: Date.now().toString(),
      format: 'json',
      db_slow: 'N'
    })

    const options = fetchOptions(account, proxyAgent)
    const requestOptions = {
      ...options,
      headers: { ...options.headers, Cookie: account.cookie || SINGBET_BASE_COOKIE }
    }

    const [balanceRes, wagerRes] = await Promise.all([
      fetch(buildPlatformUrl_SingBet(account, 'BASE'), { ...requestOptions, body: bodyBalance }),
      fetch(buildPlatformUrl_SingBet(account, 'BASE'), { ...requestOptions, body: bodyWager })
    ])

    const xmlText = await balanceRes.text()
    const balance = convertXmlStringToJson(xmlText) ?? {}

    const wager = await wagerRes.json().catch(() => ({}))

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Response AccountBalance: ${JSON.stringify(balance)}`,
      'Program'
    )
    if (balance.code == 'error' && balance.msg == 'doubleLogin') {
      return {
        ErrorCode: 106,
        Message: 'Another session logged in. Forced to logout.',
        credit: '',
        cashBalance: '',
        outstanding: '',
        givenCredit: '',
        currency: null
      }
    }

    if (
      ['get_all_data', 'get_credit_data'].includes(balance.code) &&
      balance.enable !== 'N' &&
      balance.maxcredit !== undefined &&
      balance.maxcredit !== ''
    ) {
      return {
        ErrorCode: 0,
        Message: 'OK',
        credit: String(balance.maxcredit).trim(),
        cashBalance: String(balance.cash ?? '').trim(),
        outstanding: String(wager?.amout_gold ?? '0').trim(),
        givenCredit: String(balance.maxcredit).trim(),
        currency: balance.currency
      }
    }

    return {
      ErrorCode: 1,
      Message: `Error Res Balance: unknown`,
      credit: '',
      cashBalance: '',
      outstanding: '',
      givenCredit: '',
      currency: null
    }
  } catch (error: any) {
    console.error('Error fetching account-balance SingBet:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unstable network, proxy or server-side issue.'

    const errorCode = [error?.code, error?.cause?.code, error?.errno, error?.cause?.errno].find(
      Boolean
    )

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Error getBalance SingBet: ${errorMessage}`,
      'Program'
    )

    const sslErrorMessage = getSslErrorMessage_SingBet(account, error)
    if (sslErrorMessage) {
      return {
        ErrorCode: -4,
        Message: sslErrorMessage,
        credit: '',
        cashBalance: '',
        outstanding: '',
        givenCredit: '',
        currency: null
      }
    }

    if (errorCode === 'ECONNRESET') {
      await accountLogToFile(
        account.platformName,
        account.loginID,
        'ECONNRESET: Connection reset by proxy/server',
        'Program'
      )

      return {
        ErrorCode: -1,
        Message: 'ECONNRESET: Connection reset by proxy/server',
        credit: '',
        cashBalance: '',
        outstanding: '',
        givenCredit: '',
        currency: null
      }
    }

    if (errorCode === 'ETIMEDOUT') {
      await accountLogToFile(
        account.platformName,
        account.loginID,
        'ETIMEDOUT: Request timeout',
        'Program'
      )

      return {
        ErrorCode: -3,
        Message: 'ETIMEDOUT: Request timeout',
        credit: '',
        cashBalance: '',
        outstanding: '',
        givenCredit: '',
        currency: null
      }
    }

    return {
      ErrorCode: -1,
      Message: `Error Res Balance: ${errorMessage}`,
      credit: '',
      cashBalance: '',
      outstanding: '',
      givenCredit: '',
      currency: null
    }
  }
}
