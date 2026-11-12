import React, { useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import BoxLabel from '@renderer/layouts/BoxLabel'

import { SettingContext } from '@renderer/context/SettingContext'

const BetAmountRandomizer = () => {
  const context = useContext(SettingContext)
  if (!context) return null

  const { t } = useTranslation(['main', 'layout'])

  const {
    enableRandomizer,
    setRandomizerEnabled,
    fromRandomizer,
    setFromValue,
    toRandomizer,
    setToValue
  } = context.betAmountRandom

  const effectiveBetAmount = useMemo(() => {
    const fromPercentage = Number(fromRandomizer) / 100
    const toPercentage = Number(toRandomizer) / 100

    const fromBet = Math.round(500 * fromPercentage)
    const toBet = Math.round(500 * toPercentage)

    return `$${fromBet} - $${toBet}`
  }, [fromRandomizer, toRandomizer])

  return (
    <BoxLabel label={t('bet_amount_randomizer')} className="w-full py-3 pl-3">
      <div className="flex">
        <div className="flex-1 flex items-center">
          <input
            id="checkboxRandomizer"
            type="checkbox"
            checked={Boolean(enableRandomizer)}
            onChange={() => setRandomizerEnabled((prev) => Number(!prev))}
          />
          <label htmlFor="checkboxRandomizer" className="ml-2 cursor-pointer">
            {t('enable_randomizer')}
          </label>
        </div>
        <div className="flex-1 text-center">{t('effective_bet_amount_eg')}</div>
      </div>
      <div className="flex mt-5">
        <div className="flex-2 flex">
          <label htmlFor="" className="mr-2">
            {t('from_0_100_percent')}
          </label>
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={fromRandomizer}
            onChange={(e) => {
              const value = e.target.value
              if (/^\d*$/.test(value)) {
                setFromValue(value)
              }
            }}
            disabled={!enableRandomizer}
            className={`w-14 outline-none border ${
              enableRandomizer ? 'border-gray-400' : 'border-gray-300 bg-gray-100'
            }`}
          />

          <label htmlFor="" className="ml-4 mr-2">
            {t('to_100_200_percent')}
          </label>
          <input
            type="number"
            min={100}
            max={200}
            step={1}
            value={toRandomizer}
            onChange={(e) => {
              const value = e.target.value
              if (/^\d*$/.test(value)) {
                setToValue(value)
              }
            }}
            disabled={!enableRandomizer}
            className={`w-14 outline-none border ${
              enableRandomizer ? 'border-gray-400' : 'border-gray-300 bg-gray-100'
            }`}
          />
        </div>
        <div
          className={`flex-1 font-extrabold text-center ${
            enableRandomizer ? 'text-blue-color' : 'text-gray-600'
          }`}
        >
          {effectiveBetAmount}
        </div>
      </div>
    </BoxLabel>
  )
}

export default React.memo(BetAmountRandomizer)
