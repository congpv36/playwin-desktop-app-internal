import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router-dom'

import AddSportsBook from '@renderer/components/SportsBook/AddSportsBook'
import { PopupSwitchBetMode } from '@renderer/components/SportsBook/PopupSwitchBetMode'
import QuickActions from '@renderer/components/SportsBook/QuickActions'
import { SwitchCustom } from '@renderer/components/ui/switch'

import { SPORTS_BOOK_LIST } from '@shared/common/constants'
import { SettingType } from '@shared/common/types'

export default function SportsBook() {
  const { t } = useTranslation('layout')
  const [showPopup, setShowPopup] = useState(false)
  const [isChecked, setIsChecked] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const setting = (await window.electron.ipcRenderer.invoke('GetDataSetting')) as SettingType
      if (setting.isBetByOtherAcc === 0) {
        setIsChecked(false)
      } else {
        setIsChecked(true)
      }
    }
    fetchData()

    return () => {
      window.electron.ipcRenderer.removeAllListeners('GetDataSetting')
    }
  }, [])

  useEffect(() => {
    const handleSwitchBetMode = (_, isBetByOtherAcc: number) => {
      if (isBetByOtherAcc === 0) {
        setIsChecked(false)
      } else {
        setIsChecked(true)
      }
    }

    window.electron.ipcRenderer.on('onSwitchBetMode', handleSwitchBetMode)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('onSwitchBetMode')
    }
  }, [])

  return (
    <>
      <div className="w-full bg-layout-color h-[calc(100vh-48px)]">
        <div className="mt-[4px] mx-[12px] h-full flex flex-col">
          <div className="mb-[10px]">
            <div className="flex justify-between items-center ">
              <p className=" font-bold">{t('sports_book')}</p>
              <div className="flex items-center">
                <div className="w-[250px] flex justify-center items-center gap-2 mr-[12px] cursor-pointer">
                  <SwitchCustom onCheckedChange={() => setShowPopup(true)} checked={isChecked} />
                  <span className=" text-base font-semibold">{t('switch_bet_mode')}</span>
                </div>
                <QuickActions />
                <AddSportsBook />
              </div>
            </div>
            <div className="min-w-[600px] border border-border-default bg-border-default text-[#717680]  rounded-[6px] mt-[10px] px-[3px] flex gap-[3px] h-[36px] items-center ">
              {SPORTS_BOOK_LIST.map(({ id, label }) => (
                <NavLink
                  key={id}
                  to={id}
                  className={({ isActive }) => `
                  w-[110px] h-[28px] text-sm flex justify-center items-center rounded-[6px] cursor-pointer shadow-2xl leading-none text-text-default
                  ${isActive ? 'bg-white font-semibold' : 'hover:bg-white'}`}
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="flex-1 h-full overflow-auto">
            <div className="">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
      {showPopup && <PopupSwitchBetMode setShowAlertDialog={setShowPopup} />}
    </>
  )
}
