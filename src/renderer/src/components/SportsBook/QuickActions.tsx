import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import ScheduledLoginLogoutSetting from '@renderer/components/SportsBook/ScheduledLoginLogoutSetting'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import ChevronDown from '@renderer/icons/chevron-down'
import LogIn from '@renderer/icons/log-in'
import LogOut from '@renderer/icons/log-out'
import Settings from '@renderer/icons/settings'

export default function QuickActions() {
  const { t } = useTranslation('main')
  const { id: activeId } = useParams()

  const [isScheduledLoginLogoutSettingOpen, setScheduledLoginLogoutSettingOpen] = useState(false)
  const handleLoginAll = () => {
    window.electron.ipcRenderer.send('LoginAll', { activeSportsBook: activeId })
  }

  const handleLogoutAll = () => {
    window.electron.ipcRenderer.send('LogoutAll', { activeSportsBook: activeId })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={`hover:border-brand-color w-[145px] h-[36px] text-sm rounded-[8px] border border-border-default mr-[12px] hover:opacity-90 bg-white  `}
        >
          <div className="flex items-center justify-center gap-[4px]">
            <p>{t('quick_actions')}</p>
            <ChevronDown className="size-2.5 w-4" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="ml-[-75px] rounded-[8px] w-[250px]  border border-border-default shadow-lg bg-white p-[2px]">
          <DropdownMenuItem
            className="text-blue-color text-sm font-semibold h-[30px] focus:text-blue-color cursor-pointer border border-transparent focus:rounded-[4px] focus:bg-hover-default"
            onClick={handleLoginAll}
          >
            <LogIn />
            <span className="ml-[6px]">{t('log_in_all')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-color  text-sm font-semibold h-[30px] focus:text-red-color cursor-pointer border border-transparent focus:rounded-[4px] focus:bg-hover-default"
            onClick={handleLogoutAll}
          >
            <LogOut />
            <span className="ml-[6px]">{t('log_out_all')}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-[2px] bg-border-default" />

          <DropdownMenuItem
            className=" text-sm font-semibold h-[30px]  cursor-pointer border border-transparent focus:rounded-[4px] focus:bg-hover-default"
            onClick={() => setScheduledLoginLogoutSettingOpen(true)}
          >
            <Settings className="w-[16px] h-[16px]" />
            <span className="ml-[6px]">{t('scheduled_log_in_log_out')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isScheduledLoginLogoutSettingOpen && (
        <ScheduledLoginLogoutSetting onClose={() => setScheduledLoginLogoutSettingOpen(false)} />
      )}
    </>
  )
}
