import { Account } from '@db/model'
import { BrowserWindow } from 'electron'

import { AccountType } from '@shared/common/types'
import { STATUS_ACCOUNT } from '@shared/main/constants'

export function sendAccountUpdate(accountId: string, mainWindow: BrowserWindow) {
  const account = Account.findOne({ id: accountId }) as AccountType

  if (account && account.status !== STATUS_ACCOUNT.LOGIN) {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('DataUpdateAccount', account)
    }
  }
}
