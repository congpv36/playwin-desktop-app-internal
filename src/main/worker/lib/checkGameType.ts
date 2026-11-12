import { clearTable, Setting } from '@db/model'

export const checkGameType = (platform: string, gameType: string) => {
  const settingInfo = Setting.findAll()
  const currentGameType = settingInfo[0]?.gameType

  if (!currentGameType || gameType !== currentGameType) {
    clearTable('PerMatchLimit')
    clearTable(platform)
    return false
  }

  return true
}
