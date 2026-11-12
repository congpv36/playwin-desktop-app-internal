import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import i18n from '@renderer/i18n/i18n'
import AppSidebar from '@renderer/layouts/AppSidebar'
import AppTopBar from '@renderer/layouts/AppTopBar'

import { SettingType } from '@shared/common/types'

const LayoutContent: React.FC = () => {
  useEffect(() => {
    const fetchData = async () => {
      const setting = (await window.electron.ipcRenderer.invoke('GetDataSetting')) as SettingType
      await i18n.changeLanguage(setting.language)
    }

    fetchData()

    return () => {
      window.electron.ipcRenderer.removeAllListeners('GetDataSetting')
    }
  }, [])

  return (
    <div className="min-h-screen">
      <div className="flex h-screen">
        <AppSidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <AppTopBar />

          <div className="mt-[32px] flex-1">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

const AppLayout: React.FC = () => {
  return <LayoutContent />
}

export default AppLayout
