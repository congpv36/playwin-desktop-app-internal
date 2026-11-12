import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle } from 'lucide-react'

import BettingConfig from '@renderer/components/ProgramSetting/GeneralSetting/BettingConfig'
import OddsAndGameConfiguration from '@renderer/components/ProgramSetting/GeneralSetting/OddsAndGameConfiguration'
import ScoreSetting from '@renderer/components/ProgramSetting/GeneralSetting/ScoreSetting'
import { Button } from '@renderer/components/ui/button'
import { SettingContext } from '@renderer/context/SettingContext'
import { checkInputFormatScheduler } from '@renderer/lib/checkInputFormatScheduler'
import { validateBettingFields } from '@renderer/lib/utils'
import {
  validateSettingScoreList,
  validateSettingTotalGoal
} from '@renderer/lib/validateScoreSetting'
import ExclamationTriangle from '@renderer/icons/exclamation-triangle'

import { TEXT_MESSAGE_ERROR_DEFAULT, VALUE_DEFAULT_ODDS_SETTING } from '@shared/renderer/constants'

import BetMode from './BetMode'
import { NotificationBetAmountRandom } from './NotificationBetAmountRandom'

export default function Setting() {
  const context = useContext(SettingContext)
  if (!context) return null

  const { t } = useTranslation(['main', 'layout'])

  const [title, setTitle] = useState(t('notification', { ns: 'layout' }))
  const [messageError, setMessageError] = useState('')
  const [showAlertMsg, setShowAlertMsg] = useState(false)

  const { firstHalfState, setFirstHalfState } = context.firstHalf
  const { secondHalfState, setSecondHalfState } = context.secondHalf
  const { bettingModeState, setBettingModeState } = context.bettingMode

  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null)
  const {
    enableRandomizer,
    setRandomizerEnabled,
    fromRandomizer,
    setFromValue,
    toRandomizer,
    setToValue
  } = context.betAmountRandom
  const { checkboxStates, setCheckboxStates, inputValuesOddsSetting, setInputValuesOddsSetting } =
    context.oddsSetting

  const handleSaveSetting = () => {
    for (const key in inputValuesOddsSetting) {
      const value = parseFloat(inputValuesOddsSetting[key])
      if (isNaN(value) || value < -1 || value > 1) {
        setInputValuesOddsSetting({ [key]: VALUE_DEFAULT_ODDS_SETTING[key] })
        setTitle(t('notification_odds_setting'))
        setMessageError(TEXT_MESSAGE_ERROR_DEFAULT[key])
        setShowAlertMsg(true)
        return
      } else {
        setInputValuesOddsSetting({ [key]: value.toFixed(2) })
      }
    }
    const valueHalfBetting = validateBettingFields(
      firstHalfState?.firstStHalfBettingForm,
      firstHalfState.firstStHalfBettingUntil,
      0,
      45,
      firstHalfState?.enableFirstStHalf
    )

    const valueSecondBetting = validateBettingFields(
      secondHalfState?.secondStHalfBettingForm,
      secondHalfState.secondStHalfBettingUntil,
      46,
      90,
      secondHalfState?.enableSecondStHalf
    )

    window.electron.ipcRenderer.send('SaveSettingWindow', {
      profitMin:
        isNaN(parseFloat(context.oddsTypeSetting.profitMin as string)) ||
        parseFloat(context.oddsTypeSetting.profitMin as string) < -1
          ? '-1'
          : context.oddsTypeSetting.profitMin,
      profitMax:
        isNaN(parseFloat(context.oddsTypeSetting.profitMax as string)) ||
        parseFloat(context.oddsTypeSetting.profitMax as string) > 1
          ? '1'
          : context.oddsTypeSetting.profitMax,
      gameType: context.gameType.gameType,
      betMode: context.betMode.betMode,
      oddsLessThan: checkboxStates.oddsLessThan,
      oddsMoreThan: checkboxStates.oddsMoreThan,
      gameCommissionMoreThan: checkboxStates.gameCommissionMoreThan,
      gameCommissionLessThan: checkboxStates.gameCommissionLessThan,
      oddsLessThanValue: inputValuesOddsSetting.oddsLessThanValue,
      oddsMoreThanValue: inputValuesOddsSetting.oddsMoreThanValue,
      gameCommissionMoreThanValue: inputValuesOddsSetting.gameCommissionMoreThanValue,
      gameCommissionLessThanValue: inputValuesOddsSetting.gameCommissionLessThanValue,
      enableRandomizer,
      fromRandomizer,
      toRandomizer,
      enableFirstStHalf: firstHalfState.enableFirstStHalf,
      betFirstHalf: firstHalfState.betFirstHalf,
      betFullTime: firstHalfState.betFullTime,
      enableSecondStHalf: secondHalfState.enableSecondStHalf,
      betHalfTime: secondHalfState.betHalfTime,
      firstStHalfBettingForm: String(valueHalfBetting[0]),
      firstStHalfBettingUntil: String(valueHalfBetting[1]),
      secondStHalfBettingForm: String(valueSecondBetting[0]),
      secondStHalfBettingUntil: String(valueSecondBetting[1]),
      bettingMode: bettingModeState.bettingMode,
      amountRoundingEnabled: bettingModeState.amountRoundingEnabled,
      roundType: bettingModeState.roundType,
      roundingNumber: bettingModeState.roundingNumber,
      schedulerRunning: context.gameTypeScheduler.running.value,
      schedulerInputRunning: checkInputFormatScheduler(context.gameTypeScheduler.running.input),
      schedulerToday: context.gameTypeScheduler.today.value,
      schedulerInputToday: checkInputFormatScheduler(context.gameTypeScheduler.today.input),
      schedulerEarly: context.gameTypeScheduler.early.value,
      schedulerInputEarly: checkInputFormatScheduler(context.gameTypeScheduler.early.input),

      settingTotalGoal: JSON.stringify(
        validateSettingTotalGoal(context.totalGoal.settingTotalGoal)
      ),
      settingScoreList: JSON.stringify(validateSettingScoreList(context.scoreList.settingScoreList))
    })

    setShowSaveSuccess(true)
    setMessageSuccess(t('save_successful', { ns: 'layout' }))
    setTimeout(() => {
      setShowSaveSuccess(false)
    }, 1500)
  }

  const handleResetAllChanges = () => {
    setFirstHalfState({
      enableFirstStHalf: 1,
      betFirstHalf: 1,
      betFullTime: 1,
      firstStHalfBettingForm: '0',
      firstStHalfBettingUntil: '45'
    })

    setSecondHalfState({
      enableSecondStHalf: 1,
      betHalfTime: 1,
      secondStHalfBettingForm: '46',
      secondStHalfBettingUntil: '90'
    })

    setBettingModeState({
      bettingMode: 'Normal',
      amountRoundingEnabled: 0,
      roundType: 'Auto',
      roundingNumber: '2',
      testRounding: '4879'
    })

    setRandomizerEnabled(0)
    setFromValue('50')
    setToValue('200')

    context.oddsTypeSetting.setProfitMin('-1')
    context.oddsTypeSetting.setProfitMax('1')

    context.gameType.setGameType('None')
    context.betMode.setBetMode('Auto')

    setInputValuesOddsSetting({
      oddsLessThanValue: '0.10',
      oddsMoreThanValue: '0.80',
      gameCommissionMoreThanValue: '0.24',
      gameCommissionLessThanValue: '0.08'
    })

    if (checkboxStates.oddsLessThan) setCheckboxStates('oddsLessThan')
    if (checkboxStates.oddsMoreThan) setCheckboxStates('oddsMoreThan')
    if (checkboxStates.gameCommissionMoreThan) setCheckboxStates('gameCommissionMoreThan')
    if (checkboxStates.gameCommissionLessThan) setCheckboxStates('gameCommissionLessThan')

    context.gameTypeScheduler.running.setValue(0)
    context.gameTypeScheduler.running.setInput('')
    context.gameTypeScheduler.today.setValue(0)
    context.gameTypeScheduler.today.setInput('')
    context.gameTypeScheduler.early.setValue(0)
    context.gameTypeScheduler.early.setInput('')

    context.totalGoal.setSettingTotalGoal({
      enable: 0,
      from: 0,
      to: 0
    })

    context.scoreList.setSettingScoreList({
      enable: 0,
      list: [{ home: '', away: '' }]
    })
  }

  const handleCancel = () => {
    window.history.back()
  }

  return (
    <div className="bg-layout-color h-full flex flex-col">
      <div className="bg-layout-color flex flex-col overflow-y-auto max-h-[calc(100vh-182px)]">
        <NotificationBetAmountRandom
          title={title}
          messageError={messageError}
          showAlertDialog={showAlertMsg}
          setShowAlertDialog={setShowAlertMsg}
          actionYes={() => {
            setShowAlertMsg(false)
          }}
          ReactElement={<ExclamationTriangle className="w-28 size-11 text-[#FF8C00] mr-1" />}
        />

        <div className="flex-1 overflow-auto min-h-0 px-4 py-2">
          <div className="min-w-[800px]">
            <OddsAndGameConfiguration />
            <ScoreSetting />
            <BetMode />
            <BettingConfig />
          </div>
        </div>

        <div className="flex justify-end space-x-2 py-3 px-5 flex-shrink-0 border-t border-border-default bg-layout-color">
          <Button
            variant="bordered-white"
            className="text-text-default bg-white whitespace-nowrap border-border-default hover:border-gray-600"
            onClick={handleResetAllChanges}
          >
            {t('reset_all_changes', { ns: 'layout' })}
          </Button>
          <Button
            variant="bordered-white"
            className="whitespace-nowrap text-text-default bg-white flex-shrink-0 border-border-default hover:border-gray-600  w-32"
            onClick={handleCancel}
          >
            {t('cancel', { ns: 'layout' })}
          </Button>

          <Button
            onClick={handleSaveSetting}
            className="whitespace-nowrap flex-shrink-0 text-white w-32"
          >
            {t('save', { ns: 'layout' })}
          </Button>
        </div>

        {showSaveSuccess && (
          <div className="fixed top-[5%] right-[2%] bg-green-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center z-50 animate-pulse">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>{messageSuccess}</span>
          </div>
        )}
      </div>
    </div>
  )
}
