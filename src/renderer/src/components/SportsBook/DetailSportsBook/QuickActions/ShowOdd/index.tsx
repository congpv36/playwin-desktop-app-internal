import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AlertDialog, AlertDialogContent } from '@renderer/components/ui/alert-dialog'
import { DropdownMenuItem } from '@renderer/components/ui/dropdown-menu'

import { SportsBookType } from '@shared/common/types'

import MainShowOdd from './MainShowOdd'

function ShowOdd({ sportsBook }: { sportsBook: SportsBookType }) {
  const { t } = useTranslation(['main', 'layout'])
  const [openModalSetting, setOpenModalSetting] = useState(false)

  const closeModal = () => {
    setOpenModalSetting(false)
    window.electron.ipcRenderer.send('InActivePlatformShowOdds')
  }

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault()
          setOpenModalSetting(true)
        }}
        className=" cursor-pointer focus:bg-hover-default focus:font-semibold px-[4px] py-[4px] rounded-[4px]"
      >
        {t('show_odds', { ns: 'layout' })}
      </DropdownMenuItem>

      <AlertDialog open={openModalSetting}>
        <AlertDialogContent className="p-0 rounded-[12px] h-[90%] w-[880px] flex flex-col gap-0 border-none">
          <header>
            <div className="flex items-center justify-center pt-5">
              <div className="font-semibold text-lg leading-none ">
                {t('show_odds', { ns: 'layout' })} - {sportsBook.platform}
              </div>
            </div>
            <button
              className="absolute top-[6px] right-[6px] font-normal block w-9 h-9 leading-none  hover:bg-gray-200 hover:rounded-full"
              onClick={closeModal}
            >
              ✕
            </button>
          </header>

          <main className="flex-1 pt-[30px] pb-[12px] overflow-hidden">
            <MainShowOdd sportsBook={sportsBook} />
          </main>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default ShowOdd
