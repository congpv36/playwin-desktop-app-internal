import {
  BetListResult,
  clearTable,
  ContraList,
  FailedBetList,
  SettingTableView,
  SuccessList,
  WaitingList
} from '@db/model'

export const checkClearData = () => {
  const settings = [
    {
      setting: SettingTableView.findOne({ tab: 'BetList' }) as { clear: number },
      count: () => BetListResult.count(),
      tableName: 'BetListResult'
    },
    {
      setting: SettingTableView.findOne({ tab: 'WaitingList' }) as { clear: number },
      count: () => WaitingList.count(),
      tableName: 'WaitingList'
    },
    {
      setting: SettingTableView.findOne({ tab: 'ContraList' }) as { clear: number },
      count: () => ContraList.count(),
      tableName: 'ContraList'
    },
    {
      setting: SettingTableView.findOne({ tab: 'SuccessList' }) as { clear: number },
      count: () => SuccessList.count(),
      tableName: 'SuccessList'
    },
    {
      setting: SettingTableView.findOne({ tab: 'FailedBetList' }) as { clear: number },
      count: () => FailedBetList.count(),
      tableName: 'FailedBetList'
    }
  ]

  settings.forEach(({ setting, count, tableName }) => {
    if (count() >= (setting.clear === 1 ? 100 : 500)) {
      clearTable(tableName)
    }
  })
}
