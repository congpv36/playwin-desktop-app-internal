import { Account } from '@db/model'
import { BrowserWindow } from 'electron'

import { AccountType } from '@shared/common/types'
import { STATUS_ACCOUNT } from '@shared/main/constants'
import { QueueHandler } from '@shared/main/types'

import createWorkerScheduledLogin from './workerScheduledLogin?nodeWorker'
import createWorkerScheduledLogout from './workerScheduledLogout?nodeWorker'

import { handleLogoutAccount } from '@/browserWindows/service/handleLoginLogoutAccount'
import { createPlatformHandler } from '@/worker/lib/createPlatformHandler'
import { getDelayLoginAccountIds } from '@/worker/lib/delayLogin'
import { sendAccountUpdate } from '@/worker/lib/sendAccountUpdate'
import { PLATFORM_CONFIG } from '@/worker/platform/platform.config'
import { startWorker } from '@/worker/workerCrawl.manager'

const platformHandlers: Record<string, QueueHandler> = {}
Object.entries(PLATFORM_CONFIG).forEach(([platformKey, { login, crawl, crawl_AccountOrder2 }]) => {
  platformHandlers[platformKey] = createPlatformHandler({
    platformKey,
    createWorkerLogin: login,
    createWorkerCrawl: crawl,
    createWorkerCrawl_AccountOrder2: crawl_AccountOrder2,
    startWorker,
    getHandler: () => platformHandlers
  })
})

export function enqueueWorker(account: AccountType, mainWindow: BrowserWindow) {
  const handler = platformHandlers[account.platformName]
  if (!handler) return

  handler.queue.push(account)
  !handler.isProcessing && handler.processor(mainWindow)
}

export function checkQueue(account: AccountType) {
  const handler = platformHandlers[account.platformName]
  handler.queue = handler.queue.filter((item: AccountType) => item.id !== account.id)
}

export function checkQueuePlatform(namePlatform: string) {
  const handler = platformHandlers[namePlatform]
  handler.queue = []
}

export function createWorkerScheduledLoginSetting(mainWindow: BrowserWindow) {
  const workerScheduledLogin = createWorkerScheduledLogin({ workerData: 'worker' })

  workerScheduledLogin.on('message', (listAccount: AccountType[]) => {
    for (const account of listAccount) {
      Account.update(
        {
          id: account.id
        },
        { status: STATUS_ACCOUNT.IN_PROGRESS, textLog: 'Waiting for login...' }
      )
      sendAccountUpdate(account.id, mainWindow)

      enqueueWorker(account, mainWindow)
    }
  })

  workerScheduledLogin.on('exit', (code) => {
    console.log('Exit workerScheduledLogin...', code)
  })

  workerScheduledLogin.on('error', (error) => {
    console.error('workerScheduledLogin error:', error)
  })
}

export function createWorkerScheduledLogoutSetting(mainWindow: BrowserWindow) {
  const workerScheduledLogout = createWorkerScheduledLogout({ workerData: 'worker' })

  workerScheduledLogout.on(
    'message',
    async ({ platformName, accounts }: { platformName: string; accounts: AccountType[] }) => {
      const delayLoginAccounts = getDelayLoginAccountIds(platformName)
        .map((id) => Account.findOne({ id }) as AccountType | undefined)
        .filter((account): account is AccountType => !!account)

      for (const account of [...accounts, ...delayLoginAccounts]) {
        handleLogoutAccount(account, mainWindow)
      }
    }
  )

  workerScheduledLogout.on('exit', (code) => {
    console.log('Exit workerScheduledLogout...', code)
  })

  workerScheduledLogout.on('error', (error) => {
    console.error('workerScheduledLogout error:', error)
  })
}
