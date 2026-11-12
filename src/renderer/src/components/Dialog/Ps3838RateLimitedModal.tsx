import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

interface Ps3838RateLimitedModalProps {
  loginID: string
  platformName: string
  retryAfterSec: number
  onCancel: () => void
}

export default function Ps3838RateLimitedModal({
  loginID,
  platformName,
  retryAfterSec,
  onCancel
}: Ps3838RateLimitedModalProps) {
  const { t } = useTranslation('layout')
  const [countdown, setCountdown] = useState(retryAfterSec)

  useEffect(() => {
    setCountdown(retryAfterSec)
  }, [retryAfterSec])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative rounded-2xl bg-white px-8 py-7 shadow-2xl min-w-[340px] max-w-[420px] text-center">
        <div className="text-lg font-bold mb-1">{t('ps3838_rate_limited_title')}</div>
        <div className="text-sm text-gray-500 mb-4">
          <Trans
            t={t}
            i18nKey="ps3838_account_info"
            values={{ platformName, loginID }}
            components={{ b: <strong className="font-semibold text-gray-700" /> }}
          />
        </div>

        <div className="text-sm text-gray-700 mb-6">
          {t('ps3838_rate_limited_countdown', { count: Math.max(countdown, 0) })}
        </div>

        <Button
          variant="outline"
          className="w-full border-black/20 text-black/80 hover:bg-white hover:border-black/40"
          onClick={onCancel}
        >
          {t('cancel')}
        </Button>
      </div>
    </div>
  )
}
