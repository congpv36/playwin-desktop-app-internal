import { createModel } from '@db/model'
import dataCrawlByPlatformSchema from '@db/schema/dataCrawlByPlatform'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'

import { SPREAD } from '@shared/common/constants'
import { CONVERT_HDP } from '@shared/common/constants'
import { AccountType, DataCrawlType, TicketBetType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { toPositiveNumber } from '@/worker/lib/toPositiveNumber'
import { loginCheckin_Viva88Bet } from '@/worker/platform/Viva88/actions/loginCheckin'
import { TypeGetTickets_Viva88 } from '@/worker/platform/Viva88/common/types'
import { configHeaders } from '@/worker/platform/Viva88/helper'

export async function getTicket_Viva88Bet(accountInfo: AccountType, ticket: TicketBetType) {
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
  await accountLogToFile(
    accountInfo.platformName,
    accountInfo.loginID,
    `Getting Ticket Info: ${ticket.bet}, ${ticket.number == 0 ? 'FullTime' : '1StHalf'} ${ticket.type}@${ticket.bet.trim() == ticket.nameAway.trim() ? -Number(ticket.hdp_point) : ticket.hdp_point}, Odd: ${ticket.odd}`,
    'BetList'
  )
  const { ErrorCode, Data } = await loginCheckin_Viva88Bet(accountInfo)

  if (ErrorCode !== 0) {
    return {
      ErrorCode: 1,
      Message: Data,
      Hdp_point: ticket.hdp_point,
      HDP: ticket.HDP,
      Odds: ticket.odd || 0,
      Data: null,
      OldsOdd: ticket.odd,
      Min: 0,
      Max: 0
    }
  }

  try {
    const { status, data } = isProxyConfigValid(accountInfo)
    const { newIpAddress, newPort, newUsername, newPassword } = data
    const proxyUrl =
      status && accountInfo.proxyScope !== 'None'
        ? `http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`
        : undefined
    const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

    const {
      bet,
      nameHome,
      home_over,
      away_under,
      hdp_point,
      betType,
      altLineId,
      idEvent,
      nameAway
    } = ticket

    let odd: number, line: number, hdp1: number, hdp2: number

    if (ticket.typeOdd == SPREAD) {
      odd = bet === nameHome ? home_over : away_under
      line = bet === nameHome ? hdp_point : hdp_point * -1
      hdp1 = hdp_point > 0 ? 0 : hdp_point * -1
      hdp2 = hdp_point > 0 ? hdp_point : 0
    } else {
      odd = bet === 'Over' ? home_over : away_under
      line = hdp_point
      hdp1 = hdp_point
      hdp2 = 0
    }
    const itemList = [
      {
        Type: 'OU',
        Bettype: betType,
        Oddsid: altLineId,
        Odds: odd,
        Line: line,
        Hdp1: hdp1,
        Hdp2: hdp2,
        Hscore: '',
        Ascore: '',
        Betteam: bet === 'Under' || bet === nameAway ? 'a' : 'h',
        Stake: '',
        Matchid: idEvent,
        ChoiceValue: bet + '',
        SrcOddsInfo: '',
        Home: nameHome,
        Away: nameAway,
        Gameid: 1,
        ProgramID: '',
        RaceNum: 0,
        Runner: 0,
        AcceptBetterOdds: true,
        isQuickBet: false,
        isTablet: false,
        IsInPlay: false,
        parentMatchId: 0,
        MMR: '',
        IsFromParlayPage: false,
        betAction: 0
      }
    ]
    const additionalParams = {
      lastReq: Math.floor(Date.now() / 1000),
      OddsType: 4,
      WebSkinType: '3',
      LicUserName: ''
    }

    const body = JSON.stringify({
      ItemList: itemList,
      ...additionalParams
    })
    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Payload GetTickets: ${body}`,
      'BetList'
    )

    const urlBalance = `https://api.viva88.net/api/Customer/Balance`
    const urlGetTickets = `https://api.viva88.net/api/Betting/GetTickets`

    const [resBalance, resGetTickets] = await Promise.all([
      fetch(urlBalance, {
        method: 'POST',
        headers: {
          ...configHeaders(accountInfo, 'application/json'),
          Authorization: `bearer ${Data}`
        },
        ...(proxyAgent && { agent: proxyAgent })
      }),
      fetch(urlGetTickets, {
        method: 'POST',
        headers: {
          ...configHeaders(accountInfo, 'application/json'),
          Authorization: `bearer ${Data}`
        },
        ...(proxyAgent && { agent: proxyAgent }),
        body
      })
    ])

    const resDataBalance = (await resBalance.json()) as {
      Data: {
        BCredit: string
      }
    }

    const betAmount = ticket.betAmount_Standard

    if (betAmount !== '' && +betAmount > +resDataBalance.Data.BCredit) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `Error: Credit currently [${resDataBalance.Data.BCredit}] less than bet amount setting [${betAmount}]`,
        'BetList'
      )

      return {
        ErrorCode: 1,
        Message: `Error: Credit currently [${resDataBalance.Data.BCredit}] less than bet amount setting [${betAmount}]`,
        Hdp_point: ticket.hdp_point,
        HDP: ticket.HDP,
        Odds: ticket.odd || 0,
        Data: null,
        OldsOdd: ticket.odd,
        Min: 0,
        Max: 0
      }
    }

    const dataGetTickets: TypeGetTickets_Viva88 = await resGetTickets.json()

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Response GetTicket: ${JSON.stringify(dataGetTickets)}`,
      'BetList'
    )
    if (dataGetTickets.ErrorCode !== 0) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `Error GetTicket: ${JSON.stringify(dataGetTickets)}`,
        'BetList'
      )
      return {
        ErrorCode: 1,
        Message: 'Error: Get Ticket Fail',
        Hdp_point: ticket.hdp_point,
        HDP: ticket.HDP,
        Odds: ticket.odd || 0,
        Data: null,
        OldsOdd: ticket.odd,
        Min: 0,
        Max: 0
      }
    } else if (dataGetTickets.Data[0].Code == 6) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `Error GetTicket: ${JSON.stringify(dataGetTickets)}`,
        'BetList'
      )
      return {
        ErrorCode: 1,
        Message: `Error: ${dataGetTickets.Data[0].Message} `,
        Hdp_point: ticket.hdp_point,
        HDP: ticket.HDP,
        Odds: ticket.odd || 0,
        Data: null,
        OldsOdd: ticket.odd,
        Min: 0,
        Max: 0
      }
    } else if (
      dataGetTickets.Data[0].Code == 15 &&
      dataGetTickets.Data[0].isOddsChange == true &&
      dataGetTickets.Data[0].OddsStatus == 'suspend'
    ) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `Error GetTicket: ${JSON.stringify(dataGetTickets)}`,
        'BetList'
      )
      return {
        ErrorCode: 1,
        Message: `Error: Suspend the betting odds`,
        Hdp_point: ticket.hdp_point,
        HDP: ticket.HDP,
        Odds: ticket.odd || 0,
        Data: null,
        OldsOdd: ticket.odd,
        Min: 0,
        Max: 0
      }
    } else if (dataGetTickets.Data[0].isLineChange == true) {
      const Viva88Bet = createModel('Viva88Bet', dataCrawlByPlatformSchema)

      const findTicket = Viva88Bet.findOne({
        altLineId: dataGetTickets.Data[0].OddsID
      }) as DataCrawlType

      if (findTicket) {
        const { id, ...updateData } = findTicket
        Viva88Bet.update(
          { id },
          {
            ...updateData,
            hdp_point: dataGetTickets.Data[0].Line,
            HDP: CONVERT_HDP[
              toPositiveNumber(
                dataGetTickets.Data[0].Line < 0
                  ? dataGetTickets.Data[0].Line * -1
                  : dataGetTickets.Data[0].Line
              )
            ]
          }
        )
      }
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `Error GetTicket: Hdp/ou has been changed`,
        'BetList'
      )
      return {
        ErrorCode: 1,
        Message: `Error: Hdp/ou has been changed`,
        Hdp_point: ticket.hdp_point,
        HDP: ticket.HDP,
        Odds: ticket.odd || 0,
        Data: null,
        OldsOdd: ticket.odd,
        Min: 0,
        Max: 0
      }
    }

    const minBet = parseFloat(dataGetTickets.Data[0].Minbet.replace(/,/g, ''))
    const maxBet = parseFloat(dataGetTickets.Data[0].Maxbet.replace(/,/g, ''))

    if (betAmount !== '' && +betAmount < minBet) {
      await accountLogToFile(
        accountInfo.platformName,
        accountInfo.loginID,
        `Error: Bet Amount [${betAmount}] less than Min Bet [${minBet}]`,
        'BetList'
      )

      return {
        ErrorCode: 1,
        Message: `Error: Bet Amount [${betAmount}] less than Min Bet [${minBet}]`,
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
      Message:
        dataGetTickets.Data[0].Code == 15 && dataGetTickets.Data[0].isOddsChange == true
          ? 'ODDS_CHANGE'
          : 'OK',

      Hdp_point: ticket.hdp_point,
      HDP: CONVERT_HDP[
        toPositiveNumber(
          dataGetTickets.Data[0].Line < 0
            ? dataGetTickets.Data[0].Line * -1
            : dataGetTickets.Data[0].Line
        )
      ],
      Odds: dataGetTickets.Data[0].SrcOdds,
      Data: { dataGetTicketInfo: dataGetTickets.Data[0], authorization: Data },
      OldsOdd: ticket.odd,
      Min: minBet,
      Max: maxBet
    }
  } catch (error) {
    console.log(
      'Fetch Viva88 GetTickets Fail',
      error instanceof Error ? error.message : String(error)
    )
    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `GetTickets Fail: ${error instanceof Error ? error.message : String(error)}`,
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
