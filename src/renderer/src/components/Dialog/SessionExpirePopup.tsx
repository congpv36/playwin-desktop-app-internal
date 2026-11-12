import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function SessionExpirePopup({
  expiredDate,
  autoCloseMs = 5000,
  onClose
}: {
  expiredDate: string | Date
  autoCloseMs?: number
  onClose: () => void
}) {
  const { t } = useTranslation('layout')
  const [countdown, setCountdown] = useState(Math.round(autoCloseMs / 1000))

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          onClose()
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [onClose])

  const expired = typeof expiredDate === 'string' ? new Date(expiredDate) : expiredDate
  const now = new Date()
  const diffMs = expired.getTime() - now.getTime()

  let message: string
  if (diffMs <= 0) {
    message = t('session_expired_msg')
  } else {
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24)
    const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60)

    const parts: string[] = []
    if (diffDays > 0) parts.push(`${diffDays} ${diffDays > 1 ? t('days') : t('day')}`)
    if (diffHours > 0) parts.push(`${diffHours} ${diffHours > 1 ? t('hours') : t('hour')}`)
    if (diffMinutes > 0)
      parts.push(`${diffMinutes} ${diffMinutes > 1 ? t('minute_unit_plural') : t('minute_unit')}`)

    const timeLeft = parts.length > 0 ? parts.join(' ') : t('less_than_a_minute')
    message = t('session_will_expire_msg', { time: timeLeft })
  }

  const formattedExpired = expired.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative rounded-2xl bg-white  px-8 py-7 shadow-2xl min-w-[340px] max-w-[420px] text-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex-1 flex justify-center">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-full">
              <span className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24Z"
                    fill="#DC6803"
                  />
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
                  <path
                    d="M24 29.25C24.6213 29.25 25.125 28.7463 25.125 28.125C25.125 27.5037 24.6213 27 24 27C23.3787 27 22.875 27.5037 22.875 28.125C22.875 28.7463 23.3787 29.25 24 29.25Z"
                    fill="white"
                  />
                </svg>
              </span>
            </span>
          </div>
          <button
            onClick={() => onClose()}
            className="absolute right-6 top-7 text-gray-400 hover:text-gray-200 text-2xl"
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

        <div className="text-xl font-bold mb-3 ">{t('session_expiry_notice')}</div>
        <div className="mb-4">{message}</div>
        <div className="text-sm  mb-2">
          {t('expiry_date')} <b className="">{formattedExpired}</b>
        </div>
        <div className="mt-4 text-base font-medium text-[#F97066]">
          {t('popup_close_in_seconds', { countdown })}
        </div>
      </div>
    </div>
  )
}
