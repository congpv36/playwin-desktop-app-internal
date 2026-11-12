import { useTranslation } from 'react-i18next'

import { Button } from '../ui/button'

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

export const Confirmation: React.FC<ConfirmationProps> = ({
  title,
  messageError,
  showAlertDialog,
  setShowAlertDialog,
  actionYes,
  ReactElement
}) => {
  const { t } = useTranslation('layout')
  if (!showAlertDialog) return null

  return (
    <AlertDialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
      <AlertDialogContent className="gap-0 p-0 w-[350px]  rounded-lg  shadow-lg ">
        {/* Header with close button */}
        <AlertDialogHeader className="relative p-6 pb-4">
          <button
            onClick={() => setShowAlertDialog(false)}
            className="absolute top-[5px] right-[5px] font-normal block w-8 h-8 leading-none  hover:bg-gray-200 hover:rounded-full"
          >
            ✕
          </button>

          {/* Icon and Title */}
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 ">{ReactElement}</div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold  mb-[2px] leading-none">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm  leading-relaxed">
                {messageError}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {/* Footer with buttons */}
        <AlertDialogFooter className="flex gap-3 p-6 pt-4">
          <Button
            className="flex-1 text-text-default border border-border-default  hover:border-gray-500"
            variant="bordered-white"
            onClick={() => setShowAlertDialog(false)}
          >
            {t('cancel')}
          </Button>
          <Button className="flex-1" onClick={actionYes}>
            {t('confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
