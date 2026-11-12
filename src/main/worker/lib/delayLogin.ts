import { Account } from '@db/model'
import { BrowserWindow } from 'electron'

import { AccountType } from '@shared/common/types'
import { STATUS_ACCOUNT } from '@shared/main/constants'

import { enqueueWorker } from '@/worker'

type PendingDelayLogin = {
  timer: NodeJS.Timeout
  loginAt: number
  platformName: string
  mainWindow: BrowserWindow
}

const pendingDelayLogins = new Map<string, PendingDelayLogin>()

export function getDelayLoginSnapshot(): Record<string, number> {
  const snapshot: Record<string, number> = {}
  for (const [accountId, { loginAt }] of pendingDelayLogins) {
    snapshot[accountId] = loginAt
  }
  return snapshot
}

export function hasDelayLogin(accountId: string): boolean {
  return pendingDelayLogins.has(accountId)
}

export function getDelayLoginAccountIds(platformName: string): string[] {
  return [...pendingDelayLogins]
    .filter(([, pending]) => pending.platformName === platformName)
    .map(([accountId]) => accountId)
}

function broadcastDelayLogin(mainWindow: BrowserWindow) {
  if (mainWindow.isDestroyed()) return
  mainWindow.webContents.send('DelayLoginCountdown', getDelayLoginSnapshot())
}

function takePending(accountId: string): PendingDelayLogin | undefined {
  const pending = pendingDelayLogins.get(accountId)
  if (!pending) return

  clearTimeout(pending.timer)
  pendingDelayLogins.delete(accountId)
  broadcastDelayLogin(pending.mainWindow)
  return pending
}

function runDelayedLogin(accountId: string) {
  const pending = takePending(accountId)
  if (!pending) return

  const { mainWindow } = pending
  if (mainWindow.isDestroyed()) return

  // Account may have been deleted, reset or logged in elsewhere while waiting
  const account = Account.findOne({ id: accountId }) as AccountType | undefined
  if (!account || account.statusDelete || account.status !== STATUS_ACCOUNT.IN_PROGRESS) return

  mainWindow.webContents.send(
    'DataUpdateAccount',
    Account.update({ id: accountId }, { textLog: 'Waiting for login...' })
  )
  enqueueWorker(account, mainWindow)
}

export function scheduleDelayLogin(
  account: AccountType,
  delaySec: number,
  mainWindow: BrowserWindow
) {
  takePending(account.id)

  mainWindow.webContents.send(
    'DataUpdateAccount',
    Account.update(
      { id: account.id },
      {
        status: STATUS_ACCOUNT.IN_PROGRESS,
        textLog: `Switched account. Login after ${delaySec}s...`
      }
    )
  )

  pendingDelayLogins.set(account.id, {
    timer: setTimeout(() => runDelayedLogin(account.id), delaySec * 1000),
    loginAt: Date.now() + delaySec * 1000,
    platformName: account.platformName,
    mainWindow
  })
  broadcastDelayLogin(mainWindow)
}

export function cancelDelayLogin(accountId: string): boolean {
  return Boolean(takePending(accountId))
}

export function cancelAllDelayLogins() {
  for (const accountId of [...pendingDelayLogins.keys()]) {
    takePending(accountId)
  }
}

// Skip the remaining wait and log in right away
export function loginNowDelayLogin(accountId: string) {
  runDelayedLogin(accountId)
}

// Drop the pending login and put the account back to the not-logged-in state,
// keeping its settings (auto login, bet, refresh) untouched
export function abortDelayLogin(accountId: string) {
  const pending = takePending(accountId)
  if (!pending || pending.mainWindow.isDestroyed()) return

  const account = Account.findOne({ id: accountId }) as AccountType | undefined
  if (!account || account.status !== STATUS_ACCOUNT.IN_PROGRESS) return

  pending.mainWindow.webContents.send(
    'DataUpdateAccount',
    Account.update({ id: accountId }, { status: STATUS_ACCOUNT.LOGIN, textLog: null })
  )
}
