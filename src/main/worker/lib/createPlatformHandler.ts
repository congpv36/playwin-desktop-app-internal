import { Account } from '@db/model'
import { BrowserWindow } from 'electron'

import { AccountType } from '@shared/common/types'
import { QueueHandler } from '@shared/main/types'

type CreatePlatformHandlerParams = {
  platformKey: string
  createWorkerLogin: QueueHandler['createWorkerLogin']
  createWorkerCrawl: QueueHandler['createWorkerCrawl']
  createWorkerCrawl_AccountOrder2: QueueHandler['createWorkerCrawl_AccountOrder2']

  startWorker: (account: AccountType, mainWindow: BrowserWindow, platformHandlers) => void
  getHandler: () => Record<string, QueueHandler>
}

export function createPlatformHandler({
  platformKey,
  createWorkerLogin,
  createWorkerCrawl,
  createWorkerCrawl_AccountOrder2,
  startWorker,
  getHandler
}: CreatePlatformHandlerParams): QueueHandler {
  return {
    queue: [],
    isProcessing: false,
    createWorkerLogin,
    createWorkerCrawl,
    createWorkerCrawl_AccountOrder2,

    processor(mainWindow: BrowserWindow) {
      const handlers = getHandler()
      const handler = handlers[platformKey]

      if (handler.isProcessing || handler.queue.length === 0) return

      const account = handler.queue.shift()
      if (!account) return

      const accountInfo = Account.findOne({
        id: account.id,
        platformName: platformKey,
        statusDelete: 0
      }) as AccountType

      if (!accountInfo) return

      handler.isProcessing = true
      startWorker(accountInfo, mainWindow, getHandler())
    }
  }
}
