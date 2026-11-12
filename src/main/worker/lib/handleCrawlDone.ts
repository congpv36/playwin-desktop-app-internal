import { ActivePlatformShowOdds, createModel } from '@db/model'
import { ActivePlatformShowOddsType } from '@db/schema/activePlatformShowOdds'
import dataCrawlByPlatformSchema from '@db/schema/dataCrawlByPlatform'
import { BrowserWindow } from 'electron'

import { DataCrawlType } from '@shared/common/types'

import { TABLE_NAME_BY_PLATFORM } from '../platform/platform.config'

import { processShowOdds } from '@/browserWindows/service/showOddsTransform'

export function handleCrawlDone(platformName: string, mainWindow: BrowserWindow): void {
  if (mainWindow.isDestroyed()) return

  const activePlatform = ActivePlatformShowOdds.findAll()[0] as
    | ActivePlatformShowOddsType
    | undefined

  if (!activePlatform || activePlatform.platformName !== platformName) return

  const tableName = TABLE_NAME_BY_PLATFORM[platformName]
  if (!tableName) return

  const rawData = createModel(tableName, dataCrawlByPlatformSchema).findAll() as DataCrawlType[]

  const data = processShowOdds(rawData, platformName)

  mainWindow.webContents.send('CrawlDone', data)
}
