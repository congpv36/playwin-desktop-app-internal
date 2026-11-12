import { createContext, useEffect, useState } from 'react'

import { LeaguePointRandomizerType, TableLeagueFilterType } from '@shared/common/types'

interface SchedulerContextType {
  leagues: TableLeagueFilterType[]
  selectedLeague: LeaguePointRandomizerType
  setSelectedLeague: React.Dispatch<React.SetStateAction<LeaguePointRandomizerType>>
  listSelectedLeague: LeaguePointRandomizerType[]
  setListSelectedLeague: React.Dispatch<React.SetStateAction<LeaguePointRandomizerType[]>>
}
export const LeaguePointRandomizerContext = createContext<SchedulerContextType | undefined>(
  undefined
)

export const LeaguePointRandomizerProvider = ({ children }) => {
  const [leagues, setLeagues] = useState<TableLeagueFilterType[]>([])
  const [selectedLeague, setSelectedLeague] = useState<LeaguePointRandomizerType>(
    {} as LeaguePointRandomizerType
  )
  const [listSelectedLeague, setListSelectedLeague] = useState<LeaguePointRandomizerType[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dataLeague, dataLeaguePointRandomizer] = await Promise.all([
          window.electron.ipcRenderer.invoke('GetDataLeague'),
          window.electron.ipcRenderer.invoke('LeaguePointRandomizer')
        ])

        setLeagues(dataLeague as TableLeagueFilterType[])
        setListSelectedLeague(dataLeaguePointRandomizer as LeaguePointRandomizerType[])
        setSelectedLeague(dataLeaguePointRandomizer?.[0] ?? null)
      } catch (error) {
        setLeagues([])
        setListSelectedLeague([])
      }
    }

    fetchData()

    return () => {
      window.electron.ipcRenderer.removeAllListeners('GetDataLeague')
      window.electron.ipcRenderer.removeAllListeners('LeaguePointRandomizer')
    }
  }, [])

  const contextValue: SchedulerContextType = {
    leagues,
    selectedLeague,
    setSelectedLeague,
    listSelectedLeague,
    setListSelectedLeague
  }

  return (
    <LeaguePointRandomizerContext.Provider value={contextValue}>
      {children}
    </LeaguePointRandomizerContext.Provider>
  )
}
