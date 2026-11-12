import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { InputNumber } from '@renderer/components/ui/input-number'
import { SwitchCustom } from '@renderer/components/ui/switch'

export default function SelectMultipleAmountRandomizer({
  checked,
  setChecked,
  setFrom,
  setTo,
  from,
  to
}) {
  const { t } = useTranslation('main')

  const profile = localStorage.getItem('profile')
  const isTrialAccount = profile ? JSON.parse(profile)?.isTrialAccount : false

  const effectiveBetAmount = useMemo(() => {
    const fromPercentage = Number(from) / 100
    const toPercentage = Number(to) / 100

    const baseBet = 500
    const fromBet = Math.round(baseBet * fromPercentage)
    const toBet = Math.round(baseBet * toPercentage)

    return `$${fromBet} - $${toBet}`
  }, [from, to])

  return (
    <div className=" w-[500px] flex flex-col space-y-6 p-4 border-t border-border-default">
      <div>
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <SwitchCustom
                disabled={isTrialAccount}
                checked={Boolean(checked)}
                onCheckedChange={() => setChecked((prev) => (prev === 0 ? 1 : 0))}
              />
              <span className="text-base font-medium">{t('enable_amount_randomizer')}</span>
            </div>

            <div className="text-[#94979C] font-normal text-sm whitespace-nowrap">
              {t('effective_bet_amount_eg')}
            </div>
          </div>

          <div className="flex w-full gap-2 mt-2">
            <div className="w-full">
              <div className="text-sm mb-1  font-medium whitespace-nowrap">
                {t('from_0_100_percent')}
              </div>

              <InputNumber
                precision={0}
                min={0}
                max={100}
                step={1}
                disabled={!checked}
                value={Number(from)}
                onChange={(value) => setFrom(String(value))}
              />
            </div>

            <div className="w-full">
              <div className="text-sm mb-1  font-medium whitespace-nowrap">
                {t('to_100_400_percent')}
              </div>

              <InputNumber
                precision={0}
                min={100}
                max={400}
                step={1}
                disabled={!checked}
                value={Number(to)}
                onChange={(value) => setTo(String(value))}
              />
            </div>
          </div>

          <div className="w-full">
            <div className="text-sm mb-1  font-medium whitespace-nowrap">
              {t('calculated_effective_bet_amount')}
            </div>

            <div
              className={`text-sm font-medium p-2 rounded border text-center border-border-default  whitespace-nowrap ${
                checked ? '' : 'text-gray-600'
              }`}
            >
              {effectiveBetAmount}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
