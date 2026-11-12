import { createContext, useEffect, useState } from 'react'

import { ListRangePlatformType, OtherSettingType } from '@shared/common/types'

interface ContextType {
  RangePlatform: {
    listRangePlatform: ListRangePlatformType[]
    setListRangePlatform: React.Dispatch<React.SetStateAction<ListRangePlatformType[]>>
  }
  OtherSetting: {
    otherSetting: OtherSettingType
    setOtherSetting: (value: OtherSettingType) => void
  }
}

export const BetSettingContext = createContext<ContextType>({
  RangePlatform: {
    listRangePlatform: [],
    setListRangePlatform: () => {}
  },
  OtherSetting: {
    otherSetting: {
      id: 999,
      isOther: 0,
      isBetUnderSelected: 0,
      isBetOverSelected: 0,
      isBetPutSelected: 0,
      isBetEatSelected: 0
    },
    setOtherSetting: () => {}
  }
})

export const BetSettingProvider = ({ children }) => {
  const [listRangePlatform, setListRangePlatform] = useState<ListRangePlatformType[]>([])
  const [otherSetting, setOtherSetting] = useState<OtherSettingType>({
    id: 999,
    isOther: 0,
    isBetUnderSelected: 0,
    isBetOverSelected: 0,
    isBetPutSelected: 0,
    isBetEatSelected: 0
  })

  useEffect(() => {
    const fetchData = async () => {
      const { rangePlatforms, otherSetting } =
        await window.electron.ipcRenderer.invoke('GetRangePlatform')

      setListRangePlatform(rangePlatforms)
      setOtherSetting(otherSetting)
    }
    fetchData()
  }, [])

  const contextValue: ContextType = {
    RangePlatform: {
      listRangePlatform,
      setListRangePlatform: (value) => {
        if (typeof value === 'function') {
          setListRangePlatform((prev) =>
            (value as (prev: ListRangePlatformType[]) => ListRangePlatformType[])(prev)
          )
        } else {
          setListRangePlatform(value)
        }
      }
    },
    OtherSetting: {
      otherSetting,
      setOtherSetting: (value) => setOtherSetting(value)
    }
  }
  return <BetSettingContext.Provider value={contextValue}>{children}</BetSettingContext.Provider>
}
