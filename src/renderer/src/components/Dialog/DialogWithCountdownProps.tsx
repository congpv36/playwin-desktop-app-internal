import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'

interface DialogWithCountdownProps {
  open: boolean
  setOpen: (open: boolean) => void
  message: string
  initialCountdown?: number
}

export default function DialogWithCountdown({
  open,
  setOpen,
  message,
  initialCountdown = 5
}: DialogWithCountdownProps) {
  const { t } = useTranslation(['main', 'layout'])
  const [countdown, setCountdown] = useState(initialCountdown)

  useEffect(() => {
    if (open) setCountdown(initialCountdown)
  }, [open, initialCountdown])

  useEffect(() => {
    if (!open) return

    if (countdown === 0) {
      setOpen(false)
      return
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, open, setOpen])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/60 fixed inset-0 z-40 backdrop-blur-sm" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-8 w-full max-w-[420px] min-w-[340px] text-center">
          <div className="relative">
            <div className="flex items-center justify-between w-full">
              <div className="flex-1 flex justify-center">
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-full">
                  <span className="inline-flex items-center justify-center w-12 h-12 bg-[#DC6803] rounded-full">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 48 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="24" cy="24" r="24" fill="#DC6803" />
                      <path
                        d="M24 19.5V24.75"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M27.4173 15H20.5827C20.4842 15 20.3867 15.0194 20.2957 15.0571C20.2047 15.0948 20.1221 15.15 20.0524 15.2197L15.2197 20.0524C15.15 20.1221 15.0948 20.2047 15.0571 20.2957C15.0194 20.3867 15 20.4842 15 20.5827V27.4173C15 27.5158 15.0194 27.6133 15.0571 27.7043C15.0948 27.7953 15.15 27.8779 15.2197 27.9476L20.0524 32.7803C20.1221 32.85 20.2047 32.9052 20.2957 32.9429C20.3867 32.9806 20.4842 33 20.5827 33H27.4173C27.5158 33 27.6133 32.9806 27.7043 32.9429C27.7953 32.9052 27.8779 32.85 27.9476 32.7803L32.7803 27.9476C32.85 27.8779 32.9052 27.7953 32.9429 27.7043C32.9806 27.6133 33 27.5158 33 27.4173V20.5827C33 20.4842 32.9806 20.3867 32.9429 20.2957C32.9052 20.2047 32.85 20.1221 32.7803 20.0524L27.9476 15.2197C27.8779 15.15 27.7953 15.0948 27.7043 15.0571C27.6133 15.0194 27.5158 15 27.4173 15Z"
                        stroke="white"
                        strokeWidth="2"
                        strokeMiterlimit="10"
                      />
                      <circle
                        cx="24"
                        cy="29.25"
                        r="1.125"
                        fill="white"
                        stroke="white"
                        strokeWidth="0.5"
                      />
                    </svg>
                  </span>
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="absolute right-[-15px] top-[-15px]"
                aria-label="Close"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13 1L1 13M1 1L13 13"
                    stroke="#61656C"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="text-xl font-bold mb-3  mt-4">{t('connect_server_error')}</div>
          <div className=" mb-4">{message}</div>

          <div className="mt-4 text-base font-medium text-[#F97066]">
            {t('app_will_close_in', { countdown })}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
