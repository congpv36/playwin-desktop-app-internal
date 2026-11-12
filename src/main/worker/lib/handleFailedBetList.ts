import { clearTable, FailedBetList, SettingTableView } from '@db/model'
import { BrowserWindow } from 'electron'

import { SettingTableViewType } from '@shared/common/types'

async function handleFailedBetList(recordDB, mainWindow: BrowserWindow): Promise<void> {
  const SettingTableViewFailedBetList = SettingTableView.findOne({
    tab: 'FailedBetList'
  }) as SettingTableViewType

  const count = FailedBetList.count()
  const clearThreshold = SettingTableViewFailedBetList.clear === 1 ? 100 : 500

  if (count > clearThreshold) {
    clearTable('FailedBetList')
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  mainWindow.webContents.send('DataFailedBetList', recordDB)
  await new Promise((resolve) => setTimeout(resolve, 100))
}

export default handleFailedBetList
