import { Account, Setting, SportsBook } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'
import { BrowserWindow } from 'electron'

import { AccountType, SportsBookType } from '@shared/common/types'

import { handleGetDataSportsBook } from '@/browserWindows/service/handleGetDataSportsBook'
import { cancelDelayLogin } from '@/worker/lib/delayLogin'

export function updateDataListAccount(
  platform: string,
  listAccount: AccountType[],
  mainWindow: BrowserWindow,
  activeSportsBook: string,
  switchSettings: {
    isSwitchBySuccessCount: number
    isSwitchByCredit: number
    minSuccessCount: string
    maxSuccessCount: string
    maxCredit: string
  },
  randomDelayLoginSettings: {
    isRandomDelayLogin: number
    minDelayLogin: string
    maxDelayLogin: string
  }
) {
  SportsBook.update({ platform }, { ...switchSettings, ...randomDelayLoginSettings })
  const sportsBook = SportsBook.findOne({ platform }) as SportsBookType
  const isAllAccount = sportsBook.isMatchLimitAllAccount === 1

  const setting = Setting.findAll()[0] as SettingSchemaType

  if (listAccount.length === 0) {
    for (const account of Account.findAll({ platformName: platform }) as AccountType[]) {
      cancelDelayLogin(account.id)
    }
    Account.deleteMany({ platformName: platform })
    const dataSportsBook = handleGetDataSportsBook(activeSportsBook)
    mainWindow.webContents.send('DataSportsBook', dataSportsBook)
    return
  }

  const incomingAccountIds = new Set(listAccount.map((account) => account.id))
  const existingAccounts = Account.findAll({ platformName: platform }) as AccountType[]

  for (const existingAccount of existingAccounts) {
    if (!incomingAccountIds.has(existingAccount.id)) {
      cancelDelayLogin(existingAccount.id)
      Account.delete({ id: existingAccount.id })
    }
  }

  for (const account of listAccount) {
    const existing = Account.findOne({ id: account.id }) as AccountType | undefined

    const baseUpdateFields = {
      orderID: account.orderID,
      winBetsCount: 0,
      limitMethod: isAllAccount ? sportsBook.limitMethod : 'TeamName',
      livePreGame: 0,
      limitType: isAllAccount ? sportsBook.limitType : 'TotalCount',
      totalAmount: isAllAccount ? sportsBook.totalAmount : '5000',
      totalCount: isAllAccount ? sportsBook.totalCount : '2',
      loginID: account.loginID,
      password: account.password,
      secret: account.secret,
      customIP: account.customIP,
      proxyIP: account.proxyIP,
      proxyPort: account.proxyPort || '',
      proxyUsername: account.proxyUsername,
      proxyPassword: account.proxyPassword,
      proxyScope: account.proxyScope,
      loginURL: sportsBook.url
    }

    if (!existing) {
      try {
        Account.create({
          id: account.id,
          ...baseUpdateFields,
          typeCrawl: setting.gameType,
          platformName: platform,
          currency: null,
          credit: '0',
          cashBalance: '0',
          outstanding: '0',
          givenCredit: '0',
          checkBoxBet: 1,
          checkBoxRefresh: 1,
          checkBoxAutoLogin: 0,
          autoLoginAttempts: 0,
          textLog: null,
          statusLogin: null,
          status: 'Login',
          statusDelete: 0,
          cookie: null,
          socketUrl: null,
          host: null
        })
      } catch (error) {
        console.error(`Error creating account with ID ${account.id}:`, error)
      }

      continue
    }

    const shouldReset =
      existing.loginID !== account.loginID ||
      existing.password !== account.password ||
      existing.secret !== account.secret ||
      existing.customIP !== account.customIP ||
      existing.proxyIP !== account.proxyIP ||
      existing.proxyPort !== account.proxyPort ||
      existing.proxyUsername !== account.proxyUsername ||
      existing.proxyPassword !== account.proxyPassword ||
      existing.proxyScope !== account.proxyScope ||
      existing.orderID !== account.orderID

    if (shouldReset) {
      cancelDelayLogin(account.id)
      Account.update(
        { id: account.id },
        {
          ...baseUpdateFields,
          currency: null,
          credit: '0',
          cashBalance: '0',
          outstanding: '0',
          givenCredit: '0',
          checkBoxAutoLogin: 0,
          textLog: null,
          statusLogin: null,
          status: 'Login',
          cookie: null,
          socketUrl: null,
          host: null
        }
      )
    } else {
      Account.update({ id: account.id }, baseUpdateFields)
    }
  }

  const dataSportsBook = handleGetDataSportsBook(activeSportsBook)
  mainWindow.webContents.send('DataSportsBook', dataSportsBook)
  mainWindow.webContents.send('DataUpdateAccount', null)
}
