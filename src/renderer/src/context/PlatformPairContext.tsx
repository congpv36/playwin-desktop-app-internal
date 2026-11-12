import { createContext, useEffect, useState } from 'react'

import { PlatformPairType } from '@shared/common/types'
import { PlatformType } from '@shared/common/types'
interface ContextType {
  ListPlatform: {
    listPlatform: PlatformType[]
    setListPlatform: (value: PlatformType[]) => void
  }
  Combination: {
    listPlatformPair: PlatformPairType[]
    setListPlatformPair: (value: PlatformPairType[]) => void

    currentPlatformPair: PlatformPairType
    setCurrentPlatformPair: (value: PlatformPairType) => void
  }
}
export const PlatformPairContext = createContext<ContextType>({
  ListPlatform: {
    listPlatform: [],
    setListPlatform: () => {}
  },
  Combination: {
    listPlatformPair: [],
    setListPlatformPair: () => {},

    currentPlatformPair: {} as PlatformPairType,
    setCurrentPlatformPair: () => {}
  }
})

export const PlatformPairProvider = ({ children }) => {
  const [listPlatform, setListPlatform] = useState<PlatformType[]>([])
  const [listPlatformPair, setListPlatformPair] = useState<PlatformPairType[]>([])
  const [currentPlatformPair, setCurrentPlatformPair] = useState<PlatformPairType>(
    {} as PlatformPairType
  )

  useEffect(() => {
    const fetchData = async () => {
      const listPlatform = await window.electron.ipcRenderer.invoke('GetSportBook1SportBook2')
      setListPlatform(listPlatform)
    }
    fetchData()
  }, [])

  useEffect(() => {
    const matchedAccountPair = listPlatformPair.find(
      (accountPair) => accountPair.id === currentPlatformPair.id
    )

    if (matchedAccountPair) {
      setCurrentPlatformPair(matchedAccountPair)
    }
  }, [listPlatformPair])

  useEffect(() => {
    const fetchListPlatformPair = async () => {
      const data = (await window.electron.ipcRenderer.invoke(
        'GetListPlatformPair'
      )) as PlatformPairType[]

      setListPlatformPair(data)
      if (data.length) {
        setCurrentPlatformPair(data[0])
      }
    }
    fetchListPlatformPair()
  }, [])

  const contextValue: ContextType = {
    ListPlatform: {
      listPlatform,
      setListPlatform: (value) => setListPlatform(value)
    },
    Combination: {
      listPlatformPair,
      setListPlatformPair: (value) => setListPlatformPair(value),
      currentPlatformPair,
      setCurrentPlatformPair: (value) => setCurrentPlatformPair(value)
    }
  }
  return (
    <PlatformPairContext.Provider value={contextValue}>{children}</PlatformPairContext.Provider>
  )
}
