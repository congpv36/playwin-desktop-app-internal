import { useTranslation } from 'react-i18next'
import * as AlertDialog from '@radix-ui/react-alert-dialog'

import QuestionMarkCircle from '@renderer/icons/question-mark-circle'

import { Button } from '@/components/ui/button'

export default function ClearAccountsDialog({ onClear }: { onClear: () => void }) {
  const { t } = useTranslation(['main', 'layout'])
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <Button
          variant="destructive"
          className="outline-none border bg-white text-black border-solid hover:bg-inherit border-gray-400 hover:border-blue-500 py-0 px-8 leading-none h-7 font-bold w-24"
        >
          {t('clear', { ns: 'layout' })}
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-md z-30 gap-0 p-0 w-80 h-[150px]  border-gray-400 shadow-[0px_4px_16px_rgba(17,17,26,0.1),_0px_8px_24px_rgba(17,17,26,0.1),_0px_16px_56px_rgba(17,17,26,0.1)]">
          <AlertDialog.Title className="font-bold flex justify-between p-2 bg-blue-50 text-sm rounded-t-lg ">
            {t('confirmation', { ns: 'layout' })}
          </AlertDialog.Title>
          <AlertDialog.AlertDialogDescription className="h-[70px]  flex justify-center items-center flex-1 py-1 ">
            <QuestionMarkCircle className="text-blue-500  mr-1" />
            <span className="text-black text-sm font-medium">{t('confirm_delete_item')}</span>
          </AlertDialog.AlertDialogDescription>
          <div className="h-[35px] gap-3 mt-4 rounded-b-lg p-0 bg-gray-100  flex items-center justify-between px-6">
            <AlertDialog.Action asChild>
              <Button
                variant="destructive"
                className="h-6 w-20 bg-white text-black font-semibold rounded border border-gray-400 hover:border-blue-400 hover:bg-white"
                onClick={onClear}
              >
                {t('yes', { ns: 'layout' })}
              </Button>
            </AlertDialog.Action>
            <AlertDialog.Cancel asChild>
              <Button
                variant="outline"
                className="h-6 w-20 bg-white text-black font-semibold rounded border border-gray-400 hover:border-blue-400 hover:bg-white"
              >
                {t('no', { ns: 'layout' })}
              </Button>
            </AlertDialog.Cancel>

            <AlertDialog.Cancel asChild>
              <Button
                variant="outline"
                className="h-6 w-20 bg-white text-black font-semibold rounded border border-gray-400 hover:border-blue-400 hover:bg-white"
              >
                {t('cancel', { ns: 'layout' })}
              </Button>
            </AlertDialog.Cancel>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
