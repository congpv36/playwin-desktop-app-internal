import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SettingType } from '@shared/common/types'

import { Checkbox } from '../ui/checkbox'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

interface ConfirmationProps {
  setShowAlertDialog: (open: boolean) => void
}

export const PopupSwitchBetMode: React.FC<ConfirmationProps> = ({ setShowAlertDialog }) => {
  const { t } = useTranslation('layout')
  const [isChecked, setIsChecked] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const setting = (await window.electron.ipcRenderer.invoke('GetDataSetting')) as SettingType
      setIsChecked(setting.isBetByOtherAcc === 1)
    }
    fetchData()

    return () => {
      window.electron.ipcRenderer.removeAllListeners('GetDataSetting')
    }
  }, [])

  const handleSave = () => {
    window.electron.ipcRenderer.send('SaveSettingPopupSwitchBetMode', {
      isBetByOtherAcc: isChecked ? 1 : 0
    })
    setShowAlertDialog(false)
  }

  return (
    <AlertDialog open={true} onOpenChange={setShowAlertDialog}>
      <AlertDialogContent className="rounded-[12px] w-[330px] border-none p-1 px-[10px] pb-[20px]">
        <AlertDialogHeader className="flex-1 ">
          <AlertDialogTitle className="flex justify-between p-2 text-base font-bold rounded-t-lg">
            <p>{t('switch_bet_mode')}</p>
          </AlertDialogTitle>
          <AlertDialogDescription className="flex-1 flex items-center justify-center py-3 px-9 ">
            <div className="flex flex-column justify-center items-center">
              <label htmlFor="BetByDifferentAccount" className="mr-2 text-base">
                {t('bet_by_different_account')}
              </label>
              <Checkbox
                id="BetByDifferentAccount"
                checked={isChecked}
                onCheckedChange={(checked) => setIsChecked(checked as boolean)}
                className="accent-brand-color cursor-pointer size-5"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="rounded-b-lg gap-4 items-center flex justify-between px-4">
          <AlertDialogCancel
            onClick={() => setShowAlertDialog(false)}
            className="flex justify-center items-center text-sm bg-transparent flex-1 h-[36px] hover:bg-transparent font-semibold border border-border-default hover:border-gray-400 "
          >
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            className=" flex justify-center items-center bg-brand-color text-sm border-none flex-1 h-[36px] font-semibold hover:bg-brand-color/90 text-white"
            onClick={handleSave}
          >
            {t('save')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
