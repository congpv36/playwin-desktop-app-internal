import React, { createContext, useContext, useState } from 'react'

type CountContextType = {
  totalBetList: number
  totalWaitingList: number
  totalContraList: number
  totalSuccessList: number
  totalSuccessListShowOdd: number
  totalFailedBetList: number
  setTotalBetList: React.Dispatch<React.SetStateAction<number>>
  setTotalWaitingList: React.Dispatch<React.SetStateAction<number>>
  setTotalContraList: React.Dispatch<React.SetStateAction<number>>
  setTotalSuccessList: React.Dispatch<React.SetStateAction<number>>
  setTotalSuccessListShowOdd: React.Dispatch<React.SetStateAction<number>>
  setTotalFailedBetList: React.Dispatch<React.SetStateAction<number>>
}

const CountContext = createContext<CountContextType | null>(null)

export const useCount = () => {
  const ctx = useContext(CountContext)
  if (!ctx) throw new Error('useCount must be used within CountProvider')
  return ctx
}

export const CountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [totalBetList, setTotalBetList] = useState(0)
  const [totalWaitingList, setTotalWaitingList] = useState(0)
  const [totalContraList, setTotalContraList] = useState(0)
  const [totalSuccessList, setTotalSuccessList] = useState(0)
  const [totalSuccessListShowOdd, setTotalSuccessListShowOdd] = useState(0)
  const [totalFailedBetList, setTotalFailedBetList] = useState(0)

  return (
    <CountContext.Provider
      value={{
        totalBetList,
        totalWaitingList,
        totalContraList,
        totalSuccessList,
        totalSuccessListShowOdd,
        totalFailedBetList,
        setTotalBetList,
        setTotalWaitingList,
        setTotalContraList,
        setTotalSuccessList,
        setTotalSuccessListShowOdd,
        setTotalFailedBetList
      }}
    >
      {children}
    </CountContext.Provider>
  )
}
