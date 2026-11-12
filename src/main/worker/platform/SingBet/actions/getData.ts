/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'node-fetch'

import { AccountType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import {
  GAME_TYPE_FILTER,
  GAME_TYPE_R_TYPE,
  GAME_TYPE_SHOW_TYPE
} from '@/worker/platform/SingBet/common/constants'
import {
  buildPlatformUrl_SingBet,
  convertXmlStringToJson,
  getProxyAgent_SingBet,
  getSslErrorMessage_SingBet,
  normalizeEvents
} from '@/worker/platform/SingBet/helper'

export const getDataSingBet = async (account: AccountType, gameType: string) => {
  try {
    const proxyAgent = getProxyAgent_SingBet(account)

    const body = new URLSearchParams({
      uid: account.uid,
      showtype: GAME_TYPE_SHOW_TYPE[gameType],
      rtype: GAME_TYPE_R_TYPE[gameType],
      filter: GAME_TYPE_FILTER[gameType],
      langx: 'en-us',
      p: 'get_game_list',
      ver: '',
      p3type: '',
      date: 'all',
      gtype: 'ft',
      ltype: '3',
      cupFantasy: 'N',
      sorttype: 'L',
      specialClick: '',
      isFantasy: 'N',
      ts: Date.now().toString(),
      chgSortTS: Date.now().toString()
    })

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Get Soccer ${gameType}...`,
      'Program'
    )

    const res = await fetch(buildPlatformUrl_SingBet(account, 'BASE'), {
      method: 'POST',
      headers: {
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: account.loginURL,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
      },
      ...(proxyAgent && { agent: proxyAgent }),
      body: body.toString()
    })

    const xmlText = await res.text()
    const dataJson = convertXmlStringToJson(xmlText)

    const data = dataJson?.ec

    if (!data || data?.length == 0) {
      await accountLogToFile(
        account.platformName,
        account.loginID,
        `Soccer ${gameType}: No data.`,
        'Program'
      )

      return { code: 1, message: `Soccer ${gameType}: No data.`, data: [] }
    }
    return { code: 0, message: `Data received. Processing started...`, data: normalizeEvents(data) }
  } catch (error: any) {
    console.error('Error getData SingBet:', error)
    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Error getData SingBet: ${error instanceof Error ? error.message : 'Unstable network, proxy or server-side issue.'}`,
      'Program'
    )

    const errorCode = [error?.code, error?.cause?.code, error?.errno, error?.cause?.errno].find(
      Boolean
    )

    const sslErrorMessage = getSslErrorMessage_SingBet(account, error)
    if (sslErrorMessage) {
      await accountLogToFile(account.platformName, account.loginID, sslErrorMessage, 'Program')
      return { code: -4, message: sslErrorMessage, data: [] }
    }

    if (errorCode === 'ECONNRESET') {
      await accountLogToFile(
        account.platformName,
        account.loginID,
        'ECONNRESET: Connection reset by proxy/server',
        'Program'
      )

      return {
        code: -2,
        message: 'Connection reset (proxy/server unstable)',
        data: []
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
        code: -3,
        message: 'Request timeout',
        data: []
      }
    }

    return { code: -1, message: `Unexpected error: ${String(error)}`, data: [] }
  }
}
