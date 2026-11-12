import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'

import { AccountType } from '@shared/common/types'
import { TicketInfoDataBetType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { handleBetError, handleBetSuccess } from '@/worker/lib/handleLogBet'
import { isOddInRange } from '@/worker/lib/isOddInRange'
import { isProxyConfigValid } from '@/worker/lib/isProxyConfigValid'
import { DataTypeGetTickets_Viva88, TypeGetBetListApi } from '@/worker/platform/Viva88/common/types'
import { configHeaders } from '@/worker/platform/Viva88/helper'

export const placeBet_Viva88Bet = async (
  ticket: TicketInfoDataBetType,
  accountInfo: AccountType,
  dataPlaceBet: {
    dataGetTicketInfo: DataTypeGetTickets_Viva88
    authorization: string
  }
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
        info: ticket.betRejectionReason || '',
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

  const { dataGetTicketInfo, authorization } = dataPlaceBet
  const stake = Number(ticket.betAmount_Standard)
  const itemListProcessBet = [
    {
      Type: dataGetTicketInfo.TicketType,
      Bettype: dataGetTicketInfo.Bettype,
      Oddsid: dataGetTicketInfo.OddsID,
      Odds: dataGetTicketInfo.SrcOdds,
      Line: dataGetTicketInfo.Line,
      Hdp1: dataGetTicketInfo.Hdp1,
      Hdp2: dataGetTicketInfo.Hdp2,
      Hscore: dataGetTicketInfo.LiveHomeScore,
      Ascore: dataGetTicketInfo.LiveAwayScore,
      Betteam: dataGetTicketInfo.Betteam,
      Stake:
        stake > parseFloat(dataGetTicketInfo.Maxbet.replace(/,/g, ''))
          ? dataGetTicketInfo.Maxbet
          : stake,
      Matchid: dataGetTicketInfo.Matchid,
      ChoiceValue: dataGetTicketInfo.ChoiceValue,
      SrcOddsInfo: dataGetTicketInfo.SrcOddsInfo,
      ErrorCode: dataGetTicketInfo.ErrorCode,
      Home: dataGetTicketInfo.HomeName,
      Away: dataGetTicketInfo.AwayName,
      Gameid: 1,
      ProgramID: '',
      RaceNum: 0,
      Runner: 0,
      MRPercentage: dataGetTicketInfo.MRPercentage,
      AcceptBetterOdds: true,
      isQuickBet: true,
      isTablet: false,
      IsInPlay: dataGetTicketInfo.IsInPlay,
      sinfo: dataGetTicketInfo.sinfo,
      parentMatchId: dataGetTicketInfo.ParentMatchid,
      RecommendType: dataGetTicketInfo.RecommendType,
      Guid: dataGetTicketInfo.Guid,
      TicketTime: dataGetTicketInfo.TicketTime,
      MMR: '',
      LuckyDrawMinBet: dataGetTicketInfo.LuckyDrawMinBet
    }
  ]
  await accountLogToFile(
    accountInfo.platformName,
    accountInfo.loginID,
    `Betting Info: ${ticket.bet}, ${ticket.number == 0 ? 'FullTime' : '1StHalf'} ${ticket.type}@${ticket.bet.trim() == ticket.nameAway.trim() ? -Number(ticket.hdp_point) : ticket.hdp_point}, Odd: ${ticket.odd}`,
    'BetList'
  )
  const {
    ErrorCode: ErrorCode_ProcessBet,
    Info,
    receiptID
  } = await bettingProcessBet__Viva88Bet(accountInfo, authorization, itemListProcessBet)

  return {
    ErrorCode: ErrorCode_ProcessBet, // 0: Success, 1: Fail, 2: Retry
    Data: {
      info: Info || '',
      receiptID,
      receiptStatus: ErrorCode_ProcessBet == 0 ? 'Success' : 'Fail'
    }
  }
}

async function bettingProcessBet__Viva88Bet(
  accountInfo: AccountType,
  authorization: string,
  itemListProcessBet
) {
  const { platformName, loginID } = accountInfo
  try {
    const { status, data } = isProxyConfigValid(accountInfo)
    const { newIpAddress, newPort, newUsername, newPassword } = data

    const proxyUrl =
      status && accountInfo.proxyScope !== 'None'
        ? `http://${newUsername}:${newPassword}@${newIpAddress}:${newPort}`
        : undefined

    const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

    const urlProcessBet = `https://api.viva88.net/api/Betting/ProcessBet`
    const paramsProcessBet = {
      OddsType: 4,
      WebSkinType: 3,
      LicUserName: ''
    }

    const body = JSON.stringify({ ItemList: itemListProcessBet, ...paramsProcessBet })

    await accountLogToFile(
      accountInfo.platformName,
      accountInfo.loginID,
      `Payload ProcessBet: ${body}`,
      'BetList'
    )

    const fetchProcessBet = async () => {
      const resProcessBet = await fetch(urlProcessBet, {
        method: 'POST',
        headers: {
          ...configHeaders(accountInfo, 'application/json'),
          Authorization: `bearer ${authorization}`
        },
        ...(proxyAgent && { agent: proxyAgent }),
        body
      })
      return resProcessBet.json() as Promise<TypeGetBetListApi>
    }
    const dataProcessBet: TypeGetBetListApi = await fetchProcessBet()
    await accountLogToFile(
      platformName,
      loginID,
      `Response BET_PLACEMENT: ${JSON.stringify(dataProcessBet)}`,
      'BetList'
    )

    if (dataProcessBet.ErrorCode === 105) {
      const errorCode = dataProcessBet.ErrorMsg
      await accountLogToFile(
        platformName,
        loginID,
        `Status BET_PLACEMENT: FAIL (${errorCode})`,
        'BetList'
      )
      return { ErrorCode: 2, Info: errorCode, receiptID: '' }
    }

    if (dataProcessBet.ErrorCode === 0) {
      if ([2, 15, 65].includes(dataProcessBet.Data.ItemList[0].Code)) {
        const errorCode = dataProcessBet.Data.ItemList[0].Message
        await accountLogToFile(
          platformName,
          loginID,
          `Status BET_PLACEMENT: FAIL (${errorCode})`,
          'BetList'
        )
        return { ErrorCode: 2, Info: errorCode, receiptID: '' }
      }
      if ([0, 1].includes(dataProcessBet.Data.ItemList[0].Code)) {
        return handleBetSuccess(platformName, loginID, dataProcessBet.Data.ItemList[0].TransId_Cash)
      }
    }

    const errorCode =
      dataProcessBet.ErrorMsg && dataProcessBet.ErrorMsg !== null
        ? JSON.stringify(dataProcessBet.ErrorMsg)
        : JSON.stringify(dataProcessBet.Data.ItemList[0]?.Message || 'Unknown error')
    return handleBetError(platformName, loginID, errorCode)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Viva88Bet BET_PLACEMENT Fail:', errorMessage)
    return handleBetError(platformName, loginID, `${errorMessage}`)
  }
}
