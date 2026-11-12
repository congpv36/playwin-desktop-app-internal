import { clearTable, SettingTableView, SuccessList } from '@db/model'
import { BrowserWindow } from 'electron'

import { SettingTableViewType } from '@shared/common/types'

async function handleSuccessList(recordDB, mainWindow: BrowserWindow) {
  const SettingTableViewSuccessList = SettingTableView.findOne({
    tab: 'SuccessList'
  }) as SettingTableViewType

  const count = SuccessList.count()

  if (SettingTableViewSuccessList.clear === 1 && count > 100) {
    clearTable('SuccessList')
  }
  await new Promise((resolve) => setTimeout(resolve, 100))
  mainWindow.webContents.send('DataSuccessList', recordDB)
}

export default handleSuccessList
