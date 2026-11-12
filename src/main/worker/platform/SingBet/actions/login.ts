/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'node-fetch'

import { AccountType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { mergeCookies } from '@/worker/lib/mergeCookies'
import {
  buildPlatformUrl_SingBet,
  convertXmlStringToJson,
  getProxyAgent_SingBet,
  getSslErrorMessage_SingBet,
  SINGBET_BASE_COOKIE,
  SINGBET_USER_AGENT,
  SINGBET_VER
} from '@/worker/platform/SingBet/helper'

export const loginSingBet = async (account: AccountType) => {
  try {
    const proxyAgent = getProxyAgent_SingBet(account)

    const body = new URLSearchParams({
      p: 'chk_login',
      langx: 'en-us',
      ver: SINGBET_VER,
      username: account.loginID,
      password_hex: Buffer.from(account.password, 'utf8').toString('hex'),
      app: 'N',
      auto: 'GIACDI',
      userAgent: Buffer.from(SINGBET_USER_AGENT, 'utf8').toString('base64')
    })

    const res = await fetch(buildPlatformUrl_SingBet(account, 'LOGIN'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: '*/*',
        Origin: account.loginURL.replace(/\/$/, ''),
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': SINGBET_USER_AGENT,
        Cookie: SINGBET_BASE_COOKIE,
        ...(account.customIP ? { 'X-Forwarded-For': account.customIP } : {})
      },
      ...(proxyAgent && { agent: proxyAgent }),
      body
    })

    const cookie = mergeCookies(SINGBET_BASE_COOKIE, res.headers.get('set-cookie'))
    const xmlText = await res.text()

    const dataJson = convertXmlStringToJson(xmlText)

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Response Auth: ${JSON.stringify(dataJson)}`,
      'Program'
    )

    if (dataJson?.status == 200 && dataJson?.msg == 100 && dataJson?.uid) {
      return { code: 0, message: 'Login success', dataJson, cookie }
    }

    if (dataJson?.code == 'error' && dataJson.msg == 'goHome') {
      await accountLogToFile(
        account.platformName,
        account.loginID,
        'Login Fail: OUR WEBSITE IS UNDER SYSTEM MAINTENANCE',
        'Program'
      )
      return {
        code: 1,
        message: 'OUR WEBSITE IS UNDER SYSTEM MAINTENANCE',
        dataJson: {},
        cookie: ''
      }
    }

    if (dataJson?.status == 'error' && (dataJson.msg == 105 || dataJson.msg == 103)) {
      await accountLogToFile(
        account.platformName,
        account.loginID,
        `Login Fail: ${dataJson.code_message}`,
        'Program'
      )
      return { code: 2, message: dataJson.code_message, dataJson: {}, cookie: '' }
    }

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Login Fail: ${dataJson?.code_message || 'UNKNOWN_ERROR'}`,
      'Program'
    )
    return {
      code: 3,
      message: `${dataJson?.code_message || 'UNKNOWN_ERROR'}`,
      dataJson: {},
      cookie: ''
    }
  } catch (error: any) {
    console.error('Error action login SingBet:', error)

    const errorCode = error?.code || error?.cause?.code

    await accountLogToFile(
      account.platformName,
      account.loginID,
      `Login Fail: ${errorCode || 'UNKNOWN_ERROR'}`,
      'Program'
    )

    const sslErrorMessage = getSslErrorMessage_SingBet(account, error)
    if (sslErrorMessage) {
      return { code: -3, message: sslErrorMessage, dataJson: {}, cookie: '' }
    }

    if (['UND_ERR_CONNECT_TIMEOUT', 'ETIMEDOUT'].includes(errorCode)) {
      return {
        code: -2,
        message: 'SingBet server timeout / Proxy connection timeout',
        dataJson: {},
        cookie: ''
      }
    }

    return { code: -1, message: `Unexpected error: ${String(error)}`, dataJson: {}, cookie: '' }
  }
}
