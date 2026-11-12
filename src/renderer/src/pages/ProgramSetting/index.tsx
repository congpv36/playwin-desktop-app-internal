import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router-dom'

import { SettingProvider } from '@renderer/context/SettingContext'

import { PROGRAM_SETTING_LIST } from '@shared/renderer/constants'

export default function ProgramSetting() {
  const { t } = useTranslation('layout')

  return (
    <SettingProvider>
      <div className="h-[calc(100vh-100px)] w-full bg-layout-color">
        <div className="m-[12px] h-full flex flex-col">
          <div className="mb-3">
            <div className="flex justify-between">
              <p className="font-bold whitespace-nowrap">{t('program_settings')}</p>
            </div>

            <div className="border border-border-default bg-border-default text-[#717680]  rounded-[6px] mt-[14px] px-[3px] flex gap-[3px] h-[36px] items-center ">
              <div className="flex gap-[3px] scrollbar-hide">
                {PROGRAM_SETTING_LIST.map(({ id, key }) => (
                  <NavLink
                    key={id}
                    to={id}
                    className={({ isActive }) => `
                 px-[8px] h-[28px] text-sm flex justify-center items-center rounded-[6px] cursor-pointer shadow-2xl leading-none text-text-default
                  ${isActive ? 'bg-white font-semibold' : 'hover:bg-white'}`}
                    style={{ minWidth: '106px' }}
                  >
                    {(t as (k: string) => string)(key)}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </div>
    </SettingProvider>
  )
}
