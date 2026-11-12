import fetch from 'node-fetch'

import { OVER, SPREAD, TOTAL } from '@shared/common/constants'
import { AccountType, TicketInfoDataBetType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { GetTicketResponse } from '@/worker/platform/SingBet/common/types'
import {
  buildPlatformUrl_SingBet,
  convertOdd,
  convertXmlStringToJson,
  getProxyAgent_SingBet,
  getSslErrorMessage_SingBet
} from '@/worker/platform/SingBet/helper'

export const getTicket_SingBet = async (
  accountInfo: AccountType,
  ticket: TicketInfoDataBetType
) => {
  if (!ticket.isBetAllowed) {
    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      ticket.betRejectionReason,
      'BetList'
    )
    return {
      ErrorCode: 400,
      Message: 'No Bet By User',
      Hdp_point: ticket.hdp_point,
      HDP: ticket.HDP,
      Odds: ticket.odd || 0,
      Data: null,
      OldsOdd: ticket.odd,
      Min: 0,
      Max: 0
    }
  }

  await accountLogToFile(accountInfo.platformName, accountInfo.loginID, '', 'BetList')
  await accountLogToFile(
    accountInfo.platformName,
    accountInfo.loginID,
    `------------------------------------------------------------------------------------------------------------------------------------------`,
    'BetList'
  )
  await accountLogToFile(
    accountInfo.platformName,
    accountInfo.loginID,
    `--------------------[[${`GameType ${ticket.gameType}`}] ${ticket.nameHome} -vs- ${ticket.nameAway}: Bet ${ticket.bet}, ${ticket.number == 0 ? 'FullTime' : '1StHalf'} ${ticket.type}@${ticket.bet.trim() == ticket.nameAway.trim() ? -Number(ticket.hdp_point) : ticket.hdp_point}, Odd: ${ticket.odd} ]--------------------`,
    'BetList'
  )
  await accountLogToFile(accountInfo.platformName, accountInfo.loginID, '', 'BetList')

  const isFullTime = ticket.number === 0
  const isRunning = ticket.gameType === 'Running'

  const wtypeMap = {
    Running: {
      [SPREAD]: { full: 'RE', half: 'HRE' },
      [TOTAL]: { full: 'ROU', half: 'HROU' }
    },
    Default: {
      [SPREAD]: { full: 'R', half: 'HR' },
      [TOTAL]: { full: 'OU', half: 'HOU' }
    }
  }

  const mode = isRunning ? 'Running' : 'Default'
  const time = isFullTime ? 'full' : 'half'

  const wtype = wtypeMap[mode]?.[ticket.typeOdd]?.[time]

  const bet = ticket.bet.trim()
  const chose_team = bet === ticket.nameAway.trim() || bet === OVER ? 'C' : 'H'

  try {
    const data = {
      uid: accountInfo.uid,
      gid: ticket.altLineId,
      wtype: wtype,
      chose_team: chose_team,

      ver: '',
      p: 'FT_order_view',
      langx: 'en-us',
      odd_f_type: 'M',
      gtype: 'FT'
    }
    const body = new URLSearchParams(
      Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)]))
    )

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Get Ticket [Payload]: ${JSON.stringify(data)}`,
      'BetList'
    )

    const res = await fetch(buildPlatformUrl_SingBet(accountInfo, 'BASE'), {
      method: 'POST',
      headers: {
        Accept: '*/*',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8,ko;q=0.7',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: accountInfo.loginURL,
        Pragma: 'no-cache',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        ...(accountInfo.customIP ? { 'X-Forwarded-For': accountInfo.customIP } : {})
      },
      agent: getProxyAgent_SingBet(accountInfo),
      body
    })

    const xmlText = await res.text()
    const dataJson = convertXmlStringToJson(xmlText) as GetTicketResponse
    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Get Ticket [Response]: ${JSON.stringify(dataJson)}`,
      'BetList'
    )

    const maxcredit = dataJson.maxcredit
    const gold_gmin = dataJson.gold_gmin
    const gold_gmax = dataJson.gold_gmax

    const betAmount = ticket.betAmount_Standard

    if (betAmount !== '' && +betAmount > maxcredit) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `Error: Credit currently [${maxcredit}] less than bet amount setting [${betAmount}]`,
        'BetList'
      )

      return {
        ErrorCode: 1,
        Message: `Error: Credit currently [${maxcredit}] less than bet amount setting [${betAmount}]`,
        Hdp_point: ticket.hdp_point,
        HDP: ticket.HDP,
        Odds: ticket.odd || 0,
        Data: null,
        OldsOdd: ticket.odd,
        Min: 0,
        Max: 0
      }
    }

    if (betAmount !== '' && +betAmount < gold_gmin) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `Error: Bet Amount [${betAmount}] less than Min Bet [${gold_gmin}]`,
        'BetList'
      )

      return {
        ErrorCode: 1,
        Message: `Error: Bet Amount [${betAmount}] less than Min Bet [${gold_gmin}]`,
        Hdp_point: ticket.hdp_point,
        HDP: ticket.HDP,
        Odds: ticket.odd || 0,
        Data: null,
        OldsOdd: ticket.odd,
        Min: 0,
        Max: 0
      }
    }

    if (betAmount !== '' && +betAmount > gold_gmax) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `Error: Bet Amount [${betAmount}] more than Max Bet [${gold_gmax}]`,
        'BetList'
      )

      return {
        ErrorCode: 1,
        Message: `Error: Bet Amount [${betAmount}] less than Min Bet [${gold_gmax}]`,
        Hdp_point: ticket.hdp_point,
        HDP: ticket.HDP,
        Odds: ticket.odd || 0,
        Data: null,
        OldsOdd: ticket.odd,
        Min: 0,
        Max: 0
      }
    }

    if (dataJson.code == 501) {
      return {
        ErrorCode: 0,
        Message: 'OK',
        Hdp_point: ticket.hdp_point,
        HDP: ticket.HDP,
        Odds: convertOdd(dataJson.ioratio),
        Data: {
          p: 'FT_bet',
          uid: accountInfo.uid,
          ver: '',
          langx: 'en-us',
          odd_f_type: 'M',
          golds: String(betAmount),
          gid: ticket.altLineId,
          gtype: 'FT',
          wtype: String(wtype),

          rtype: dataJson.fast_check,

          chose_team: String(chose_team),
          ioratio: dataJson.ioratio,
          con: dataJson.con,
          ratio: dataJson.ratio,
          autoOdd: 'Y',
          timestamp: Date.now(),
          timestamp2: '',
          isRB: 'N',
          imp: 'N',
          ptype: '',
          isYesterday: 'N',
          f: '1R'
        },
        OldsOdd: ticket.odd,
        Min: gold_gmin,
        Max: gold_gmax
      }
    }

    if (dataJson.code == 555) {
      return {
        ErrorCode: 1,
        Message: 'The Bet system is undergoing maintenance.',
        Hdp_point: ticket.hdp_point,
        HDP: ticket.HDP,
        Odds: ticket.odd || 0,
        Data: null,
        OldsOdd: ticket.odd,
        Min: 0,
        Max: 0
      }
    }

    return {
      ErrorCode: 1,
      Message: `Error: Get Ticket Unknown `,
      Hdp_point: ticket.hdp_point,
      HDP: ticket.HDP,
      Odds: ticket.odd || 0,
      Data: null,
      OldsOdd: ticket.odd,
      Min: 0,
      Max: 0
    }
  } catch (error) {
    const errorMessage =
      getSslErrorMessage_SingBet(accountInfo, error) ??
      (error instanceof Error ? error.message : String(error))
    console.log('Get Ticket SingBet Fail:', errorMessage)

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Get Ticket Fail: ${errorMessage}`,
      'BetList'
    )
    return {
      ErrorCode: -1,
      Message: `Error: Get Ticket Fail ${errorMessage}`,
      Hdp_point: ticket.hdp_point,
      HDP: ticket.HDP,
      Odds: ticket.odd || 0,
      Data: null,
      OldsOdd: ticket.odd,
      Min: 0,
      Max: 0
    }
  }
}
