import { Account, PerMatchLimit } from '@db/model'
import { BrowserWindow } from 'electron'

import { AccountType } from '@shared/common/types'

import { handleGetDataSportsBook } from '@/browserWindows/service/handleGetDataSportsBook'

interface UpdateAccountPayload {
  id: string
  loginID: string
  password: string
  secret?: string | null
  limitMethod: string
  limitType: string
  totalAmount: string
  totalCount: string
  customIP?: string
}

export function updateDataAccount(
  activeId: string,
  account: UpdateAccountPayload,
  mainWindow: BrowserWindow
): void {
  const existing = Account.findById(account.id) as AccountType
  if (!existing) return

  const {
    id,
    loginID,
    password,
    secret,
    limitMethod,
    limitType,
    totalAmount,
    totalCount,
    customIP
  } = account

  const credentialsChanged =
    existing.loginID !== loginID || existing.password !== password || existing.secret !== secret

  const normalizedCustomIP = customIP && !isValidIP(customIP.trim()) ? '' : customIP?.trim() || ''

  const baseUpdate = {
    loginID: loginID ? loginID.trim() : null,
    password: password ? password.trim() : null,
    secret: secret ? secret.trim() : null,
    customIP: normalizedCustomIP
  }

  const updateData = credentialsChanged
    ? {
        ...baseUpdate,
        currency: null,
        credit: '0',
        cashBalance: '0',
        outstanding: '0',
        givenCredit: '0',
        checkBoxAutoLogin: 0,
        autoLoginAttempts: 0,
        textLog: null,
        statusLogin: null,
        status: 'Login',
        cookie: null,
        socketUrl: null,
        host: null
      }
    : { ...baseUpdate, limitMethod, limitType, totalAmount, totalCount }

  Account.update({ id }, updateData)

  // === Handle PerMatchLimit update logic ===
  const methodChanged = limitMethod !== existing.limitMethod

  if (methodChanged) {
    PerMatchLimit.deleteMany({ idAccount: id })
  }

  // === Send latest sportsbook data to renderer ===
  const dataSportsBook = handleGetDataSportsBook(activeId)
  mainWindow.webContents.send('DataSportsBook', dataSportsBook)
}

function isValidIP(ip: string): boolean {
  const ipRegex =
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/
  return ipRegex.test(ip)
}
