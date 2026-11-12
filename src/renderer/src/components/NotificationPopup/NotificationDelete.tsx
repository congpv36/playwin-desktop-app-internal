import { useTranslation } from 'react-i18next'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

interface AlertErrorProps {
  showAlertDialog: boolean
  setShowAlertDialog: (open: boolean) => void
  title: string
  messageError: string
  ReactElement: React.ReactElement
  handleYes: () => void
}

export const NotificationDelete: React.FC<AlertErrorProps> = ({
  showAlertDialog,
  setShowAlertDialog,
  title,
  messageError,
  ReactElement,
  handleYes
}) => {
  const { t } = useTranslation(['main', 'layout'])
  return (
    <AlertDialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
      <AlertDialogContent
        className={`gap-0 p-0 w-[270px] border-gray-400 shadow-[0px_4px_16px_rgba(17,17,26,0.1),_0px_8px_24px_rgba(17,17,26,0.1),_0px_16px_56px_rgba(17,17,26,0.1)]`}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="h-[31px] flex justify-between p-2 bg-blue-50 text-sm rounded-t-lg">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="h-[70px] flex justify-center items-center py-2 ">
            {ReactElement}
            <span className="text-black text-sm font-medium">{messageError}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="rounded-b-lg bg-gray-100 flex justify-center items-center h-12">
          <div className="flex flex-1 justify-around items-center">
            <button
              className=" h-6 w-20 bg-white text-black font-semibold rounded border border-gray-400 hover:border-blue-400 hover:bg-blue-50 transition duration-300"
              onClick={() => handleYes()}
            >
              {t('yes', { ns: 'layout' })}
            </button>
            <button
              className="h-6 w-20 bg-white text-black font-semibold rounded border border-gray-400 hover:border-blue-400 hover:bg-blue-50 transition duration-300"
              onClick={() => setShowAlertDialog(false)}
            >
              {t('cancel', { ns: 'layout' })}
            </button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
