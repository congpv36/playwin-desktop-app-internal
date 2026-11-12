import { HttpsProxyAgent } from 'https-proxy-agent'

import { GAME_TYPES } from '@shared/common/constants'
import { AccountType, TicketInfoDataBetType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { fetchWithTimeout } from '@/worker/lib/fetchWithTimeout'
import { handleBetError, handleBetSuccess } from '@/worker/lib/handleLogBet'
import { isOddInRange } from '@/worker/lib/isOddInRange'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { API_ENDPOINTS, buildCrawlHeaders1XBet } from '@/worker/platform/1XBet/common/constant'
import { MakeBetResponse, UpdateCouponValue } from '@/worker/platform/1XBet/common/types'

export const placeBet_1XBet = async (
  ticket: TicketInfoDataBetType,
  accountInfo: AccountType,
  dataGetTicketInfo: UpdateCouponValue
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
  } = await bettingProcessBet__1XBet(accountInfo, ticket, dataGetTicketInfo)

  return {
    ErrorCode: ErrorCode_ProcessBet,
    Data: {
      info: String(Info),
      receiptID,
      receiptStatus: ErrorCode_ProcessBet == 0 ? 'Success' : 'Fail'
    }
  }
}

export async function bettingProcessBet__1XBet(
  accountInfo: AccountType,
  ticket: TicketInfoDataBetType,
  dataGetTicketInfo: UpdateCouponValue
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

    const stake = Number(ticket.betAmount_Standard)
    const summ =
      dataGetTicketInfo.maxBet > 0 && stake > dataGetTicketInfo.maxBet
        ? dataGetTicketInfo.maxBet
        : stake

    const buildPayload = (betGUID?: string | null) => ({
      UserId: Number(accountInfo.parent_id),
      Events: dataGetTicketInfo.Events.map((event) => ({
        GameId: event.GameId,
        Type: event.Type,
        Coef: event.Coef,
        Param: event.Param,
        PV: event.PV,
        PlayerId: event.PlayerId,
        Kind: event.Kind,
        InstrumentId: event.InstrumentId,
        Seconds: event.Seconds,
        Price: event.Price,
        Expired: event.Expired,
        PlayersDuel: []
      })),
      Vid: dataGetTicketInfo.Vid,
      partner: 1,
      Group: dataGetTicketInfo.Group,
      CfView: dataGetTicketInfo.CfView,
      live: ticket.gameType === GAME_TYPES.RUNNING,
      CheckCf: 2,
      Lng: 'en',
      notWait: true,
      ...(betGUID && { betGUID }),
      promo: null,
      IsPowerBet: false,
      Summ: summ,
      isAutoBet: true,
      autoBetCf: 0,
      TransformEventKind: true,
      autoBetCfView: dataGetTicketInfo.CfView,
      Source: dataGetTicketInfo.Source,
      OneClickBet: dataGetTicketInfo.OneClickBet
    })

    const sendMakeBet = async (betGUID?: string | null) => {
      const body = JSON.stringify(buildPayload(betGUID))

      await accountLogToFile(platformName, loginID, `Payload MakeBetWeb: ${body}`, 'BetList')

      const res = await fetchWithTimeout(API_ENDPOINTS.MAKE_BET, {
        method: 'POST',
        headers: {
          ...buildCrawlHeaders1XBet(accountInfo),
          Origin: 'https://1xbetjap.com',
          'X-Auth': `Bearer ${accountInfo.token}`
        },
        ...(proxyAgent && { agent: proxyAgent }),
        body
      })

      const resData = (await res.json()) as MakeBetResponse

      await accountLogToFile(
        platformName,
        loginID,
        `Response MakeBetWeb: ${JSON.stringify(resData)}`,
        'BetList'
      )

      return resData
    }

    const MAX_POLL_ATTEMPTS = 5
    let betGUID: string | null | undefined

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      const resData = await sendMakeBet(betGUID)

      if (!resData.Success || resData.Value?.FailInfo || resData.Value?.Coupon?.exceptionText) {
        const errorMessage =
          resData.Error ||
          resData.Value?.FailInfo ||
          resData.Value?.Coupon?.exceptionText ||
          'Get MultiTicket Fail'
        return handleBetError(platformName, loginID, errorMessage)
      }

      const isPending = resData.Value.waitTime > 0 && !resData.Value.Coupon

      if (!isPending) {
        return handleBetSuccess(platformName, loginID, resData.Value.Id)
      }

      betGUID = resData.Value.betGUID
      await new Promise((resolve) => setTimeout(resolve, resData.Value.waitTime))
    }

    return handleBetError(platformName, loginID, 'Bet placement timed out waiting for confirmation')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('1XBet BET_PLACEMENT Fail:', errorMessage)
    return await handleBetError(platformName, loginID, errorMessage)
  }
}
