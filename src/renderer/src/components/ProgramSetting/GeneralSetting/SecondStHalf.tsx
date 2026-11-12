import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import BoxLabel from '@renderer/layouts/BoxLabel'

import { SettingContext } from '@renderer/context/SettingContext'

const SecondStHalf = () => {
  const context = useContext(SettingContext)
  if (!context) return null
  const { t } = useTranslation(['main', 'layout'])
  const { secondHalfState, setSecondHalfState } = context.secondHalf
  return (
    <BoxLabel label={t('second_half')} className="w-full py-3 pl-3 pr-1">
      <div className="mb-[2px]">
        <div className="flex mb-3">
          <div className="flex w-44 items-center gap-1">
            <input
              type="checkbox"
              name="enable_2stHalf"
              id="enable_2stHalf"
              checked={Boolean(secondHalfState.enableSecondStHalf)}
              onChange={() =>
                setSecondHalfState({
                  enableSecondStHalf: Number(!secondHalfState.enableSecondStHalf)
                })
              }
            />
            <label htmlFor="enable_2stHalf">{t('bet_46_90_minutes')}</label>
          </div>
          <div className="flex w-44 items-center gap-1">
            <input
              type="checkbox"
              name="bet_second_half"
              id="bet_second_half"
              checked={Boolean(secondHalfState.betHalfTime)}
              onChange={() =>
                setSecondHalfState({ betHalfTime: Number(!secondHalfState.betHalfTime) })
              }
            />
            <label htmlFor="bet_second_half">{t('bet_half_time')}</label>
          </div>
        </div>
        <div className="flex justify-between px-12">
          <div>
            <label>{t('betting_from_minutes')}</label>
            <input
              type="number"
              min={'46'}
              max={'90'}
              step={'1'}
              disabled={!secondHalfState.enableSecondStHalf}
              value={secondHalfState.secondStHalfBettingForm}
              onChange={(e) => {
                const value = e.target.value
                setSecondHalfState({ secondStHalfBettingForm: value })
              }}
              className="outline-none w-16 pl-[1px] border border-gray-400 ml-5"
            />
          </div>
          <div>
            <label>{t('betting_to_minutes')}</label>
            <input
              type="number"
              min={'46'}
              max={'90'}
              step={'1'}
              disabled={!secondHalfState.enableSecondStHalf}
              value={secondHalfState.secondStHalfBettingUntil}
              onChange={(e) => {
                const value = e.target.value
                setSecondHalfState({ secondStHalfBettingUntil: value })
              }}
              className="outline-none w-16 pl-[1px] border border-gray-400 ml-5"
            />
          </div>
        </div>
      </div>
    </BoxLabel>
  )
}

export default React.memo(SecondStHalf)
