import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import SettingCheckBox from '@renderer/components/BetListContraListSuccessList/SettingCheckBox'
import TableData from '@renderer/components/BetListContraListSuccessList/TableData'
import TotalTicket from '@renderer/components/BetListContraListSuccessList/TotalTicket'
import { useCount } from '@renderer/context/CountContext'
import { addEmptyRows } from '@renderer/lib/addEmptyRows'
import { handleSaveReport } from '@renderer/lib/handleSaveReport'
import DownloadCloudIcon from '@renderer/icons/download-cloud-icon'

import { newDataTableEmpty } from '@shared/common/constants'
import { ROW_SIZE } from '@shared/common/constants'
import { SettingTableViewType, TicketInfoDataBetType } from '@shared/common/types'

const ListEventFailedBetList = () => {
  const { t } = useTranslation(['main', 'layout'])

  const [settings, setSettings] = useState({ clearWhenOver100: 0, enableScroll: 0 })
  const [dataTable, setDataTable] = useState<TicketInfoDataBetType[]>([])
  const { totalFailedBetList } = useCount()

  const handleCheckboxChange = (key: keyof typeof settings) => (checked: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: Number(checked) }))
  }

  const handleListData = useCallback(
    (_: unknown, newData: { dataPair: string }) => {
      const dataEvent = JSON.parse(newData.dataPair)
      const maxLength = settings.clearWhenOver100 ? 100 : 500

      setDataTable((prev) =>
        prev.length / ROW_SIZE >= maxLength
          ? [...dataEvent, newDataTableEmpty]
          : [...dataEvent, newDataTableEmpty, ...prev]
      )
    },
    [settings.clearWhenOver100]
  )

  useEffect(() => {
    const fetchSettings = async () => {
      const response: SettingTableViewType = await window.electron.ipcRenderer.invoke(
        'SettingViewTable',
        { tab: 'FailedBetList' }
      )
      setSettings({ clearWhenOver100: response.clear, enableScroll: response.scroll })
    }

    fetchSettings()
  }, [])

  useEffect(() => {
    const fetchFailedBetList = async () => {
      const data = await window.electron.ipcRenderer.invoke('GetFailedBetList')
      setDataTable(addEmptyRows(data))
    }

    fetchFailedBetList()
  }, [])

  useEffect(() => {
    window.electron.ipcRenderer.on('DataFailedBetList', handleListData)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('DataFailedBetList')
    }
  }, [handleListData])

  useEffect(() => {
    window.electron.ipcRenderer.send('UpdateSettingViewTable', {
      tab: 'FailedBetList',
      data: {
        clear: settings.clearWhenOver100,
        scroll: settings.enableScroll
      }
    })
  }, [settings])

  const handleSave = () => {
    handleSaveReport('FailedBetListReport', dataTable)
  }

  return (
    <div className="h-full flex flex-col text-sm">
      <div className="flex justify-between px-1 items-center min-w-[968px] border border-border-default h-[36px] mb-4 rounded-[6px] bg-hover-default ">
        <div className="flex gap-5">
          <SettingCheckBox settings={settings} handleCheckboxChange={handleCheckboxChange} />

          <div className="flex gap-1 items-center mr-5">
            <p>{t('total_label')}</p>
            <p>{dataTable.length / ROW_SIZE}</p>
            <TotalTicket totalTickets={totalFailedBetList} />
          </div>
        </div>
        <div
          className="bg-brand-color flex items-center justify-center cursor-pointer rounded-lg text-white "
          onClick={handleSave}
        >
          <div className="w-[126px] flex items-center justify-center py-[5px]">
            <DownloadCloudIcon />
            <p className="font-semibold ml-1">{t('save_report')}</p>
          </div>
        </div>
      </div>
      <TableData dataTable={dataTable} enableScroll={settings.enableScroll} scrollToTop />
    </div>
  )
}

export default React.memo(ListEventFailedBetList)
