import {
  Account,
  PerMatchLimitPlatform,
  ScheduledLoginLogout,
  SettingPerMatchLimit,
  SportsBook
} from '@db/model'
import { BrowserWindow } from 'electron'

import { handleGetDataSportsBook } from '@/browserWindows/service/handleGetDataSportsBook'
import { checkQueuePlatform } from '@/worker'
import { cancelDelayLogin, getDelayLoginAccountIds } from '@/worker/lib/delayLogin'

export function handleDeletePlatForm(
  mainWindow: BrowserWindow,
  namePlatform: string,
  activeSportsBook: string
) {
  getDelayLoginAccountIds(namePlatform).forEach(cancelDelayLogin)
  Account.deleteMany({ platformName: namePlatform })
  SportsBook.delete({ platform: namePlatform })

  SettingPerMatchLimit.delete({ namePlatform })
  PerMatchLimitPlatform.deleteMany({ platform: namePlatform })
  ScheduledLoginLogout.update(
    { platformName: namePlatform },
    {
      checked: 0,
      loginSetting: JSON.stringify({ enabled: 0, schedules: [] }),
      logoutSetting: JSON.stringify({ enabled: 0, schedules: [] })
    }
  )

  checkQueuePlatform(namePlatform)
  mainWindow.webContents.send('DataSportsBook', handleGetDataSportsBook(activeSportsBook))
}
