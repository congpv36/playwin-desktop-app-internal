import { createContext, useEffect, useState } from 'react'

import { SettingLeagueFilterType, TableLeagueFilterType } from '@shared/common/types'

interface SchedulerContextType {
  editLeagueFilter: {
    enableEditLeagueFilter: boolean
    setEnableEditLeagueFilter: () => void
  }
  listLeague: { leagues: TableLeagueFilterType[] }
  filterType: { filterType: string; setFilterType: (value: string) => void }
  tableData: {
    listBlockLeagueTable: { id: number | string; league: string }[]
    setListBlockLeagueTable: (value: { id: number | string; league: string }[]) => void
    listAllowLeagueTable: { id: number | string; league: string }[]
    setListAllowLeagueTable: (value: { id: number | string; league: string }[]) => void
  }
  actionCheckBoxMajorLeague: {
    blockMajorLeague: number
    setBlockMajorLeague: (value: number) => void
    allowMajorLeague: number
    setAllowMajorLeague: (value: number) => void
  }
}
export const LeagueFilterContext = createContext<SchedulerContextType | undefined>(undefined)

export const LeagueFilterProvider = ({ children }) => {
  const [leagues, setLeagues] = useState<{ id: number; league: string }[]>([])
  const [filterType, setFilterType] = useState('Block')
  const [enableEditLeagueFilter, setEnableEditLeagueFilter] = useState(false)

  const [listBlockLeagueTable, setListBlockLeagueTable] = useState<
    { id: number | string; league: string }[]
  >([])
  const [listAllowLeagueTable, setListAllowLeagueTable] = useState<
    { id: number | string; league: string }[]
  >([])

  const [blockMajorLeague, setBlockMajorLeague] = useState(0)
  const [allowMajorLeague, setAllowMajorLeague] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dataFilter, dataLeague, dataBlockLeague, dataAllowLeague] = await Promise.all([
          window.electron.ipcRenderer.invoke(
            'GetDataSettingLeagueFilter'
          ) as Promise<SettingLeagueFilterType>,
          window.electron.ipcRenderer.invoke('GetDataLeague') as Promise<TableLeagueFilterType[]>,
          window.electron.ipcRenderer.invoke('GetDataBlockLeague') as Promise<
            TableLeagueFilterType[]
          >,
          window.electron.ipcRenderer.invoke('GetDataAllowLeague') as Promise<
            TableLeagueFilterType[]
          >
        ])

        setFilterType(dataFilter.filterType)
        setBlockMajorLeague(dataFilter.blockMajorLeague)
        setAllowMajorLeague(dataFilter.allowMajorLeague)
        setLeagues(dataLeague)
        setListBlockLeagueTable(dataBlockLeague)
        setListAllowLeagueTable(dataAllowLeague)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()

    return () => {
      window.electron.ipcRenderer.removeAllListeners('GetDataSettingLeagueFilter')
      window.electron.ipcRenderer.removeAllListeners('GetDataLeague')
      window.electron.ipcRenderer.removeAllListeners('GetDataBlockLeague')
      window.electron.ipcRenderer.removeAllListeners('GetDataAllowLeague')
    }
  }, [])

  const contextValue: SchedulerContextType = {
    editLeagueFilter: {
      enableEditLeagueFilter,
      setEnableEditLeagueFilter: () => setEnableEditLeagueFilter((prev) => !prev)
    },
    listLeague: { leagues },
    filterType: { filterType, setFilterType },
    tableData: {
      listBlockLeagueTable,
      setListBlockLeagueTable: (value) => setListBlockLeagueTable(value),
      listAllowLeagueTable,
      setListAllowLeagueTable: (value) => setListAllowLeagueTable(value)
    },
    actionCheckBoxMajorLeague: {
      blockMajorLeague,
      setBlockMajorLeague: (value) => setBlockMajorLeague(value),
      allowMajorLeague,
      setAllowMajorLeague: (value) => setAllowMajorLeague(value)
    }
  }

  return (
    <LeagueFilterContext.Provider value={contextValue}>{children}</LeagueFilterContext.Provider>
  )
}
