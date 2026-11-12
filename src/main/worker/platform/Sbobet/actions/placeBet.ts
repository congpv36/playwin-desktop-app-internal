import { Setting } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'

import { TicketInfoDataBetType } from '@shared/common/types'
import { AccountType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { handleBetError, handleBetSuccess } from '@/worker/lib/handleLogBet'
import { isOddInRange } from '@/worker/lib/isOddInRange'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import {
  OddsInfoItem_TicketSbobet,
  PlaceBetResponse_Sbobet
} from '@/worker/platform/Sbobet/common/types'

export const placeBet_Sbobet = async (
  ticket: TicketInfoDataBetType,
  accountInfo: AccountType,
  dataGetTicketInfo: OddsInfoItem_TicketSbobet
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
  } = (await bettingProcessBet__Sbobet(accountInfo, ticket, dataGetTicketInfo)) ?? {}

  return {
    ErrorCode: ErrorCode_ProcessBet, // 0: Success, 1: Fail, 2: Retry
    Data: {
      info: String(Info),
      receiptID: String(receiptID),
      receiptStatus: ErrorCode_ProcessBet == 0 ? 'Success' : 'Fail'
    }
  }
}

async function bettingProcessBet__Sbobet(
  accountInfo: AccountType,
  ticket: TicketInfoDataBetType,
  dataGetTicketInfo: OddsInfoItem_TicketSbobet
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

    const settings = Setting.findAll() as SettingSchemaType[]

    const stake = Number(ticket.betAmount_Standard)
    const dataPost = {
      uid: dataGetTicketInfo.uid,
      oddsId: dataGetTicketInfo.oddsId,
      eventId: dataGetTicketInfo.eventId,
      liveScore: {
        home: dataGetTicketInfo.liveHomeScore,
        away: dataGetTicketInfo.liveAwayScore
      },
      point: dataGetTicketInfo.point,
      option: dataGetTicketInfo.option,
      marketType: dataGetTicketInfo.marketType,
      sportType: 1,
      betPage: settings[0].gameType === 'Early' ? 5 : settings[0].gameType === 'Running' ? 1 : 2,
      stake: stake > (dataGetTicketInfo.maxStake ?? 0) ? dataGetTicketInfo.maxStake : stake,
      voucherIdString: ''
    }
    const headersGetToken = {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
      'Content-Type': 'application/json',
      Origin: accountInfo.host,
      Referer: accountInfo.host,
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      Traceparent: '00-c629284fb3113891ff9b3462b6ef0f3d-492ebcb2530cc7db-00',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      Cookie: accountInfo.cookie,
      ...(accountInfo.customIP ? { 'X-Forwarded-For': accountInfo.customIP } : {})
    }

    const urlMultiTicket = `${accountInfo.host}api/singleBetSlip/placeBet`

    const body = JSON.stringify(dataPost)

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
    const resBetPlacement = await fetch(urlMultiTicket, {
      method: 'POST',
      headers: headersGetToken,
      ...(proxyAgent && { agent: proxyAgent }),
      body
    })
    const dataBetPlacement: PlaceBetResponse_Sbobet = await resBetPlacement.json()

    await accountLogToFile(
      platformName,
      loginID,
      `Response BET_PLACEMENT: ${JSON.stringify(dataBetPlacement)}`,
      'BetList'
    )

    if (!dataBetPlacement.isPlaceBetSuccess) {
      return {
        ErrorCode: 2,
        Info: dataBetPlacement.message || 'Unknown Error',
        receiptID: dataBetPlacement.transId || ''
      }
    }

    return await handleBetSuccess(platformName, loginID, dataBetPlacement.transId)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Sbobet BET_PLACEMENT Fail:', errorMessage)
    return await handleBetError(platformName, loginID, `${errorMessage}`)
  }
}
