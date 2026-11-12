import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import BoxLabel from '@renderer/layouts/BoxLabel'

import { SettingContext } from '@renderer/context/SettingContext'

const OddsSetting = () => {
  const context = useContext(SettingContext)
  if (!context) return null

  const { t } = useTranslation(['main', 'layout'])

  const { checkboxStates, setCheckboxStates, inputValuesOddsSetting, setInputValuesOddsSetting } =
    context.oddsSetting
  return (
    <BoxLabel label={t('odds_settings_label')} className="w-full py-3 pl-3 pr-1">
      <div className="flex items-center mb-[2px]">
        <input
          id="oddsLessThan"
          type="checkbox"
          checked={Boolean(checkboxStates.oddsLessThan)}
          onChange={() => setCheckboxStates('oddsLessThan')}
        />
        <label htmlFor="oddsLessThan" className="ml-1 flex-1 cursor-pointer ">
          {t('dont_bet_odds_less')}
        </label>
        <input
          disabled={!checkboxStates.oddsLessThan}
          type="number"
          pattern="[0-9]*"
          onKeyDown={(e) => {
            if (['e', 'E', '+', ','].includes(e.key)) {
              e.preventDefault()
            }
          }}
          min={'-1.00'}
          max={'1.00'}
          step={'0.01'}
          value={inputValuesOddsSetting.oddsLessThanValue}
          onChange={(e) => setInputValuesOddsSetting({ oddsLessThanValue: e.target.value })}
          className="outline-none w-16 pl-[1px] border border-gray-400"
        />
      </div>
      <div className="flex items-center mb-[2px]">
        <input
          id="oddsMoreThan"
          type="checkbox"
          checked={Boolean(checkboxStates.oddsMoreThan)}
          onChange={() => setCheckboxStates('oddsMoreThan')}
        />
        <label htmlFor="oddsMoreThan" className="ml-1 flex-1 cursor-pointer">
          {t('dont_bet_odds_greater')}
        </label>
        <input
          disabled={!checkboxStates.oddsMoreThan}
          type="number"
          pattern="[0-9]*"
          onKeyDown={(e) => {
            if (['e', 'E', '+', ','].includes(e.key)) {
              e.preventDefault()
            }
          }}
          step={'0.01'}
          min={'-1.00'}
          max={'1.00'}
          value={inputValuesOddsSetting.oddsMoreThanValue}
          onChange={(e) => setInputValuesOddsSetting({ oddsMoreThanValue: e.target.value })}
          className="outline-none w-16 pl-[1px] border border-gray-400"
        />
      </div>
      <div className="flex items-center mb-[2px]">
        <input
          id="gameCommissionMoreThan"
          type="checkbox"
          checked={Boolean(checkboxStates.gameCommissionMoreThan)}
          onChange={() => setCheckboxStates('gameCommissionMoreThan')}
        />
        <label htmlFor="gameCommissionMoreThan" className="ml-1 flex-1 cursor-pointer">
          {t('dont_bet_commission_greater')}
        </label>
        <input
          disabled={!checkboxStates.gameCommissionMoreThan}
          type="number"
          pattern="[0-9]*"
          onKeyDown={(e) => {
            if (['e', 'E', '+', ','].includes(e.key)) {
              e.preventDefault()
            }
          }}
          step={'0.01'}
          min={'-1.00'}
          max={'1.00'}
          value={inputValuesOddsSetting.gameCommissionMoreThanValue}
          onChange={(e) =>
            setInputValuesOddsSetting({ gameCommissionMoreThanValue: e.target.value })
          }
          className="outline-none w-16 pl-[1px] border border-gray-400"
        />
      </div>
      <div className="flex items-center">
        <input
          id="gameCommissionLessThan"
          type="checkbox"
          checked={Boolean(checkboxStates.gameCommissionLessThan)}
          onChange={() => setCheckboxStates('gameCommissionLessThan')}
        />
        <label htmlFor="gameCommissionLessThan" className="ml-1 flex-1 cursor-pointer">
          {t('dont_bet_commission_less')}
        </label>
        <input
          disabled={!checkboxStates.gameCommissionLessThan}
          type="number"
          pattern="[0-9]*"
          onKeyDown={(e) => {
            if (['e', 'E', '+', ','].includes(e.key)) {
              e.preventDefault()
            }
          }}
          step={'0.01'}
          min={'-1.00'}
          max={'1.00'}
          value={inputValuesOddsSetting.gameCommissionLessThanValue}
          onChange={(e) =>
            setInputValuesOddsSetting({ gameCommissionLessThanValue: e.target.value })
          }
          className="outline-none w-16 pl-[1px] border border-gray-400"
        />
      </div>
    </BoxLabel>
  )
}

export default React.memo(OddsSetting)
