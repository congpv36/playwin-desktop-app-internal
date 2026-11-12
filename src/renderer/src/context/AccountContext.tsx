import React, { createContext, useContext, useEffect, useState } from 'react'

import { AccountType } from '@shared/common/types'

const AccountContext = createContext<AccountType | null>(null)

const DelayLoginContext = createContext<Record<string, number>>({})

export const useAccountUpdate = () => useContext(AccountContext)

export const useDelayLoginAt = (accountId: string): number | undefined =>
  useContext(DelayLoginContext)[accountId]

export const AccountUpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [updateData, setUpdateData] = useState<AccountType | null>(null)
  const [delayLogins, setDelayLogins] = useState<Record<string, number>>({})

  useEffect(() => {
    const handleUpdate = (_: unknown, data: AccountType) => {
      setUpdateData(data)
    }

    window.electron.ipcRenderer.on('DataUpdateAccount', handleUpdate)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('DataUpdateAccount')
    }
  }, [])

  useEffect(() => {
    let hasLiveUpdate = false

    const removeListener = window.electron.ipcRenderer.on(
      'DelayLoginCountdown',
      (_, data: Record<string, number>) => {
        hasLiveUpdate = true
        setDelayLogins(data)
      }
    )

    window.electron.ipcRenderer.invoke('GetDelayLoginCountdown').then((data) => {
      if (!hasLiveUpdate) setDelayLogins(data)
    })

    return () => removeListener()
  }, [])

  return (
    <AccountContext.Provider value={updateData}>
      <DelayLoginContext.Provider value={delayLogins}>{children}</DelayLoginContext.Provider>
    </AccountContext.Provider>
  )
}
