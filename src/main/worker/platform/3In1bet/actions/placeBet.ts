import { HttpsProxyAgent } from 'https-proxy-agent'

import { AccountType, TicketInfoDataBetType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { handleBetError, handleBetSuccess } from '@/worker/lib/handleLogBet'
import { isOddInRange } from '@/worker/lib/isOddInRange'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { BetNowResponse, SetDataResponse } from '@/worker/platform/3In1bet/common/types'
import { buildPlatformUrl_3In1Bet } from '@/worker/platform/3In1bet/helper'

export const placeBet_3in1Bet = async (
  ticket: TicketInfoDataBetType,
  accountInfo: AccountType,
  dataGetTicketInfo: SetDataResponse
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
  } = await bettingProcessBet__3in1Bet(accountInfo, ticket, dataGetTicketInfo)

  return {
    ErrorCode: ErrorCode_ProcessBet, // 0: Success, 1: Fail, 2: Retry
    Data: {
      info: String(Info),
      receiptID: receiptID || '',
      receiptStatus: ErrorCode_ProcessBet == 0 ? 'Success' : 'Fail'
    }
  }
}

async function bettingProcessBet__3in1Bet(
  accountInfo: AccountType,
  ticket: TicketInfoDataBetType,
  dataGetTicketInfo: SetDataResponse
) {
  const { platformName, loginID } = accountInfo

  try {
    const { status: statusProxyConfigValid, data } = isProxyConfigValid(accountInfo)
    const { newIpAddress, newPort, newUsername, newPassword } = data

    const proxyUrl =
      statusProxyConfigValid && accountInfo.proxyScope !== 'None'
        ? `http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`
        : undefined

    const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

    const idEvent = ticket.idEvent
    const odd = Math.abs(Number(ticket.hdp_point))
    const priceOdd = dataGetTicketInfo.d.Odds

    const { bet, nameHome } = ticket
    const typeBet = ['Over', 'Under'].includes(bet) ? bet : 'Hdp'
    const type = bet === nameHome || bet === 'Over' ? 'Home' : 'Away'
    const typeOdd = 'MY'
    const isHomeStrong = ticket.isHomeStrong //1-đội nhà mạnh   0-đội nhà yếu case odd==0? vị trí
    const typeTime = ticket.gameType
    //0,0,0
    const uuidLeague = ticket.uuidLeague
    const number = ticket.number
    //0,0
    const code = dataGetTicketInfo.d.Code
    const homeScore = dataGetTicketInfo.d.HomeScore
    const awayScore = dataGetTicketInfo.d.AwayScore

    const dataPayload = [
      idEvent,
      priceOdd,
      typeBet,
      type,
      typeOdd,
      isHomeStrong,
      odd,
      typeTime,
      homeScore,
      awayScore,
      0,
      uuidLeague,
      number,
      ticket.betAmount_Standard,
      code,
      0
    ].join(',')

    const body = JSON.stringify({
      data: dataPayload,
      isAuto: true,
      s: '0',
      cb: 0,
      bo: '0'
    })

    await accountLogToFile(
      platformName,
      loginID,
      `Betting Info: ${ticket.bet}, ${ticket.number == 0 ? 'FullTime' : '1StHalf'} ${ticket.type}@${ticket.bet.trim() == ticket.nameAway.trim() ? -Number(ticket.hdp_point) : ticket.hdp_point}, Odd: ${ticket.odd}`,
      'BetList'
    )

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Payload: ${body}`,
      'BetList'
    )

    const betNowRes = await fetch(buildPlatformUrl_3In1Bet(accountInfo, 'BET_NOW'), {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        Cookie: accountInfo.cookie,
        ...(accountInfo.customIP ? { 'X-Forwarded-For': accountInfo.customIP } : {})
      },
      ...(proxyAgent && { agent: proxyAgent }),
      body
    })

    const betNow = (await betNowRes.json()) as BetNowResponse
    await accountLogToFile(
      platformName,
      loginID,
      `Response BET_PLACEMENT: ${JSON.stringify(betNow)}`,
      'BetList'
    )
    const statusCode = betNow.d.StatusCode
    const message = betNow.d.Message || 'Unknown Error'
    const refNo = betNow.d.BetData[0].RefNo

    if (refNo) {
      return await handleBetSuccess(platformName, loginID, refNo)
    }

    if (statusCode == 3 || statusCode == -1) {
      await accountLogToFile(
        platformName,
        loginID,
        `Status BET_PLACEMENT: FAIL (${message})`,
        'BetList'
      )
      return { ErrorCode: 2, Info: message, receiptID: refNo }
    }

    return await handleBetError(platformName, loginID, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('3in1Bet BET_PLACEMENT Fail:', errorMessage)
    return await handleBetError(platformName, loginID, errorMessage)
  }
}
