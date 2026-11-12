import { Fragment } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

interface Ps3838AccountLockedModalProps {
  variant: 'temporary' | 'disabled' | 'loginNameExpired'
  platformName: string
  loginID: string
  failedAttempts?: number
  onClose: () => void
}

export default function Ps3838AccountLockedModal({
  variant,
  platformName,
  loginID,
  failedAttempts,
  onClose
}: Ps3838AccountLockedModalProps) {
  const { t } = useTranslation('layout')

  const contentByVariant = {
    temporary: {
      titleKey: 'ps3838_account_temp_disabled_title',
      lineKeys: [
        'ps3838_account_temp_disabled_line1',
        'ps3838_account_temp_disabled_line2',
        'ps3838_account_temp_disabled_line3'
      ]
    },
    disabled: {
      titleKey: 'ps3838_account_disabled_title',
      lineKeys: [
        'ps3838_account_disabled_line1',
        'ps3838_account_disabled_line2',
        'ps3838_account_disabled_line3'
      ]
    },
    loginNameExpired: {
      titleKey: 'ps3838_login_name_expired_title',
      lineKeys: ['ps3838_login_name_expired_line1', 'ps3838_login_name_expired_line2']
    }
  } as const
  const { titleKey, lineKeys } = contentByVariant[variant]
  const title = t(titleKey)
  const line1Values = { count: typeof failedAttempts === 'number' ? failedAttempts : 5 }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative rounded-2xl bg-white px-8 py-7 shadow-2xl min-w-[340px] max-w-[420px] text-center">
        <div className="text-lg font-bold mb-1">{title}</div>
        <div className="text-sm text-gray-500 mb-1">{title}</div>
        <div className="text-sm text-gray-500 mb-4">
          <Trans
            t={t}
            i18nKey="ps3838_account_info"
            values={{ platformName, loginID }}
            components={{ b: <strong className="font-semibold text-gray-700" /> }}
          />
        </div>

        <div className="text-sm text-gray-700 mb-6">
          {lineKeys.map((key, index) => (
            <Fragment key={key}>
              {index > 0 && <br />}
              {t(key, index === 0 ? line1Values : undefined)}
            </Fragment>
          ))}
        </div>

        <Button className="w-full" onClick={onClose}>
          {t('ok')}
        </Button>
      </div>
    </div>
  )
}
