/* eslint-disable @typescript-eslint/no-explicit-any */
import { Worker, WorkerOptions } from 'worker_threads'

import { Account, ContraList, FailedBetList, SuccessList, WaitingList } from '@db/model'
import { BrowserWindow } from 'electron/main'

import { AccountType } from '@shared/common/types'
import { STATUS_ACCOUNT } from '@shared/main/constants'
import { QueueHandler } from '@shared/main/types'

import { handleCrawlDone } from './lib/handleCrawlDone'
import { handleMoveAccountToEnd } from './lib/handleMoveAccountToEnd'
import createWorkerCrawlViva88 from './platform/Viva88/workerCrawl?nodeWorker'
import createWorkerCrawlViva88_AccountOrder2 from './platform/Viva88/workerCrawl_AccountOrder2?nodeWorker'
import createWorkerHandleDataViva88 from './platform/Viva88/workerHandleData?nodeWorker'
import createWorkerAutoLogin from './workerAutoLogin?nodeWorker'
import createWorkerPlaceBet from './workerPlaceBet?nodeWorker'

import { enqueueWorker } from '@/worker'
import { handleAccountLoggedAgain } from '@/worker/lib/handleAccountLoggedAgain'
import handleBetList from '@/worker/lib/handleBetList'
import handleContraList from '@/worker/lib/handleContraList'
import handleFailedBetList from '@/worker/lib/handleFailedBetList'
import handleSuccessList from '@/worker/lib/handleSuccessList'
import { handleSwitchAccount } from '@/worker/lib/handleSwitchAccount'
import { sendAccountUpdate } from '@/worker/lib/sendAccountUpdate'
import { sendCount } from '@/worker/lib/sendCount'
import { systemLogToFile } from '@/worker/lib/systemLogToFile'

const crawlWorkers = new Map<string, Worker>()
const crawlWorkersOrder2 = new Map<string, Worker>()
const otpWaitingLoginWorkers = new Map<string, Worker>()
const rateLimitWaitingLoginWorkers = new Map<string, Worker>()

let workerHandleDataViva88: Worker | null = null
let workerAutoLogin: Worker | null = null
let workerPlaceBet: Worker | null = null

export function submitOtpToLoginWorker(accountId: string, otp: string) {
  otpWaitingLoginWorkers.get(accountId)?.postMessage({ type: 'SubmitOtp', otp })
}

export function cancelOtpForLoginWorker(accountId: string) {
  otpWaitingLoginWorkers.get(accountId)?.postMessage({ type: 'CancelOtp' })
}

export function cancelRateLimitForLoginWorker(accountId: string) {
  rateLimitWaitingLoginWorkers.get(accountId)?.postMessage({ type: 'CancelRateLimit' })
}

export async function startWorker(
  account: AccountType,
  mainWindow: BrowserWindow,
  platformHandlers: Record<string, QueueHandler>
) {
  const handler = platformHandlers[account.platformName]
  if (!handler) return

  initLoginWorker(account, handler, mainWindow, platformHandlers)
  initCrawlWorkers(account.platformName, handler, mainWindow)
  initAutoLoginWorker(mainWindow)
  initPlaceBetWorker(mainWindow)
}

function initLoginWorker(
  account: AccountType,
  handler: QueueHandler,
  mainWindow: BrowserWindow,
  platformHandlers: Record<string, QueueHandler>
) {
  const worker = handler.createWorkerLogin({ workerData: 'worker' })
  worker.postMessage({ account })
  attachLoginWorkerEvents(worker, account, mainWindow, platformHandlers)
}

