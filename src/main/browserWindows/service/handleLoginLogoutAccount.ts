import { Account, clearTable, PerMatchLimit, SportsBookProviders } from '@db/model'
import { SportsBookProvidersType } from '@db/schema/sportsBookProvidersSchema'
import { BrowserWindow } from 'electron'

import { AccountType } from '@shared/common/types'
import { STATUS_ACCOUNT } from '@shared/main/constants'

import { handleGetDataSportsBook } from '@/browserWindows/service/handleGetDataSportsBook'
import { enqueueWorker } from '@/worker'
import { cancelDelayLogin } from '@/worker/lib/delayLogin'

export function handleLoginAccount(account: AccountType, mainWindow: BrowserWindow) {
  cancelDelayLogin(account.id)

  mainWindow.webContents.send(
    'DataUpdateAccount',
    Account.update(
      {
        id: account.id
      },
      { status: STATUS_ACCOUNT.IN_PROGRESS, textLog: 'Waiting for login...' }
    )
  )

  PerMatchLimit.deleteMany({ idAccount: account.id })
  enqueueWorker(account, mainWindow)

  const sportsBookProviders = SportsBookProviders.findAll()[0] as SportsBookProvidersType
  mainWindow.webContents.send(
    'GetDataSportsBookUpdate',
    handleGetDataSportsBook(sportsBookProviders.idSportsBook)
  )
}

export function handleLogoutAccount(account: AccountType, mainWindow: BrowserWindow) {
  cancelDelayLogin(account.id)

  mainWindow.webContents.send(
    'DataUpdateAccount',
    Account.update(
      {
        id: account.id
      },
      {
        currency: null,
        credit: '0',
        cashBalance: '0',
        outstanding: '0',
        givenCredit: '0',
        checkBoxAutoLogin: 0,
        textLog: null,
        statusLogin: null,
        status: STATUS_ACCOUNT.LOGIN,
        cookie: null,
        socketUrl: null,
        host: null
      }
    )
  )

  PerMatchLimit.deleteMany({ idAccount: account.id })
  const listAccount = Account.findAll({ platformName: account.platformName })
  const checkAccount = listAccount.findIndex((account) => account.status === STATUS_ACCOUNT.LOGOUT)
  if (checkAccount == -1) {
    clearTable(account.platformName)
  }

  const sportsBookProviders = SportsBookProviders.findAll()[0] as SportsBookProvidersType
  mainWindow.webContents.send(
    'GetDataSportsBookUpdate',
    handleGetDataSportsBook(sportsBookProviders.idSportsBook)
  )
}
