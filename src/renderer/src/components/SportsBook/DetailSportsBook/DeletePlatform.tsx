import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@renderer/components/ui/alert-dialog'
import QuestionMarkCircle from '@renderer/icons/question-mark-circle'
import Xmark from '@renderer/icons/x-mark'

export default function DeletePlatform({ sportsBook }) {
  const { id: activeId } = useParams()
  const { t } = useTranslation(['main', 'layout'])

  const removePlatform = (namePlatform: string) => {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.includes(namePlatform)) {
        sessionStorage.removeItem(key)
        i--
      }
    }
    window.electron.ipcRenderer.send('DeletePlatform', { activeId, namePlatform })
  }
  return (
    <div className="flex">
      <AlertDialog>
        <AlertDialogTrigger>
          <div className="border border-transparent p-[5px] hover:rounded-full hover:bg-gray-200 transition-all duration-800 ease-in-out">
            <Xmark className="text-red-color cursor-pointer stroke-2 stroke-current" />
          </div>
        </AlertDialogTrigger>

        {/* updated styling/layout to match other notification popups */}
        <AlertDialogContent className="gap-0 p-0 w-[400px] h-[162px] bg-white rounded-lg border-0 shadow-lg overflow-hidden ">
          <AlertDialogHeader className="relative pt-6 pb-4">
            {/* icon + title + description layout like notifications */}
            <div className="flex gap-4 justify-center items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full flex items-center justify-center">
                  <QuestionMarkCircle className={`text-brand-color size-[53px]`} />
                </div>
              </div>

              <div className="min-w-0">
                <AlertDialogTitle className="text-lg font-semibold mb-1">
                  {t('confirmation', { ns: 'layout' })}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-relaxed text-text-default">
                  {t('are_you_sure_close_platform', { platform: sportsBook.platform })}
                </AlertDialogDescription>
              </div>

              {/* close X button kept visually similar to other popups */}
              <AlertDialogCancel className="border-none  bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none">
                <div className="flex justify-between ">
                  <button
                    type="button"
                    className="absolute top-[4px] right-[4px] font-normal block w-8 h-8 leading-none hover:bg-gray-200 hover:rounded-full"
                  >
                    ✕
                  </button>
                </div>
              </AlertDialogCancel>
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex gap-3 p-6 pt-4">
            <div className="flex-1">
              <AlertDialogCancel className="w-full h-10 rounded-md border border-border-default hover:bg-transparent  hover:border-gray-400">
                {t('cancel', { ns: 'layout' })}
              </AlertDialogCancel>
            </div>

            <div className="flex-1">
              <button
                type="button"
                onClick={() => removePlatform(sportsBook.platform)}
                className="w-full h-10 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                {t('delete', { ns: 'layout' })}
              </button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
