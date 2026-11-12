import { createContext, useEffect, useState } from 'react'

import { SettingPerMatchLimitType } from '@shared/common/types'

interface ContextType {
  perMatchLimitSetting: {
    enable: number
    data: SettingPerMatchLimitType[]
  }

  showDisable: boolean
  setShowDisable: () => void

  listPlatform: SettingPerMatchLimitType[]
  setListPlatform: (value: SettingPerMatchLimitType) => void

  selectedPlatform: SettingPerMatchLimitType
  setSelectedPlatform: (value: SettingPerMatchLimitType) => void
}
export const PerMatchLimitSettingContext = createContext<ContextType | undefined>(undefined)

export const PerMatchLimitSettingProvider = ({ children }) => {
  const [perMatchLimitSetting, setPerMatchLimitSetting] = useState<{
    enable: number
    data: SettingPerMatchLimitType[]
  }>({
    enable: 0,
    data: [
      {
        id: 999999,
        namePlatform: 'Per-Match Details',
        limitMethod: 'TeamName',
        limitType: 'TotalCount',
        totalAmount: '5000',
        totalCount: '2'
      }
    ]
  })

  const [showDisable, setShowDisable] = useState<boolean>(false)
  const [listPlatform, setListPlatform] = useState<SettingPerMatchLimitType[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState<SettingPerMatchLimitType>({
    id: 999999,
    namePlatform: 'Per-Match Details',
    limitMethod: 'TeamName',
    limitType: 'TotalCount',
    totalAmount: '5000',
    totalCount: '2'
  })

  useEffect(() => {
    const fetchData = async () => {
      const result = (await window.electron.ipcRenderer.invoke('PerMatchLimitSetting')) as {
        enable: number
        data: SettingPerMatchLimitType[]
      }
      setPerMatchLimitSetting(result)
      setShowDisable(Boolean(result.enable))
      setListPlatform(result.data)
      if (result.data.length > 0) {
        setSelectedPlatform(result.data[0] as SettingPerMatchLimitType)
      }
    }

    fetchData()
  }, [])

  const contextValue = {
    perMatchLimitSetting,
    showDisable,
    setShowDisable: () => setShowDisable((prev) => !prev),
    listPlatform,
    setListPlatform: (value: SettingPerMatchLimitType) =>
      setListPlatform((prevList) =>
        prevList.map((platform) =>
          platform.id === selectedPlatform.id ? { ...platform, ...value } : platform
        )
      ),
    selectedPlatform,
    setSelectedPlatform: (value: SettingPerMatchLimitType) =>
      setSelectedPlatform((prev) => ({ ...prev, ...value }))
  }
  return (
    <PerMatchLimitSettingContext.Provider value={contextValue}>
      {children}
    </PerMatchLimitSettingContext.Provider>
  )
}
