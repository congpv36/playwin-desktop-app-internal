import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Ps3838OtpModalProps {
  loginID: string
  platformName: string
  invalid: boolean
  errorToken: number
  submitting: boolean
  autoOtpFailed?: boolean
  onSubmit: (otp: string) => void
  onClose: () => void
}

export default function Ps3838OtpModal({
  loginID,
  platformName,
  invalid,
  errorToken,
  submitting,
  autoOtpFailed,
  onSubmit,
  onClose
}: Ps3838OtpModalProps) {
  const { t } = useTranslation('layout')
  const [otp, setOtp] = useState('')
  const [errorDismissed, setErrorDismissed] = useState(false)

  useEffect(() => {
    if (invalid) {
      setOtp('')
      setErrorDismissed(false)
    }
  }, [errorToken])

  const canVerify = otp.length === 6 && !submitting
  const displayError = !errorDismissed && invalid ? t('ps3838_otp_invalid') : ''

  const handleChange = (value: string) => {
    setOtp(value.replace(/\D/g, '').slice(0, 6))
    if (invalid) setErrorDismissed(true)
  }

  const handleVerify = () => {
    if (!canVerify) return
    onSubmit(otp)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative rounded-2xl bg-white px-8 py-7 shadow-2xl min-w-[340px] max-w-[420px]">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 text-xl leading-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          ×
        </button>

        <div className="text-lg font-bold mb-1">{t('ps3838_otp_title')}</div>
        <div className="text-sm text-gray-500 mb-4">
          <Trans
            t={t}
            i18nKey="ps3838_otp_description"
            values={{ loginID, platformName }}
            components={{ b: <strong className="font-semibold text-gray-700" /> }}
          />
        </div>

        {autoOtpFailed && (
          <div className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {t('ps3838_otp_auto_failed')}
          </div>
        )}

        <Input
          autoFocus
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleVerify()
          }}
          placeholder={t('ps3838_otp_placeholder')}
          error={displayError}
          className="text-center tracking-[0.5em] text-base font-semibold"
        />

        <div className="mt-5 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-black/20 text-black/80 hover:bg-white hover:border-black/40"
            disabled={submitting}
            onClick={onClose}
          >
            {t('cancel')}
          </Button>
          <Button
            className="flex-1 inline-flex items-center justify-center gap-2"
            disabled={!canVerify}
            onClick={handleVerify}
          >
            {submitting && (
              <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {t('ps3838_verify')}
          </Button>
        </div>
      </div>
    </div>
  )
}
