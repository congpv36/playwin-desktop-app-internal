import { useTranslation } from 'react-i18next'

import LogOut02 from '@renderer/icons/log-out-02'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

export function ConfirmLogOut({ openConfirmLogOut, setOpenConfirmLogOut }) {
  const { t } = useTranslation('layout')

  const quitApp = () => {
    window.electron.ipcRenderer.send('QuitApp')
  }

  return (
    <AlertDialog open={openConfirmLogOut} onOpenChange={setOpenConfirmLogOut}>
      <AlertDialogContent className="rounded-[12px] h-[170px] w-[328px] border-none bg-white p-[20px] ">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center relative">
            <LogOut02 />
            <div className="ml-[16px] flex flex-col">
              <div className="flex justify-between  ">
                <p className="font-bold">{t('quit_program')}</p>
                <button
                  className="absolute top-[-16px] right-[-16px] font-normal block w-8 h-8 leading-none hover:bg-gray-200 hover:rounded-full"
                  onClick={() => setOpenConfirmLogOut(false)}
                >
                  ✕
                </button>
              </div>
            </div>
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter className=" flex gap-[20px] items-end">
          <AlertDialogAction
            className="bg-[#F04438] text-sm border-none flex-1 h-[37px] font-semibold hover:bg-[#f04438e0] flex justify-center items-center"
            onClick={quitApp}
          >
            {t('yes')}
          </AlertDialogAction>
          <AlertDialogCancel
            onClick={() => setOpenConfirmLogOut(false)}
            className="bg-white text-sm border border-border-default flex-1 h-[37px] font-semibold  hover:bg-white hover:border-gray-700 flex justify-center items-center"
          >
            {t('cancel')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
