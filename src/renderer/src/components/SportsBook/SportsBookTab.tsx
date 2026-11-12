import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import DetailSportsBook from '@renderer/components/SportsBook/DetailSportsBook'
import { AccountUpdateProvider } from '@renderer/context/AccountContext'

import { DataPlatformType } from '@shared/common/types'

export const SportsBookTab = () => {
  const { id: activeId } = useParams()

  const [dataSportBook, setDataSportBook] = useState<DataPlatformType[]>([])

  const fetchData = async () => {
    const data = await window.electron.ipcRenderer.invoke('GetDataSportsBook', activeId)
    setDataSportBook(data)
  }

  useEffect(() => {
    fetchData()

    const updateListener = (_, data) => {
      setDataSportBook(data)
    }

    const dataListener = (_, newData: DataPlatformType[]) => {
      if (activeId) {
        fetchData()
      } else {
        setDataSportBook(newData)
      }
    }

    window.electron.ipcRenderer.on('GetDataSportsBookUpdate', updateListener)
    window.electron.ipcRenderer.on('DataSportsBook', dataListener)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('GetDataSportsBookUpdate')
      window.electron.ipcRenderer.removeAllListeners('DataSportsBook')
    }
  }, [activeId])

  useEffect(() => {
    if (!activeId) return

    window.electron.ipcRenderer.send('UpdateSportsBookProviders', {
      activeSportsBook: activeId
    })
  }, [activeId])

  return (
    <div className="w-full">
      <div className="overflow-y-auto custom-scrollbar min-w-max flex-column ">
        <AccountUpdateProvider>
          {dataSportBook.map((sportsBook) => (
            <DetailSportsBook key={sportsBook.id} sportsBook={sportsBook} />
          ))}
        </AccountUpdateProvider>
      </div>
    </div>
  )
}
