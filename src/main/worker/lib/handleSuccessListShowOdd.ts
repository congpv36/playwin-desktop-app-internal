import { clearTable, SettingTableView, SuccessListShowOdd } from '@db/model'
import { BrowserWindow } from 'electron'

import { SettingTableViewType } from '@shared/common/types'

async function handleSuccessListShowOdd(recordDB, mainWindow: BrowserWindow) {
  const SettingTableViewSuccessList = SettingTableView.findOne({
    tab: 'SuccessList'
  }) as SettingTableViewType

  const count = SuccessListShowOdd.count()

  if (SettingTableViewSuccessList.clear === 1 && count > 100) {
    clearTable('SuccessListShowOdd')
  }
  await new Promise((resolve) => setTimeout(resolve, 100))
  mainWindow.webContents.send('DataSuccessListShowOdd', recordDB)
}

export default handleSuccessListShowOdd
