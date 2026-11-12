import fetch from 'node-fetch'

import { AccountType, TicketInfoDataBetType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { isOddInRange } from '@/worker/lib/isOddInRange'
import { FtBetResponse, TypeGetTickets_SingBet } from '@/worker/platform/SingBet/common/types'
import {
  buildPlatformUrl_SingBet,
  convertXmlStringToJson,
  getProxyAgent_SingBet,
  getSslErrorMessage_SingBet
} from '@/worker/platform/SingBet/helper'

export const placeBet_SingBet = async (
  ticket: TicketInfoDataBetType,
  accountInfo: AccountType,
  dataGetTicketInfo: TypeGetTickets_SingBet
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
      Data: {
        info: ticket.betRejectionReason,
        receiptID: '',
        receiptStatus: ''
      }
    }
  }

  if (ticket.checkOdd == 1) {
    if (!isOddInRange(ticket.oddFrom, ticket.oddTo, String(ticket.odd))) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `Error: CheckOdd setting do not match.`,
        'BetList'
      )
      return {
        ErrorCode: 400,
        Data: {
          info: `Error: CheckOdd setting do not match.`,
          receiptID: '',
          receiptStatus: ''
        }
      }
    }
  }

  const {
    ErrorCode: ErrorCode_ProcessBet,
    Info,
    receiptID
  } = await bettingProcessBet__SingBet(accountInfo, {
    ...dataGetTicketInfo,
    golds: ticket.betAmount_Standard
  })

  return {
    ErrorCode: ErrorCode_ProcessBet, // 0: Success, 1: Fail, 2: Retry
    Data: {
      info: String(Info),
      receiptID,
      receiptStatus: ErrorCode_ProcessBet == 0 ? 'Success' : 'Fail'
    }
  }
}

async function bettingProcessBet__SingBet(
  accountInfo: AccountType,
  dataGetTicketInfo: TypeGetTickets_SingBet
) {
  try {
    const body = new URLSearchParams(
      Object.fromEntries(
        Object.entries(dataGetTicketInfo).map(([key, value]) => [key, String(value)])
      )
    )

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Bet Ticket [Payload]: ${JSON.stringify(dataGetTicketInfo)}`,
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
    const dataJson = convertXmlStringToJson(xmlText) as FtBetResponse
    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Bet Ticket [Response]: ${JSON.stringify(dataJson)}`,
      'BetList'
    )

    if (dataJson.ticket_id) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `Bet Ticket [Status]: Bet Success.`,
        'BetList'
      )
      return { ErrorCode: 0, Info: 'Bet Success', receiptID: 'OU' + String(dataJson.ticket_id) }
    }

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Bet Ticket [Status]: Bet Fail...(Unknown Error)`,
      'BetList'
    )
    return { ErrorCode: 1, Info: 'Unknown Error', receiptID: '' }
  } catch (error) {
    const errorMessage =
      getSslErrorMessage_SingBet(accountInfo, error) ??
      (error instanceof Error ? error.message : String(error))
    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Bet Ticket [Status]: Bet Fail...(${errorMessage})`,
      'BetList'
    )
    return { ErrorCode: 1, Info: errorMessage, receiptID: '' }
  }
}
