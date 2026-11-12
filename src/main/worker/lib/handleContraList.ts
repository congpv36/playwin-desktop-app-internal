import { clearTable, ContraList, SettingTableView } from '@db/model'
import { BrowserWindow } from 'electron'

import { SettingTableViewType } from '@shared/common/types'

async function handleContraList(recordDB, mainWindow: BrowserWindow): Promise<void> {
  const SettingTableViewContraList = SettingTableView.findOne({
    tab: 'ContraList'
  }) as SettingTableViewType

  const count = ContraList.count()
  const clearThreshold = SettingTableViewContraList.clear === 1 ? 100 : 500

  if (count > clearThreshold) {
    clearTable('ContraList')
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  mainWindow.webContents.send('DataContraList', recordDB)
  await new Promise((resolve) => setTimeout(resolve, 100))
}

export default handleContraList
