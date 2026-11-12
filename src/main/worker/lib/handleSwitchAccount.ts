import { Account, SportsBook } from '@db/model'
import { BrowserWindow } from 'electron/main'

import { SportsBookType, SwitchAccountType } from '@shared/common/types'
import { STATUS_ACCOUNT } from '@shared/main/constants'

import { handleGetDataSportsBook } from '@/browserWindows/service/handleGetDataSportsBook'
import { enqueueWorker } from '@/worker'
import { scheduleDelayLogin } from '@/worker/lib/delayLogin'
import { PLATFORM } from '@/worker/platform/platform.config'

export async function handleSwitchAccount(
  accounts: SwitchAccountType[],
  mainWindow: BrowserWindow
) {
  for (const account of accounts) {
    const sportBook = SportsBook.findOne({
      platform: account.platformName
    }) as SportsBookType

    mainWindow.webContents.send('DataSportsBook', handleGetDataSportsBook(sportBook.name))

    // Switched-out accounts are never logged out, so from the second rotation the incoming
    // account may still be LOGOUT/EXIT — delay it too, otherwise crawl/auto-login picks it up at once
    if (account.delayLoginSec > 0 && account.status !== STATUS_ACCOUNT.IN_PROGRESS) {
      scheduleDelayLogin(account, account.delayLoginSec, mainWindow)
      continue
    }

    if (account.status === STATUS_ACCOUNT.LOGIN) {
      mainWindow.webContents.send(
        'DataUpdateAccount',
        Account.update(
          { id: account.id },
          {
            status: STATUS_ACCOUNT.IN_PROGRESS,
            textLog: 'Waiting for login...'
          }
        )
      )
      enqueueWorker(account, mainWindow)
    }

    if (account.status === STATUS_ACCOUNT.LOGOUT && account.platformName === PLATFORM.VIVA88BET) {
      enqueueWorker(account, mainWindow)
    }
  }
}
