import { BetListResult, clearTable, SettingTableView } from '@db/model'
import { BrowserWindow } from 'electron'

import { SettingTableViewType } from '@shared/common/types'

import { sendCount } from '@/worker/lib/sendCount'

async function handleBetList(recordDB, mainWindow: BrowserWindow): Promise<void> {
  const SettingTableViewBetList = SettingTableView.findOne({
    tab: 'BetList'
  }) as SettingTableViewType

  const count = BetListResult.count()
  const clearThreshold = SettingTableViewBetList.clear === 1 ? 100 : 500

  if (count > clearThreshold) {
    clearTable('BetListResult')
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  await sendCount('TotalBetList', BetListResult, mainWindow)
  if (!mainWindow.isDestroyed()) {
    mainWindow.webContents.send('DataBetList', recordDB)
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

export default handleBetList
