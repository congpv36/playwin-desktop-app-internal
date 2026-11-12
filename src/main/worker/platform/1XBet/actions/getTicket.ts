import { HttpsProxyAgent } from 'https-proxy-agent'

import { GAME_TYPES } from '@shared/common/constants'
import { AccountType, TicketInfoDataBetType } from '@shared/common/types'
import { OPTIONS_PROXY } from '@shared/main/constants'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { fetchWithTimeout } from '@/worker/lib/fetchWithTimeout'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { API_ENDPOINTS, buildCrawlHeaders1XBet } from '@/worker/platform/1XBet/common/constant'
import { UpdateCouponResponse } from '@/worker/platform/1XBet/common/types'

export const getTicket_1XBet = async (accountInfo: AccountType, ticket: TicketInfoDataBetType) => {
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

  try {
    const { status, data } = isProxyConfigValid(accountInfo)

    const { newIpAddress, newPort, newUsername, newPassword } = data
    const proxyUrl =
      status && accountInfo.proxyScope !== OPTIONS_PROXY.NONE
        ? `http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`
        : undefined

    const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Getting Multi Ticket Data: ${ticket.bet}, ${ticket.number == 0 ? 'FullTime' : '1StHalf'} ${ticket.type}@${ticket.bet.trim() == ticket.nameAway.trim() ? -Number(ticket.hdp_point) : ticket.hdp_point}, Odd: ${ticket.odd}`,
      'BetList'
    )

    const payload = {
      UserId: Number(accountInfo.parent_id),
      Events: [
        {
          GameId: ticket.submatch_id,
          Type:
            ticket.bet.trim() == ticket.nameAway.trim() || ticket.bet.trim() == 'Under'
              ? ticket.type_away_under
              : ticket.type_home_over,
          Coef:
            ticket.bet.trim() == ticket.nameAway.trim() || ticket.bet.trim() == 'Under'
              ? ticket.marketSelectionId_away_under
              : ticket.marketSelectionId_home_over,
          Param:
            ticket.bet.trim() == ticket.nameAway.trim() ? ticket.hdp_point * -1 : ticket.hdp_point,
          PV: null,
          PlayerId: 0,
          Kind: ticket.gameType == GAME_TYPES.RUNNING ? 1 : 3,
          InstrumentId: 0,
          Seconds: 0,
          Price: 0,
          Expired: 0,
          PlayersDuel: []
        }
      ],
      Vid: 0,
      partner: 1,
      Lng: 'en',
      CfView: 16,
      CalcSystemsMin: false,
      Group: ticket.altLineId,
      Country: 218,
      Currency: 103,
      SaleBetId: 0,
      IsPowerBet: false,
      WithLobby: false
    }

    const body = JSON.stringify(payload)

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Payload UpdateCoupon: ${body}`,
      'BetList'
    )

    const res = await fetchWithTimeout(API_ENDPOINTS.UPDATE_COUPON, {
      method: 'POST',
      headers: {
        ...buildCrawlHeaders1XBet(accountInfo),
        Origin: 'https://1xbetjap.com'
      },
      ...(proxyAgent && { agent: proxyAgent }),
      body
    })

    const resData = (await res.json()) as UpdateCouponResponse

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Response UpdateCoupon: ${JSON.stringify(resData)}`,
      'BetList'
    )

    if (!resData.Success || resData.Value?.exceptionText) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `UpdateCoupon Fail: ${resData.Error || resData.Value?.exceptionText}`,
        'BetList'
      )
      return {
        ErrorCode: 1,
        Message: `Error: ${resData.Error || resData.Value?.exceptionText || 'Get MultiTicket Fail'}`,
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
      ErrorCode: 0,
      Message: Number(ticket.odd) === Number(resData.Value.CoefView) ? 'OK' : 'ODDS_CHANGE',
      Hdp_point: ticket.hdp_point,
      HDP: ticket.HDP,
      Odds: Number(resData.Value.CoefView),
      Data: resData.Value,
      OldsOdd: ticket.odd,
      Min: resData.Value.minBet,
      Max: resData.Value.maxBet
    }
  } catch (error) {
    console.log(
      'Fetch 1XBet Get Ticket Fail:',
      error instanceof Error ? error.message : String(error)
    )

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Get Ticket Fail: ${error instanceof Error ? error.message : String(error)}`,
      'BetList'
    )
    return {
      ErrorCode: 1,
      Message: `Error: Get Ticket Fail ${error instanceof Error ? error.message : 'Unknown Error'}`,
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
