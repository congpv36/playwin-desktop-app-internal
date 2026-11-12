import { BrowserWindow } from 'electron'

import { AccountType } from '@shared/common/types'
import { STATUS_ACCOUNT } from '@shared/main/constants'

import { handleGetAccountBySportsBook } from '@/browserWindows/service/handleGetAccountBySportsBook'
import { handleGetDataSportsBook } from '@/browserWindows/service/handleGetDataSportsBook'
import { handleLogoutAccount } from '@/browserWindows/service/handleLoginLogoutAccount'
import { hasDelayLogin } from '@/worker/lib/delayLogin'

export function handleLogoutAll(mainWindow: BrowserWindow, activeSportsBook: string) {
  const listAccount = handleGetAccountBySportsBook(activeSportsBook)
  if (!listAccount || !listAccount.length) return

  const accountNotLogin = listAccount.filter(
    ({ id, status, statusDelete, loginID, password }) =>
      (hasDelayLogin(id) ||
        (status !== STATUS_ACCOUNT.IN_PROGRESS && status !== STATUS_ACCOUNT.LOGIN)) &&
      statusDelete === 0 &&
      loginID &&
      password
  ) as AccountType[]

  if (!accountNotLogin.length) return
  for (const account of accountNotLogin) {
    handleLogoutAccount(account, mainWindow)
  }

  mainWindow.webContents.send('GetDataSportsBookUpdate', handleGetDataSportsBook(activeSportsBook))
}
