import React, { useCallback } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import SettingCheckBox from '@renderer/components/BetListContraListSuccessList/SettingCheckBox'
import TableData from '@renderer/components/BetListContraListSuccessList/TableData'
import TotalTicket from '@renderer/components/BetListContraListSuccessList/TotalTicket'
import { useCount } from '@renderer/context/CountContext'
import { addEmptyRows } from '@renderer/lib/addEmptyRows'
import { handleSaveReport } from '@renderer/lib/handleSaveReport'
import DownloadCloudIcon from '@renderer/icons/download-cloud-icon'

import { ROW_SIZE } from '@shared/common/constants'
import { newDataTableEmpty } from '@shared/common/constants'
import {
  SettingTableViewType,
  TicketInfoDataBetType,
  WaitingSuccessContraDBType
} from '@shared/common/types'

type ListEventSuccessListProps = {
  isShowOdd?: boolean
}

const ListEventSuccessList = ({ isShowOdd = false }: ListEventSuccessListProps) => {
  const { t } = useTranslation(['main', 'layout'])
  const [settings, setSettings] = useState({ clearWhenOver100: 0, enableScroll: 0 })
  const [dataTable, setDataTable] = useState<TicketInfoDataBetType[]>([])
  const { totalSuccessList, totalSuccessListShowOdd } = useCount()

  const getListChannel = isShowOdd ? 'GetSuccessListShowOdd' : 'GetSuccessList'
  const dataChannel = isShowOdd ? 'DataSuccessListShowOdd' : 'DataSuccessList'
  const totalTickets = isShowOdd ? totalSuccessListShowOdd : totalSuccessList

  const handleCheckboxChange = (key: keyof typeof settings) => (checked: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: Number(checked) }))
  }

  const handleListData = useCallback(
    (_: unknown, newData: WaitingSuccessContraDBType) => {
      const dataEvent = JSON.parse(newData.dataPair)

      setDataTable((prev) => {
        if (settings.clearWhenOver100 === 1 && prev.length / ROW_SIZE >= 100) {
          return [...dataEvent, newDataTableEmpty]
        }

        return [...dataEvent, newDataTableEmpty, ...prev]
      })
    },
    [settings.clearWhenOver100]
  )

  useEffect(() => {
    const fetchSettings = async () => {
      const response: SettingTableViewType = await window.electron.ipcRenderer.invoke(
        'SettingViewTable',
        {
          tab: 'SuccessList'
        }
      )
      setSettings({ clearWhenOver100: response.clear, enableScroll: response.scroll })
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    const fetchBetList = async () => {
      const data = await window.electron.ipcRenderer.invoke(getListChannel)
      setDataTable(isShowOdd ? data : addEmptyRows(data))
    }

    fetchBetList()
  }, [getListChannel])

  useEffect(() => {
    window.electron.ipcRenderer.on(dataChannel, handleListData)

    return () => {
      window.electron.ipcRenderer.removeAllListeners(dataChannel)
    }
  }, [dataChannel, handleListData])

  useEffect(() => {
    window.electron.ipcRenderer.send('UpdateSettingViewTable', {
      tab: 'SuccessList',
      data: {
        clear: settings.clearWhenOver100,
        scroll: settings.enableScroll
      }
    })
  }, [settings])

  const handleSave = () => {
    handleSaveReport('SuccessListReport', dataTable)
  }

  return (
    <div className="h-full flex flex-col text-sm">
      <div className="flex justify-between px-1 items-center min-w-[968px] border border-border-default h-[36px] mb-4 rounded-[6px] bg-hover-default ">
        <div className="flex gap-5">
          <SettingCheckBox settings={settings} handleCheckboxChange={handleCheckboxChange} />
          <div className="flex gap-1 mr-5">
            <p>{t('total_label')}</p>
            <p>{isShowOdd ? totalTickets : dataTable.length / ROW_SIZE}</p>
            <TotalTicket totalTickets={totalTickets} />
          </div>
        </div>
        <div
          className="bg-brand-color flex items-center justify-center cursor-pointer rounded-lg text-white "
          onClick={handleSave}
        >
          <div className="w-[126px] flex items-center justify-center py-[5px]">
            <DownloadCloudIcon />
            <p className="font-semibold text-sm ml-1">{t('save_report')}</p>
          </div>
        </div>
      </div>

      <TableData dataTable={dataTable} enableScroll={settings.enableScroll} scrollToTop />
    </div>
  )
}

export default React.memo(ListEventSuccessList)
