import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import BoxLabel from '@renderer/layouts/BoxLabel'

import { SettingContext } from '@renderer/context/SettingContext'

const FirstStHalf = () => {
  const context = useContext(SettingContext)
  if (!context) return null
  const { t } = useTranslation(['main', 'layout'])
  const { firstHalfState, setFirstHalfState } = context.firstHalf

  return (
    <BoxLabel label={t('first_half')} className="w-full py-3 pl-3 pr-1">
      <div className="mb-[2px]">
        <div className="flex mb-3">
          <div className="flex items-center gap-1 w-44">
            <input
              type="checkbox"
              name="enable_1stHalf"
              id="enable_1stHalf"
              checked={Boolean(firstHalfState.enableFirstStHalf)}
              onChange={() =>
                setFirstHalfState({ enableFirstStHalf: Number(!firstHalfState.enableFirstStHalf) })
              }
            />
            <label htmlFor="enable_1stHalf">{t('bet_0_45_minutes')}</label>
          </div>
          <div className="flex w-32 items-center gap-1">
            <input
              disabled={!firstHalfState.enableFirstStHalf}
              type="checkbox"
              name="bet_first_half"
              id="bet_first_half"
              checked={Boolean(firstHalfState.betFirstHalf)}
              onChange={() =>
                setFirstHalfState({ betFirstHalf: Number(!firstHalfState.betFirstHalf) })
              }
            />
            <label htmlFor="bet_first_half">{t('bet_first_half')}</label>
          </div>
          <div className="flex w-32 items-center gap-1">
            <input
              disabled={!firstHalfState.enableFirstStHalf}
              type="checkbox"
              name="bet_full_time"
              id="bet_full_time"
              checked={Boolean(firstHalfState.betFullTime)}
              onChange={() =>
                setFirstHalfState({ betFullTime: Number(!firstHalfState.betFullTime) })
              }
            />
            <label htmlFor="bet_full_time">{t('bet_full_time')}</label>
          </div>
        </div>
        <div className="flex justify-between px-12">
          <div>
            <label>{t('betting_from_minutes')}</label>
            <input
              disabled={!firstHalfState.enableFirstStHalf}
              type="number"
              min={'0'}
              max={'45'}
              step={'1'}
              value={firstHalfState.firstStHalfBettingForm}
              className="outline-none w-16 pl-[1px] border border-gray-400 ml-5"
              onChange={(e) => {
                const value = e.target.value
                setFirstHalfState({ firstStHalfBettingForm: value })
              }}
            />
          </div>
          <div>
            <label>{t('betting_to_minutes')}</label>
            <input
              disabled={!firstHalfState.enableFirstStHalf}
              type="number"
              min={'0'}
              max={'45'}
              step={'1'}
              value={firstHalfState.firstStHalfBettingUntil}
              className="outline-none w-16 pl-[1px] border border-gray-400 ml-5"
              onChange={(e) => {
                const value = e.target.value
                setFirstHalfState({ firstStHalfBettingUntil: value })
              }}
            />
          </div>
        </div>
      </div>
    </BoxLabel>
  )
}

export default React.memo(FirstStHalf)
