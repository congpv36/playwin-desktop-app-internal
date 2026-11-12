import { MessagePort } from 'worker_threads'

import { Account, clearTable, RecordData } from '@db/model'

import { AccountType } from '@shared/common/types'
import { STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { accountLogToFile } from './accountLogToFile'
import { isAccountActive } from './checkAccount'

export const updateAccountAndNotify = (
  port,
  id: string,
  fields: RecordData,
  messageType: string = 'DataUpdateAccount'
) =>
  isAccountActive(id) &&
  Account.update({ id }, fields) &&
  port.postMessage({ type: messageType, idAccount: id })

export const exitAccountWithLog = (port, id: string, textLog: string) =>
  updateAccountAndNotify(port, id, { status: STATUS_ACCOUNT.EXIT, textLog })

type IsActiveFn = (id: string) => boolean

type LogAndNotifyOptions = {
  /** Extra DB fields to set alongside textLog. */
  fields?: RecordData
  messageType?: string
  /** Pass isAccountActive_AccountOrder2 for orderID 2 crawl workers. */
  isActiveFn?: IsActiveFn
  /**
   * When set, the Account.update query is the full guarded criteria
   * ({ id, orderID, status: LOGOUT, statusLogin: SUCCESS, platformName }) instead of
   * just { id } — the write is skipped if the account's state changed since it was
   * last checked. Only use this where the original call site relied on that guard.
   */
  strictMatch?: { orderID: number; platformName: string }
}

/**
 * Logs `message` to the account's log file, then — only if the account is still
 * active — writes it as textLog (plus any extra fields) on the account row and
 * notifies the renderer. Returns whether the DB update + notify actually happened
 * (false if inactive, or the guarded update matched no row).
 */
export const logAndNotify = async (
  port: MessagePort,
  account: AccountType,
  message: string,
  options: LogAndNotifyOptions = {}
): Promise<boolean> => {
  const {
    fields,
    messageType = 'DataUpdateAccount',
    isActiveFn = isAccountActive,
    strictMatch
  } = options

  // await accountLogToFile(account.platformName, account.loginID, message, 'Program')

  if (!isActiveFn(account.id)) return false

  const query: RecordData = strictMatch
    ? {
        id: account.id,
        orderID: strictMatch.orderID,
        status: STATUS_ACCOUNT.LOGOUT,
        statusLogin: STATUS_LOGIN.SUCCESS,
        platformName: strictMatch.platformName
      }
    : { id: account.id }

  const updated = Account.update(query, { textLog: message, ...fields })
  if (!updated) return false

  port.postMessage({ type: messageType, idAccount: account.id })
  return true
}

type RelogAndNotifyOptions = {
  isActiveFn?: IsActiveFn
  /** If set, calls clearTable(clearTablePlatform) after logging. */
  clearTablePlatform?: string
}

/**
 * Logs `message`, then — if the account is still active — sends a bare LoggedAgain
 * notification. For business-error responses (server returned ErrorCode/Message)
 * that don't touch the account row directly.
 */
export const logAndTriggerRelogin = async (
  port: MessagePort,
  account: AccountType,
  message: string,
  options: RelogAndNotifyOptions = {}
): Promise<void> => {
  const { isActiveFn = isAccountActive, clearTablePlatform } = options

  await accountLogToFile(account.platformName, account.loginID, message, 'Program')

  isActiveFn(account.id) && port.postMessage({ type: 'LoggedAgain', idAccount: account.id })

  if (clearTablePlatform) clearTable(clearTablePlatform)
}

/**
 * Catch-block helper: derives the error message, console.errors it, logs
 * `[ERROR] ${contextLabel}: ${message}` to file, then triggers relogin.
 */
export const logCrawlError = async (
  port: MessagePort,
  account: AccountType,
  error: unknown,
  contextLabel: string,
  options: RelogAndNotifyOptions = {}
): Promise<void> => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Error ${contextLabel}:`, message)

  await logAndTriggerRelogin(port, account, `[ERROR] ${contextLabel}: ${message}`, options)
}