function attachLoginWorkerEvents(
  worker: Worker,
  account: AccountType,
  mainWindow: BrowserWindow,
  platformHandlers: Record<string, QueueHandler>
) {
  worker.on('message', ({ type, data }) => {
    switch (type) {
      case 'TooManyRequests':
        sendAccountUpdate(account.id, mainWindow)
        setTimeout(() => startWorker(account, mainWindow, platformHandlers), 8000)
        break

      case 'DataUpdateAccount':
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send('DataUpdateAccount', data)
        }
        break

      case 'LoginSuccess':
        handleLoginSuccess(account, data, mainWindow)
        break

      case 'MoveAccountToEnd':
        handleMoveAccountToEnd(account, mainWindow)
        break

      case 'RequireOtp':
        otpWaitingLoginWorkers.set(account.id, worker)
        mainWindow.webContents.send('Ps3838RequireOtp', {
          accountId: account.id,
          loginID: account.loginID,
          platformName: account.platformName,
          autoOtpFailed: Boolean(data?.autoOtpFailed)
        })
        break

      case 'OtpInvalid':
        mainWindow.webContents.send('Ps3838OtpInvalid', { accountId: data.accountId })
        break

      case 'OtpVerified':
        otpWaitingLoginWorkers.delete(account.id)
        mainWindow.webContents.send('Ps3838OtpVerified', { accountId: data.accountId })
        break

      case 'AccountLocked':
        otpWaitingLoginWorkers.delete(account.id)
        mainWindow.webContents.send('Ps3838AccountLocked', {
          accountId: data.accountId,
          loginID: data.loginID,
          platformName: data.platformName,
          failedAttempts: data.failedAttempts
        })
        break

      case 'AccountDisabled':
        otpWaitingLoginWorkers.delete(account.id)
        mainWindow.webContents.send('Ps3838AccountDisabled', {
          accountId: data.accountId,
          loginID: data.loginID,
          platformName: data.platformName
        })
        break

      case 'LoginNameExpired':
        otpWaitingLoginWorkers.delete(account.id)
        mainWindow.webContents.send('Ps3838LoginNameExpired', {
          accountId: data.accountId,
          loginID: data.loginID,
          platformName: data.platformName
        })
        break

      case 'RateLimited':
        rateLimitWaitingLoginWorkers.set(account.id, worker)
        mainWindow.webContents.send('Ps3838RateLimited', {
          accountId: data.accountId,
          loginID: data.loginID,
          platformName: data.platformName,
          retryAfterSec: data.retryAfterSec
        })
        break

      case 'RateLimitCleared':
        rateLimitWaitingLoginWorkers.delete(account.id)
        mainWindow.webContents.send('Ps3838RateLimitCleared', { accountId: data.accountId })
        break
    }
  })

  worker.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Login worker exit with code ${code}`)
    }

    otpWaitingLoginWorkers.delete(account.id)
    rateLimitWaitingLoginWorkers.delete(account.id)

    const handler = platformHandlers[account.platformName]
    handler.isProcessing = false
    handler.processor(mainWindow)

    console.log(`Worker Login Exit: [${account.loginID}]`)
  })

  worker.on('error', console.error)
}

function handleLoginSuccess(account: AccountType, payload: string, mainWindow: BrowserWindow) {
  console.log(`LoginSuccess to Crawl Viva88: [${account.loginID}]`)

  const worker = createCrawlWorkerByOrder(account.orderID)
  if (!worker) return

  worker.postMessage(payload)
  attachCrawlAfterLoginEvents(worker, account, mainWindow)
}

function createCrawlWorkerByOrder(orderID: number): Worker | null {
  switch (orderID) {
    case 1:
      return createWorkerCrawlViva88({ workerData: 'worker' })

    case 2:
      return createWorkerCrawlViva88_AccountOrder2({ workerData: 'worker' })

    default:
      console.warn(`Unsupported orderID: ${orderID}`)
      return null
  }
}

function attachCrawlAfterLoginEvents(
  worker: Worker,
  account: AccountType,
  mainWindow: BrowserWindow
) {
  worker.on('message', ({ type, data, platformName }) => {
    switch (type) {
      case 'DataUpdateAccount':
        sendAccountUpdate(account.id, mainWindow)
        break

      case 'CrawlDone':
        handleCrawlDone(platformName, mainWindow)
        break

      case 'DataViva88':
        handleDataViva88(data)
        break

      case 'LoggedAgain':
        safeHandleAccountLoggedAgain(account.id, mainWindow)
        break
    }
  })

  worker.on('exit', () => {
    console.log(`Worker Crawl Viva88 Exit: [${account.loginID}]`)
  })

  worker.on('error', console.error)
}

function safeHandleAccountLoggedAgain(accountId: string, mainWindow: BrowserWindow) {
  try {
    handleAccountLoggedAgain(accountId, mainWindow)
  } catch (error) {
    console.error('handleAccountLoggedAgain error:', error)
    systemLogToFile(`handleAccountLoggedAgain: ${(error as Error).message}`, 'Error')
  }
}

function handleDataViva88(data: any) {
  if (!workerHandleDataViva88) {
    workerHandleDataViva88 = createWorkerHandleDataViva88({ workerData: 'worker' })
  }

  workerHandleDataViva88.postMessage({ data })
}

function initCrawlWorkers(platformName: string, handler: QueueHandler, mainWindow: BrowserWindow) {
  startCrawlWorker(platformName, handler.createWorkerCrawl, crawlWorkers, mainWindow)
  startCrawlWorker(
    platformName,
    handler.createWorkerCrawl_AccountOrder2,
    crawlWorkersOrder2,
    mainWindow
  )
}

function startCrawlWorker(
  platformName: string,
  createWorkerFn: (options: WorkerOptions) => Worker,
  workerMap: Map<string, Worker>,
  mainWindow: BrowserWindow
) {
  if (workerMap.has(platformName)) return

  const worker = createWorkerFn({ workerData: 'worker' })
  workerMap.set(platformName, worker)

  worker.postMessage('Start')
  attachCrawlWorkerEvents(worker, platformName, workerMap, mainWindow)
}

function attachCrawlWorkerEvents(
  worker: Worker,
  platformName: string,
  workerMap: Map<string, Worker>,
  mainWindow: BrowserWindow
) {
  worker.on('message', ({ type, idAccount }) => {
    switch (type) {
      case 'DataUpdateAccount':
        sendAccountUpdate(idAccount, mainWindow)
        break

      case 'CrawlDone':
        handleCrawlDone(platformName, mainWindow)
        break

      case 'LoggedAgain':
        safeHandleAccountLoggedAgain(idAccount, mainWindow)
        break
    }
  })

  worker.on('exit', () => {
    console.log(`Worker Crawl ${platformName} Exit`)
    workerMap.delete(platformName)
  })

  worker.on('error', console.error)
}

function initAutoLoginWorker(mainWindow: BrowserWindow) {
  if (workerAutoLogin) return

  workerAutoLogin = createWorkerAutoLogin({ workerData: 'worker' })

  workerAutoLogin.on('message', async (accounts: AccountType[]) => {
    for (const acc of accounts) {
      Account.update(
        { id: acc.id },
        {
          status: STATUS_ACCOUNT.IN_PROGRESS,
          textLog: 'Waiting for login...'
        }
      )

      sendAccountUpdate(acc.id, mainWindow)
      enqueueWorker(acc, mainWindow)
    }
  })

  workerAutoLogin.on('exit', (code) => console.log('Exit WorkerAutoLogin...', code))

  workerAutoLogin.on('error', console.error)
}

function initPlaceBetWorker(mainWindow: BrowserWindow) {
  if (workerPlaceBet) return

  workerPlaceBet = createWorkerPlaceBet({ workerData: 'worker' })
  workerPlaceBet.postMessage('Start')

  workerPlaceBet.on('message', async ({ type, recordDB }) => {
    if (mainWindow.isDestroyed()) return

    switch (type) {
      case 'SwitchAccount':
        await handleSwitchAccount(recordDB, mainWindow)
        break

      case 'WaitingListDone':
        await sendCount('TotalWaitingList', WaitingList, mainWindow)
        break

      case 'ContraList':
        await sendCount('TotalContraList', ContraList, mainWindow)
        await handleContraList(recordDB, mainWindow)
        break

      case 'SuccessList':
        await sendCount('TotalSuccessList', SuccessList, mainWindow)
        await handleSuccessList(recordDB, mainWindow)
        break

      case 'FailedBetList':
        await sendCount('TotalFailedBetList', FailedBetList, mainWindow)
        await handleFailedBetList(recordDB, mainWindow)
        return
    }

    await handleBetList(recordDB, mainWindow)
  })

  workerPlaceBet.on('exit', (code) => console.log('Exit workerPlaceBet...', code))

  workerPlaceBet.on('error', console.error)
}
