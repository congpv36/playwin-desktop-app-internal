/* eslint-disable no-constant-condition */
import { setTimeout } from 'timers/promises'
import { MessagePort, parentPort } from 'worker_threads'

import {
  Account,
  clearTable,
  ContraList,
  DataBet,
  FailedBetList,
  PerMatchLimit,
  Setting,
  SettingTableView,
  SportBookCombination,
  SportsBook,
  SuccessList,
  WaitingList
} from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'
import { v4 as uuidv4 } from 'uuid'

import { BET_MODES, GAME_TYPES } from '@shared/common/constants'
import { SettingTableViewType, WaitingSuccessContraDBType } from '@shared/common/types'
import {
  AccountType,
  DataBetType,
  SportsBookType,
  TicketBetType,
  TicketCombinationType
} from '@shared/common/types'
import { STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'
import { handleBetTicket, handleGetTicket, handleReBetTicket } from '@/worker/lib/betService'
import { calculateProfit } from '@/worker/lib/calculateProfit'
import { checkAccountContinues } from '@/worker/lib/checkAccountContinues'
import { checkAccountStatus } from '@/worker/lib/checkAccountStatus'
import { checkBetLimit } from '@/worker/lib/checkBetLimit'
import { checkClearData } from '@/worker/lib/checkClearData'
import { checkOddsSetting } from '@/worker/lib/checkOddsSetting'
import { clearTablesForGameType } from '@/worker/lib/clearTablesForGameType'
import { formatTime } from '@/worker/lib/formatTime'
import { getAccountsToSwitch } from '@/worker/lib/getAccountsToSwitch'
import { handleOutOfCommission } from '@/worker/lib/handleOutOfCommission'
import { processTicketPair } from '@/worker/lib/processTicketPair'
import { saveOrUpdateBetRecordPerMatchDetail } from '@/worker/lib/saveOrUpdateBetRecord'
import { UpdatePerMatchLimit } from '@/worker/lib/updatePerMatchLimit'
import { UpsertTicketDelaySec } from '@/worker/lib/upsertTicketDelaySec'

const port = parentPort
if (!port) throw new Error('IllegalState')

port.on('message', async (action) => {
  if (action == 'Start') {
    await handleData(port)
  }
})

async function handleData(port: MessagePort) {
  while (true) {
    const allDataBet = DataBet.findAll() as DataBetType[]
    if (!allDataBet.length) {
      await setTimeout(1000)
      continue
    }

    const listDataBet = allDataBet.slice(0, 50)

    for (const dataBet of listDataBet) {
      if (!SportBookCombination.findById(dataBet.idPlatformPair)) continue

      const ticketPairRoot = JSON.parse(dataBet.dataPair) as TicketCombinationType[]

      const [sportBook1, sportBook2] = (await Promise.all([
        SportsBook.findOne({ platform: ticketPairRoot[0].platform }),
        SportsBook.findOne({ platform: ticketPairRoot[1].platform })
      ])) as SportsBookType[]

      if (!sportBook1 || !sportBook2) continue

      const setting = Setting.findAll()[0] as SettingSchemaType
      const queryConditions = {
        status: STATUS_ACCOUNT.LOGOUT,
        statusLogin: STATUS_LOGIN.SUCCESS,
        orderID: setting.isBetByOtherAcc === 0 ? 1 : 2
      }

      const [account1, account2] = (await Promise.all([
        Account.findOne({ ...queryConditions, platformName: ticketPairRoot[0].platform }),
        Account.findOne({ ...queryConditions, platformName: ticketPairRoot[1].platform })
      ])) as AccountType[]

      if (!account1 || !account2) continue

      const ticketPair = ticketPairRoot.map((ticket: TicketCombinationType) => {
        const account = ticket.platform === account1.platformName ? account1 : account2
        return {
          ...ticket,
          idAccount: account.id,
          company: `${ticket.platform}-${account.loginID}`,
          time: formatTime()
        }
      }) as TicketBetType[]

      const checkTimestampDelaySec = processTicketPair(ticketPair)
      if (!checkTimestampDelaySec) continue

      const [ticketI, ticketII] = ticketPair as TicketBetType[]

      //1.Check Settings General

      if (setting.gameType !== ticketI.gameType) {
        clearTablesForGameType()
        break
      }

      const isRunning = setting.gameType === GAME_TYPES.RUNNING
      if (isRunning && !ticketI.score) break

      if (setting.enableFirstStHalf == 0 && setting.enableSecondStHalf == 0) break

      const odd1 = ticketI.odd
      const odd2 = ticketII.odd
      const profit = ticketI.profit
      const checkOdds = checkOddsSetting(odd1, odd2, profit)

      const dataTicketPair = [
        {
          ...ticketI,
          company: `${ticketI.platform}-${account1.loginID}`,
          info: checkOdds.Data.infoOdd1
        },
        {
          ...ticketII,
          company: `${ticketII.platform}-${account2.loginID}`,
          info: checkOdds.Data.infoOdd2
        }
      ]

      if (checkOdds.ErrorCode == 1) {
        const record = FailedBetList.create({
          dataPair: JSON.stringify(dataTicketPair)
        })
        port.postMessage({ type: 'FailedBetList', recordDB: record })
        continue
      }

      const dataAccounts = [account1, account2]
      const canPlaceBet = await checkBetLimit(dataTicketPair, dataAccounts, port)
      if (!canPlaceBet) continue

      //---------------- SwitchAccount-------------------
      const account1Status = checkAccountStatus(sportBook1, account1)
      const account2Status = checkAccountStatus(sportBook2, account2)
      const accountsToSwitch = getAccountsToSwitch(account1Status, account2Status)

      if (accountsToSwitch?.length) {
        const deletePromises = accountsToSwitch.map((acc) =>
          PerMatchLimit.deleteMany({ idAccount: acc.id })
        )

        await Promise.all(deletePromises)

        port.postMessage({
          type: 'SwitchAccount',
          recordDB: accountsToSwitch
        })
        continue
      }
      // -------------------------------------------------

      const { betMode } = setting

      const dataTicketPairUpdated = dataTicketPair.map((ticket) => {
        if (!ticket.isBetAllowed) {
          return ticket
        }

        const allowedBetsByMode = {
          [BET_MODES.HomeOnly]: [ticket.nameHome],
          [BET_MODES.AwayOnly]: [ticket.nameAway]
        }

        const allowedBets = allowedBetsByMode[betMode]
        const isSpecialBet = ['Over', 'Under'].includes(ticket.bet)

        return {
          ...ticket,
          isBetAllowed: !(allowedBets && !isSpecialBet && !allowedBets.includes(ticket.bet)),
          betRejectionReason:
            allowedBets && !isSpecialBet && !allowedBets.includes(ticket.bet)
              ? `Bet Mode: ${betMode}`
              : ''
        }
      })

      // -------------------------------------------------

      await handlePlaceBet(dataTicketPairUpdated)
      await setTimeout(2000)
    }

    clearTable('DataBet')
    await setTimeout(1000)
  }
}

const handlePlaceBet = async (ticketPair: TicketBetType[]) => {
  for (const ticket of ticketPair) {
    ticket.info = 'In-progress'
  }

  const { uuid, dataPair } = WaitingList.create({
    uuid: uuidv4(),
    dataPair: JSON.stringify(ticketPair)
  }) as WaitingSuccessContraDBType

  port.postMessage({ type: 'WaitingListDone' })

  const [ticketI, ticketII]: TicketBetType[] = JSON.parse(dataPair)

  const isCheckAccountContinues = checkAccountContinues(ticketPair)

  if (!isCheckAccountContinues) {
    clearTable('WaitingList')
    port.postMessage({ type: 'WaitingListDone' })
    return
  }

  const { accountInfoI, accountInfoII } = isCheckAccountContinues as {
    accountInfoI: AccountType
    accountInfoII: AccountType
  }

  const [
    {
      ErrorCode: ErrorCodeI,
      Message: MessageI,
      Hdp_point: Hdp_pointI,
      HDP: HDPI,
      Odds: OddsI,
      Data: DataI
    },
    {
      ErrorCode: ErrorCodeII,
      Message: MessageII,
      Hdp_point: Hdp_pointII,
      HDP: HDPII,
      Odds: OddsII,
      Data: DataII
    }
  ] = await Promise.all([
    handleGetTicket(ticketI, accountInfoI),
    handleGetTicket(ticketII, accountInfoII)
  ])

  WaitingList.delete({ uuid })
  port.postMessage({ type: 'WaitingListDone' })

  if (ErrorCodeI == 1 || ErrorCodeII == 1 || (ErrorCodeI == 400 && ErrorCodeII == 400)) {
    const ticketUpdate = [
      { ...ticketI, info: ErrorCodeI == 0 ? 'Ticket Received' : MessageI },
      { ...ticketII, info: ErrorCodeII == 0 ? 'Ticket Received' : MessageII }
    ]

    checkClearData()
    const recordDB = FailedBetList.create({
      dataPair: JSON.stringify(ticketUpdate)
    })
    port.postMessage({ type: 'FailedBetList', recordDB })
    return
  }

  const ticketIUpdate = { ...ticketI, info: MessageI, hdp_point: Hdp_pointI, HDP: HDPI }
  const ticketIIUpdate = { ...ticketII, info: MessageII, hdp_point: Hdp_pointII, HDP: HDPII }

  if (MessageI == 'ODDS_CHANGE' && (MessageII == 'OK' || ErrorCodeII == 400)) {
    const { status, profit } = calculateProfit(Number(OddsI), Number(ticketII.odd))
    if (status === 'Fail') {
      handleOutOfCommission(
        port,
        profit,
        ticketI,
        ticketII,
        OddsI,
        ticketII.odd,
        ticketI.odd,
        ticketII.odd
      )
      return
    }
    ticketIUpdate.odd = OddsI

    ticketIUpdate.profit = profit
    ticketIIUpdate.profit = profit
  } else if ((MessageI == 'OK' || ErrorCodeI == 400) && MessageII == 'ODDS_CHANGE') {
    const { status, profit } = calculateProfit(Number(ticketI.odd), Number(OddsII))
    if (status === 'Fail') {
      handleOutOfCommission(
        port,
        profit,
        ticketI,
        ticketII,
        ticketI.odd,
        OddsII,
        ticketI.odd,
        ticketII.odd
      )
      return
    }
    ticketIIUpdate.odd = OddsII

    ticketIUpdate.profit = profit
    ticketIIUpdate.profit = profit
  } else if (MessageI == 'ODDS_CHANGE' && MessageII == 'ODDS_CHANGE') {
    const { status, profit } = calculateProfit(Number(OddsI), Number(OddsII))
    if (status === 'Fail') {
      handleOutOfCommission(
        port,
        profit,
        ticketI,
        ticketII,
        OddsI,
        OddsII,
        ticketI.odd,
        ticketII.odd
      )
      return
    }
    ticketIUpdate.odd = OddsI
    ticketIIUpdate.odd = OddsII

    ticketIUpdate.profit = profit
    ticketIIUpdate.profit = profit
  }

  const [
    { ErrorCode: ErrorCodeBetI, Data: DataBetI },
    { ErrorCode: ErrorCodeBetII, Data: DataBetII }
  ] = await Promise.all([
    handleBetTicket(ticketIUpdate, accountInfoI, DataI),
    handleBetTicket(ticketIIUpdate, accountInfoII, DataII)
  ])

  const ticketUpdate = [
    { ...ticketIUpdate, ...DataBetI },
    { ...ticketIIUpdate, ...DataBetII }
  ]
  checkClearData()

  const isSuccess =
    (ErrorCodeBetI === 0 || ErrorCodeBetI === 400) &&
    (ErrorCodeBetII === 0 || ErrorCodeBetII === 400)
  if (isSuccess) {
    if (ErrorCodeBetI === 0) {
      UpdatePerMatchLimit(accountInfoI, ticketIUpdate)
      Account.update({ id: accountInfoI.id }, { winBetsCount: accountInfoI.winBetsCount + 1 })
      UpsertTicketDelaySec(ticketIUpdate)
    }
    if (ErrorCodeBetII === 0) {
      UpdatePerMatchLimit(accountInfoII, ticketIIUpdate)
      Account.update({ id: accountInfoII.id }, { winBetsCount: accountInfoII.winBetsCount + 1 })
      UpsertTicketDelaySec(ticketIIUpdate)
    }

    const setting = Setting.findAll() as SettingSchemaType[]
    if (setting[0].enablePerMatchLimitSetting === 1) {
      ticketUpdate.forEach(saveOrUpdateBetRecordPerMatchDetail)
    }

    const recordDB = SuccessList.create({
      uuid,
      dataPair: JSON.stringify(ticketUpdate)
    }) as WaitingSuccessContraDBType

    port.postMessage({ type: 'SuccessList', recordDB })

    return
  }

  const isFail =
    ((ErrorCodeBetI === 1 || ErrorCodeBetI === 400) &&
      (ErrorCodeBetII === 1 || ErrorCodeBetII === 400)) ||
    (ErrorCodeBetI === 2 && ErrorCodeBetII === 2)
  if (isFail) {
    FailedBetList.create({ dataPair: JSON.stringify(ticketUpdate) })

    const recordDB = FailedBetList.create({
      dataPair: JSON.stringify(ticketUpdate)
    })
    port.postMessage({ type: 'FailedBetList', recordDB })
    return
  }

  const isErrorI = ErrorCodeBetI === 2
  const isErrorII = ErrorCodeBetII === 2

  if (isErrorI || isErrorII) {
    const [ticketFailed, ticketStable] = isErrorI
      ? [ticketI, ticketUpdate[1]]
      : [ticketII, ticketUpdate[0]]
    const [accountFailed, accountStable] = isErrorI
      ? [accountInfoI, accountInfoII]
      : [accountInfoII, accountInfoI]

    UpdatePerMatchLimit(accountStable, {
      ...ticketStable,
      receiptID:
        typeof ticketStable.receiptID === 'undefined' ? null : String(ticketStable.receiptID)
    })

    const settingTableView = SettingTableView.findOne({ tab: 'ContraList' }) as SettingTableViewType
    if (settingTableView.contraStrategy !== 'auto') {
      const recordDB = FailedBetList.create({ dataPair: JSON.stringify(ticketUpdate) })

      ContraList.create({
        uuid,
        dataPair: JSON.stringify(ticketUpdate)
      }) as WaitingSuccessContraDBType
      port.postMessage({ type: 'ContraList', recordDB })
      return
    }

    await accountLogToFile(
      ticketFailed.platform,
      accountFailed.loginID,
      `# Handle Retry BetTicket: ${ticketFailed.bet}, ${ticketFailed.number == 0 ? 'FullTime' : '1StHalf'} ${ticketFailed.type}@${ticketFailed.bet.trim() == ticketFailed.nameAway.trim() ? -Number(ticketFailed.hdp_point) : ticketFailed.hdp_point}, Odd: ${ticketFailed.odd}`,
      'BetList'
    )

    const { ErrorCode, Data } = await handleReBetTicket(
      ticketFailed,
      accountFailed,
      ticketFailed.platform
    )

    const { info, receiptID, receiptStatus, odd } = Data
    const profit = Number((odd + ticketStable.odd).toFixed(3))

    const ticketUpdateNew = [
      {
        ...ticketUpdate[0],
        profit,
        ...(isErrorI ? { odd, info: info + '(ContraBet)', receiptID, receiptStatus } : {})
      },
      {
        ...ticketUpdate[1],
        profit,
        ...(isErrorII ? { odd, info: info + '(ContraBet)', receiptID, receiptStatus } : {})
      }
    ]

    checkClearData()
    const recordType = ErrorCode == 1 ? 'ContraList' : 'SuccessList'
    const recordDB = FailedBetList.create({ dataPair: JSON.stringify(ticketUpdateNew) })

    if (recordType === 'ContraList') {
      ContraList.create({
        uuid,
        dataPair: JSON.stringify(ticketUpdateNew)
      }) as WaitingSuccessContraDBType
      if (isErrorI) {
        saveOrUpdateBetRecordPerMatchDetail(ticketUpdateNew[0])
      }
      if (isErrorII) {
        saveOrUpdateBetRecordPerMatchDetail(ticketUpdateNew[1])
      }
    } else {
      Account.update({ id: accountFailed.id }, { winBetsCount: accountFailed.winBetsCount + 1 })
      SuccessList.create({
        uuid,
        dataPair: JSON.stringify(ticketUpdateNew)
      }) as WaitingSuccessContraDBType
      UpdatePerMatchLimit(accountFailed, ticketFailed)
      const setting = Setting.findAll() as SettingSchemaType[]
      if (setting[0].enablePerMatchLimitSetting === 1) {
        ticketUpdateNew.forEach(saveOrUpdateBetRecordPerMatchDetail)
      }
    }

    port.postMessage({ type: recordType, recordDB })
    return
  }
}
