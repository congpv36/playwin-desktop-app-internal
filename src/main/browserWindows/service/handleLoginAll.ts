import { BrowserWindow } from 'electron'

import { AccountType } from '@shared/common/types'
import { STATUS_ACCOUNT } from '@shared/main/constants'

import { handleGetAccountBySportsBook } from '@/browserWindows/service/handleGetAccountBySportsBook'
import { handleLoginAccount } from '@/browserWindows/service/handleLoginLogoutAccount'
import { platformPairStatusManager } from '@/worker/handlePairPlatform/manager'

export function handleLoginAll(mainWindow: BrowserWindow, activeSportsBook: string) {
  const listAccount = handleGetAccountBySportsBook(activeSportsBook)
  if (!listAccount || !listAccount.length) return

  const accountNotLogin = listAccount.filter(
    (account) =>
      account.status == STATUS_ACCOUNT.LOGIN &&
      account.statusDelete == 0 &&
      account.loginID &&
      account.password
  ) as AccountType[]

  if (!accountNotLogin.length) return

  for (const account of accountNotLogin) {
    handleLoginAccount(account, mainWindow)
  }

  platformPairStatusManager(mainWindow)
}
