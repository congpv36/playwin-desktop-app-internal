import React from 'react'
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

interface AlertErrorProps {
  showAlertDialog: boolean
  setShowAlertDialog: (open: boolean) => void
  title: string
  messageError: string
  ReactElement?: React.ReactElement
}

export const NotificationError: React.FC<AlertErrorProps> = ({
  showAlertDialog,
  setShowAlertDialog,
  title,
  messageError,
  ReactElement
}) => {
  const { t } = useTranslation(['main', 'layout'])
  if (!showAlertDialog) return null

  return (
    <AlertDialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
      <AlertDialogContent className="gap-0 p-0 w-[350px]  rounded-lg  shadow-lg border border-border-default">
        <AlertDialogHeader className="relative p-6 pb-4">
          <button
            onClick={() => setShowAlertDialog(false)}
            className="absolute top-[5px] right-[5px] font-normal block w-8 h-8 leading-none  hover:bg-gray-200 hover:rounded-full"
            aria-label="Close"
          >
            ✕
          </button>

          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <div className=" flex items-center justify-center">
                {ReactElement ? (
                  <div className="flex-shrink-0 mt-1">{ReactElement}</div>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                      fill="#FEE2E2"
                    />
                    <path
                      d="M12 8v5"
                      stroke="#DC2626"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="16.2" r="0.9" fill="#DC2626" />
                  </svg>
                )}
              </div>
            </div>

            <div className="min-w-0">
              <AlertDialogTitle className="text-lg font-semibold mb-1 leading-none">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm  leading-relaxed">
                {messageError}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex gap-3 p-6 pt-4">
          <Button
            className="flex-1 border border-border-default bg-white hover:border-gray-500"
            variant="bordered-white"
            onClick={() => setShowAlertDialog(false)}
          >
            {t('close', { ns: 'layout' })}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default React.memo(NotificationError)
