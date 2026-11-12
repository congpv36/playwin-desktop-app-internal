import { FailedBetList, PerMatchLimit, Setting } from '@db/model'
import { PerMatchLimitType } from '@db/schema/perMatchLimit'
import { SettingSchemaType } from '@db/schema/setting'

import { LIMIT_METHOD, LIMIT_TYPE } from '@shared/common/constants'
import { TicketInfoDataBetType } from '@shared/common/types'
import { AccountType, DataPairPlatformType } from '@shared/common/types'

import { formatTime } from '@/worker/lib/formatTime'

function checkAccountLimit(
  account: AccountType,
  ticket: DataPairPlatformType | TicketInfoDataBetType
): boolean {
  let where: Partial<PerMatchLimitType> = {
    league: ticket.league || '',
    home: ticket.home || '',
    away: ticket.away || '',
    idAccount: account.id
  }

  if (account.limitMethod === LIMIT_METHOD.TEAM_NAME_HANDICAP) {
    where = { ...where, time: ticket.number, type: ticket.type, hdp_point: ticket.hdp_point }
  }

  if (account.limitMethod === LIMIT_METHOD.NAME_BETTYPE_LIMIT) {
    where = { ...where, time: ticket.number, type: ticket.type }
  }

  if (account.limitMethod === LIMIT_METHOD.NAME_TARGET_LIMIT) {
    where = {
      ...where,
      time: ticket.number,
      bet: ticket.bet
    }
  }

  const perMatchLimit = PerMatchLimit.findAll(where) as PerMatchLimitType[]

  if (!perMatchLimit) return false

  if (account.limitType === LIMIT_TYPE.TOTAL_COUNT) {
    return perMatchLimit.length >= Number(account.totalCount)
  }

  const totalBetAmount = perMatchLimit.reduce(
    (sum, item) => sum + Number(item.betAmount_Standard),
    0
  )
  return totalBetAmount >= Number(account.totalAmount)
}

function buildTicketUpdate(
  ticket: DataPairPlatformType | TicketInfoDataBetType,
  account: AccountType,
  reachedLimit: boolean,
  setting: SettingSchemaType
) {
  return {
    ...ticket,
    ...account,
    company: `${account.platformName}-${account.loginID}`,
    coverage: ticket.number === 0 ? 'FT' : 'FirstHalf',
    gameType: setting.gameType,
    time: formatTime(),
    info: reachedLimit
      ? `Get Ticket Failed: Account ${account.platformName}-${account.loginID} reached per-match limit!`
      : 'Get Ticket Failed: Do not have any available account for betting!',
    receiptID: '',
    receiptStatus: ''
  }
}

export async function checkBetLimit(
  ticketPair: DataPairPlatformType[] | TicketInfoDataBetType[],
  dataAccounts: AccountType[],
  port: import('worker_threads').MessagePort | null
) {
  const [ticketI, ticketII] = ticketPair
  const [account1, account2] = dataAccounts

  const accountI_PerMatchLimit = checkAccountLimit(account1, ticketI)
  const accountII_PerMatchLimit = checkAccountLimit(account2, ticketII)

  if (accountI_PerMatchLimit || accountII_PerMatchLimit) {
    const [setting] = Setting.findAll() as SettingSchemaType[]

    const ticketUpdate = [
      buildTicketUpdate(ticketI, account1, accountI_PerMatchLimit, setting),
      buildTicketUpdate(ticketII, account2, accountII_PerMatchLimit, setting)
    ]

    const recordDB = FailedBetList.create({
      dataPair: JSON.stringify(ticketUpdate)
    })

    port?.postMessage({ type: 'FailedBetList', recordDB })
    return false
  }

  return true
}
