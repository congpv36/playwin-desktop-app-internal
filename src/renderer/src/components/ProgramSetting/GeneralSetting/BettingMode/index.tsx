import React, { useState } from 'react'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import BoxLabel from '@renderer/layouts/BoxLabel'

import { SettingContext } from '@renderer/context/SettingContext'

import { AmountRounderSettingPopup } from './AmountRounderSettingPopup'

const BettingMode = () => {
  const context = useContext(SettingContext)
  if (!context) return null
  const { t } = useTranslation(['main', 'layout'])
  const { bettingModeState, setBettingModeState } = context.bettingMode

  const [showAmountRounderSetting, setShowAmountRounderSetting] = useState(false)

  const handleShowRounding = (e) => {
    if (!bettingModeState.amountRoundingEnabled) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    setShowAmountRounderSetting(true)
  }

  return (
    <BoxLabel
      label="Betting Mode"
      className="flex justify-center w-full items-center pl-3 pr-1 py-3"
    >
      <div>
        <div className="flex gap-1 mb-2">
          <input
            type="radio"
            name="normal"
            id="normal"
            checked={bettingModeState.bettingMode === 'Normal'}
            onChange={() =>
              setBettingModeState({
                ...bettingModeState,
                bettingMode: 'Normal'
              })
            }
          />
          <label htmlFor="normal"> {t('normal', { ns: 'layout' })}</label>
        </div>
        <div className="flex gap-1">
          <input
            type="checkbox"
            name="amount_rounding"
            id="amount_rounding"
            checked={Boolean(bettingModeState.amountRoundingEnabled)}
            onChange={() =>
              setBettingModeState({
                amountRoundingEnabled: Number(!bettingModeState.amountRoundingEnabled)
              })
            }
          />
          <label htmlFor="amount_rounding">{t('amount_rounding')} </label>

          <span
            onClick={handleShowRounding}
            className={`${Number(!bettingModeState.amountRoundingEnabled) ? 'opacity-50' : 'cursor-pointer text-[#0000FF]'} underline text-sm  ml-2`}
          >
            {t('rounding_setting')}
          </span>
        </div>
        {showAmountRounderSetting && (
          <AmountRounderSettingPopup
            bettingModeState={bettingModeState}
            setShowAmountRounderSetting={setShowAmountRounderSetting}
            setBettingModeState={setBettingModeState}
          />
        )}
      </div>
    </BoxLabel>
  )
}

export default React.memo(BettingMode)
