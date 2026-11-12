import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Main } from '@renderer/components/SportsBook/DetailSportsBook/QuickActions/AccountList/Main'
import { AlertDialog, AlertDialogContent } from '@renderer/components/ui/alert-dialog'
import { DropdownMenuItem } from '@renderer/components/ui/dropdown-menu'
import UsersICon from '@renderer/icons/users'

import { SportsBookType } from '@shared/common/types'

function AccountList({ sportsBook }: { sportsBook: SportsBookType }) {
  const { t } = useTranslation('main')

  const [openModalSetting, setOpenModalSetting] = useState(false)

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault()
          setOpenModalSetting(true)
        }}
        className=" cursor-pointer focus:bg-hover-default focus:font-semibold px-[4px] py-[4px] rounded-[4px]"
        onClick={() => setOpenModalSetting(true)}
      >
        {t('account_list')}
      </DropdownMenuItem>

      <AlertDialog open={openModalSetting}>
        <AlertDialogContent className="p-0 px-[16px] rounded-[12px] h-5/6 w-[99.3%] min-w-[880px] border-border-default bg-white flex flex-col gap-0">
          <header className="flex pt-[16px]">
            <UsersICon />
            <div className="ml-[16px] flex flex-col">
              <div className="flex justify-between">
                <p className="text-lg font-semibold"> {t('account_list')}</p>
                <button
                  className="absolute top-[6px] right-[6px] font-normal block w-9 h-9 leading-none text-[#85888E] hover:bg-gray-200 hover:rounded-full"
                  onClick={() => setOpenModalSetting(false)}
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-[#94979C]">{t('note_account_list')}</p>
            </div>
          </header>

          <main className="flex-1 min-h-0 h-[calc(100vh-150px)] overflow-hidden">
            <Main setOpenModalSetting={setOpenModalSetting} sportsBook={sportsBook} />
          </main>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default AccountList
