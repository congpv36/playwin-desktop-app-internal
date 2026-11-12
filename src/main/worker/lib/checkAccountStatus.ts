import { Account, Setting } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'

import { AccountType, SportsBookType } from '@shared/common/types'

function shouldSwitchBySuccessCount(sportBook: SportsBookType, account: AccountType): boolean {
  if (sportBook.isSwitchBySuccessCount !== 1) return false

  let min = Number(sportBook.minSuccessCount)
  let max = Number(sportBook.maxSuccessCount)

  if (min > max) [min, max] = [max, min]

  const randomThreshold = Math.floor(Math.random() * (max - min + 1)) + min

  return account.winBetsCount >= randomThreshold
}

function shouldSwitchByCredit(sportBook: SportsBookType, account: AccountType) {
  return sportBook.isSwitchByCredit == 1 && Number(account.credit) <= Number(sportBook.maxCredit)
}

function getDelayLoginSec(sportBook: SportsBookType): number {
  if (sportBook.isRandomDelayLogin !== 1) return 0

  let min = Math.max(0, Math.floor(Number(sportBook.minDelayLogin) || 0))
  let max = Math.max(0, Math.floor(Number(sportBook.maxDelayLogin) || 0))

  if (min > max) [min, max] = [max, min]

  return Math.floor(Math.random() * (max - min + 1)) + min
}

function updateAccountOrders(
  listAccount: AccountType[],
  targetAccount: AccountType,
  targetOrder: number,
  delayLoginSec: number
) {
  const maxOrderID = listAccount.length
  const updatedAccounts = listAccount.map((acc) => {
    if (acc.id === targetAccount.id) {
      return { ...acc, orderID: maxOrderID }
    } else if (acc.orderID > 1) {
      return { ...acc, orderID: acc.orderID - 1 }
    }
    return acc
  })

  for (const acc of updatedAccounts) {
    Account.update({ id: acc.id }, { orderId: acc.orderID, winBetsCount: 0 })
  }

  return {
    statusPass: false,
    account: updatedAccounts.find((acc) => acc.orderID === targetOrder),
    delayLoginSec
  }
}

function handleSwitch(account: AccountType): AccountType[] {
  return Account.findAll({ platformName: account.platformName }) as AccountType[]
}

export function checkAccountStatus(sportBook: SportsBookType, account: AccountType) {
  const setting = Setting.findAll()[0] as SettingSchemaType
  const listAccountByPlatform = Account.findAll({
    platformName: account.platformName
  }) as AccountType[]

  const isBetByOtherAcc = setting.isBetByOtherAcc === 1

  const validAccountCount =
    (!isBetByOtherAcc && listAccountByPlatform.length === 1) ||
    (isBetByOtherAcc && listAccountByPlatform.length === 2)

  if (validAccountCount) {
    return {
      statusPass: true,
      account
    }
  }

  const needSwitch =
    shouldSwitchBySuccessCount(sportBook, account) || shouldSwitchByCredit(sportBook, account)

  if (!needSwitch) {
    return {
      statusPass: true,
      account
    }
  }

  const listAccount = handleSwitch(account)
  const maxOrderID = listAccount.length

  if (account.orderID <= maxOrderID && maxOrderID > account.orderID) {
    return updateAccountOrders(listAccount, account, account.orderID, getDelayLoginSec(sportBook))
  }

  return {
    statusPass: true,
    account
  }
}
