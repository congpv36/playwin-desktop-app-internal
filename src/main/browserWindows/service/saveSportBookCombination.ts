import { Account, clearTable, SportBookCombination, SportsBook } from '@db/model'
import { BrowserWindow } from 'electron'

import { PlatformPairType } from '@shared/common/types'

import { handleGetDataSportsBook } from '@/browserWindows/service/handleGetDataSportsBook'
import { updateSportsBookPairStatus } from '@/browserWindows/service/updateSportsBookPairStatus'
import { platformPairStatusManager } from '@/worker/handlePairPlatform/manager'

export async function SaveSportBookCombination(
  dataPlatformPair: PlatformPairType[],
  mainWindow: BrowserWindow,
  activeSportsBook: string
) {
  clearTable('DataBet')
  clearTable('SportBookCombination')

  if (!dataPlatformPair.length) {
    Account.update({}, { statusPair: 0 })
    SportsBook.update({}, { isPaired: 0 })

    const dataSportsBook = handleGetDataSportsBook(activeSportsBook)
    mainWindow.webContents.send('DataSportsBook', dataSportsBook)

    platformPairStatusManager(mainWindow)
    return
  }

  const transformedData = dataPlatformPair.map((platformPair) => {
    return {
      id: platformPair.id,
      isValid: platformPair.isValid,
      key: platformPair.key,
      sportBook1: JSON.stringify(platformPair.sportBook1),
      sportBook2: JSON.stringify(platformPair.sportBook2)
    }
  })

  SportBookCombination.insertMany(transformedData)

  updateSportsBookPairStatus()

  const dataSportsBook = handleGetDataSportsBook(activeSportsBook)
  mainWindow.webContents.send('DataSportsBook', dataSportsBook)

  platformPairStatusManager(mainWindow)
}
