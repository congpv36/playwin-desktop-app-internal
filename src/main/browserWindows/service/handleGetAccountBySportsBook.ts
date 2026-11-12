import { Account, Setting, SportsBook } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'

import { AccountType, SportsBookType } from '@shared/common/types'

export function handleGetAccountBySportsBook(activeSportsBook: string) {
  const setting = Setting.findAll()[0] as SettingSchemaType
  const isBetByOtherAcc = setting.isBetByOtherAcc

  const listPlatformBySportsBook = SportsBook.findAll({
    name: activeSportsBook
  }) as SportsBookType[]

  const listAccount = Account.findAll() as AccountType[]

  const platformSet = new Set(listPlatformBySportsBook.map((item) => item.platform))

  const allowedOrderIds = isBetByOtherAcc === 1 ? [1, 2] : [1]

  return listAccount.filter(
    (item) => platformSet.has(item.platformName) && allowedOrderIds.includes(item.orderID)
  )
}
