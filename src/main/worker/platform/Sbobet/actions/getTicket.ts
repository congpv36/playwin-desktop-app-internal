import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'

import { TicketInfoDataBetType } from '@shared/common/types'
import { AccountType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { OddsInfoItem_TicketSbobet, TypeTicket_Sbobet } from '@/worker/platform/Sbobet/common/types'

export const getTicket_Sbobet = async (accountInfo: AccountType, ticket: TicketInfoDataBetType) => {
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
      status && accountInfo.proxyScope !== 'None'
        ? `http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`
        : undefined

    const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

    const dataPost = {
      eventId: ticket.idEvent,
      oddsId: ticket.altLineId,
      marketType: ticket.specialOdd,
      option: ticket.bet === ticket.nameHome || ticket.bet === 'Over' ? 'h' : 'a',
      sportType: 1,
      isLive: ticket.betType === 1 ? true : false
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

    const urlMultiTicket = `${accountInfo.host}api/singleBetSlip/openTicket`

    const body = JSON.stringify(dataPost)
    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Payload: ${body}`,
      'BetList'
    )

    const response = await fetch(urlMultiTicket, {
      method: 'POST',
      headers: headersGetToken,
      ...(proxyAgent && { agent: proxyAgent }),
      body
    })

    const nameOddInfo = dataPost.oddsId + '-' + dataPost.option
    const dataMultiTicket: TypeTicket_Sbobet = await response.json()
    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Response MultiTicket: ${JSON.stringify(dataMultiTicket)}`,
      'BetList'
    )
    if (dataMultiTicket.errorCode !== 0) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `MultiTicket Fail: ${JSON.stringify(dataMultiTicket)}`,
        'BetList'
      )
      return {
        ErrorCode: 1,
        Message: `Error: Get MultiTicket Fail`,
        Hdp_point: ticket.hdp_point,
        HDP: ticket.HDP,
        Odds: ticket.odd || 0,
        Data: null,
        OldsOdd: ticket.odd,
        Min: 0,
        Max: 0
      }
    }

    const betAmount = ticket.betAmount_Standard

    if (betAmount !== '' && +betAmount > dataMultiTicket.balance) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `Error: Credit currently [${dataMultiTicket.balance}] less than bet amount setting [${betAmount}]`,
        'BetList'
      )

      return {
        ErrorCode: 1,
        Message: `Error: Credit currently [${dataMultiTicket.balance}] less than bet amount setting [${betAmount}]`,
        Hdp_point: ticket.hdp_point,
        HDP: ticket.HDP,
        Odds: ticket.odd || 0,
        Data: null,
        OldsOdd: ticket.odd,
        Min: 0,
        Max: 0
      }
    }

    if (betAmount !== '' && +betAmount < (dataMultiTicket.minBet ?? 0)) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `Error: Bet Amount [${betAmount}] less than Min Bet [${dataMultiTicket.minBet}]`,
        'BetList'
      )

      return {
        ErrorCode: 1,
        Message: `Error: Bet Amount [${betAmount}] less than Min Bet [${dataMultiTicket.minBet}]`,
        Hdp_point: ticket.hdp_point,
        HDP: ticket.HDP,
        Odds: ticket.odd || 0,
        Data: null,
        OldsOdd: ticket.odd,
        Min: 0,
        Max: 0
      }
    }

    const oddInfo = dataMultiTicket.oddsInfo[nameOddInfo]

    const dataGetOdds = {
      ...oddInfo,
      eventId: ticket.idEvent,
      minStake: dataMultiTicket.minBet,
      maxStake: dataMultiTicket.maxBet,
      marketType: ticket.specialOdd,
      option: dataPost.option
    } as OddsInfoItem_TicketSbobet

    return {
      ErrorCode: 0,
      Message: Number(ticket?.odd) === Number(oddInfo.price) ? 'OK' : 'ODDS_CHANGE',
      Hdp_point: ticket.hdp_point,
      HDP: ticket.HDP,
      Odds: oddInfo.price,
      Data: dataGetOdds,
      OldsOdd: ticket.odd,
      Min: dataMultiTicket.minBet,
      Max: dataMultiTicket.maxBet
    }
  } catch (error) {
    console.log(
      'Fetch Sbobet Get Ticket Fail:',
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
