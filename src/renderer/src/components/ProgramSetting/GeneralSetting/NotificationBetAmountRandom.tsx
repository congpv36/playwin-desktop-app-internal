import { useTranslation } from 'react-i18next'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

interface ConfirmationProps {
  showAlertDialog: boolean
  setShowAlertDialog: (open: boolean) => void
  title: string
  messageError: string
  ReactElement: React.ReactElement
  actionYes: () => void
}

export const NotificationBetAmountRandom: React.FC<ConfirmationProps> = ({
  title,
  messageError,
  showAlertDialog,
  setShowAlertDialog,
  actionYes,
  ReactElement
}) => {
  const { t } = useTranslation(['main', 'layout'])
  if (!showAlertDialog) return null

  return (
    <AlertDialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
      <AlertDialogContent
        className={`gap-0 p-0  h-[150px] border-gray-400 shadow-[0px_4px_16px_rgba(17,17,26,0.1),_0px_8px_24px_rgba(17,17,26,0.1),_0px_16px_56px_rgba(17,17,26,0.1)]`}
      >
        <AlertDialogHeader className="flex-1 ">
          <AlertDialogTitle className="flex justify-between p-2 bg-blue-50 text-sm rounded-t-lg">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="flex-1 flex  items-center py-2 ">
            {ReactElement}
            <span className="text-black text-sm font-medium">{messageError}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="rounded-b-lg bg-gray-100 gap-2 items-center flex justify-center px-4">
          <button
            className="h-6 w-20 bg-white text-black font-semibold rounded border border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition duration-300"
            onClick={actionYes}
          >
            {t('yes', { ns: 'layout' })}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
