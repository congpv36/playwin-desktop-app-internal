import { useCallback, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { InputNumber } from '@renderer/components/ui/input-number'
import { SwitchCustom } from '@renderer/components/ui/switch'
import { LeaguePointRandomizerContext } from '@renderer/context/LeaguePointRandomizerContext'

export default function AmountRandomizer() {
  const context = useContext(LeaguePointRandomizerContext)
  const { t } = useTranslation(['main', 'layout'])
  if (!context) return null

  const profile = localStorage.getItem('profile')
  const isTrialAccount = profile ? JSON.parse(profile)?.isTrialAccount : false

  const { selectedLeague, setSelectedLeague, setListSelectedLeague } = context

  const updateSelectedLeague = useCallback(
    (nextLeague) => {
      setSelectedLeague(nextLeague)

      setListSelectedLeague((prev) =>
        prev.map((item) => (item.id === nextLeague.id ? nextLeague : item))
      )
    },
    [setSelectedLeague, setListSelectedLeague]
  )

  const effectiveBetAmount = useMemo(() => {
    const fromPercentage = Number(selectedLeague.fromValue) / 100
    const toPercentage = Number(selectedLeague.toValue) / 100

    const fromBet = Math.round(500 * fromPercentage)
    const toBet = Math.round(500 * toPercentage)

    return `$${fromBet} - $${toBet}`
  }, [selectedLeague.fromValue, selectedLeague.toValue])

  return (
    <div className="bg-white flex flex-col space-y-6 px-4 pb-4 pt-4 border-t border-border-default">
      <div>
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <SwitchCustom
                disabled={isTrialAccount}
                checked={Boolean(selectedLeague.checked)}
                onCheckedChange={() =>
                  updateSelectedLeague({
                    ...selectedLeague,
                    checked: selectedLeague.checked ? 0 : 1
                  })
                }
              />
              <span className="text-base font-medium">{t('main:enable_amount_randomizer')}</span>
            </div>

            <div className="text-[#94979C] font-normal text-sm whitespace-nowrap">
              {t('main:effective_bet_amount_eg2')}
            </div>
          </div>

          <div className="flex w-full gap-2 mt-2">
            <div className="w-full">
              <div className="text-sm mb-1  font-medium whitespace-nowrap">
                {t('main:from_0_100_percent')}
              </div>

              <InputNumber
                precision={0}
                min={0}
                max={100}
                step={1}
                disabled={!selectedLeague.checked}
                value={Number(selectedLeague.fromValue)}
                onChange={(value) =>
                  updateSelectedLeague({
                    ...selectedLeague,
                    fromValue: String(value)
                  })
                }
              />
            </div>

            <div className="w-full">
              <div className="text-sm mb-1  font-medium whitespace-nowrap">
                {t('main:to_100_400_percent')}
              </div>

              <InputNumber
                precision={0}
                min={100}
                max={400}
                step={1}
                disabled={!selectedLeague.checked}
                value={Number(selectedLeague.toValue)}
                onChange={(value) =>
                  updateSelectedLeague({
                    ...selectedLeague,
                    toValue: String(value)
                  })
                }
              />
            </div>
          </div>

          <div className="w-full">
            <div className="text-sm mb-1  font-medium whitespace-nowrap">
              {t('main:calculated_effective_bet_amount')}
            </div>

            <div
              className={`text-sm font-medium p-2 rounded border text-center border-border-default  whitespace-nowrap ${
                selectedLeague.checked ? '' : 'text-gray-600'
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
