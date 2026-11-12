import { useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Checkbox } from '@renderer/components/ui/checkbox'
import { Input } from '@renderer/components/ui/input'
import { InputNumber } from '@renderer/components/ui/input-number'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { SwitchCustom } from '@renderer/components/ui/switch'
import { SettingContext } from '@renderer/context/SettingContext'
import { calculateRoundedValue } from '@renderer/lib/calculateRoundedValue'

function BettingConfig() {
  const context = useContext(SettingContext)
  if (!context) return null

  const { t } = useTranslation(['main', 'layout'])

  const { setFirstHalfState } = context.firstHalf
  const { secondHalfState, setSecondHalfState } = context.secondHalf
  const { bettingModeState, setBettingModeState } = context.bettingMode

  const { checkboxStates, setCheckboxStates, inputValuesOddsSetting, setInputValuesOddsSetting } =
    context.oddsSetting

  const {
    enableRandomizer,
    setRandomizerEnabled,
    fromRandomizer,
    setFromValue,
    toRandomizer,
    setToValue
  } = context.betAmountRandom

  const [showTestResult, setShowTestResult] = useState(false)
  const [testResult, setTestResult] = useState('')

  const profile = localStorage.getItem('profile')
  const isTrialAccount = profile ? JSON.parse(profile)?.isTrialAccount : false

  const handleTestRounding = () => {
    const testValue = bettingModeState.testRounding
    const roundingNumber = Number(bettingModeState.roundingNumber)
    const roundType = bettingModeState.roundType

    if (!testValue || isNaN(Number(testValue))) {
      setTestResult('0')
      setShowTestResult(true)
      return
    }

    const roundedValue = calculateRoundedValue(
      Number(testValue),
      testValue,
      roundingNumber,
      roundType
    )

    setTestResult(roundedValue.toString())
    setShowTestResult(true)

    setTimeout(() => {
      setShowTestResult(false)
    }, 2000)
  }
  const effectiveBetAmount = useMemo(() => {
    const fromPercentage = Number(fromRandomizer) / 100
    const toPercentage = Number(toRandomizer) / 100

    const fromBet = Math.round(500 * fromPercentage)
    const toBet = Math.round(500 * toPercentage)

    return `$${fromBet} - $${toBet}`
  }, [fromRandomizer, toRandomizer])

  return (
    <div>
      <h1 className="text-sm font-semibold mb-5 border-b pb-2 border-border-default whitespace-nowrap">
        {t('betting_parameters_randomization')}
      </h1>
      <div className="grid grid-cols-1 gap-2 mb-2 border-b border-border-default">
        <div className="flex flex-col p-2 pl-0">
          <div className="flex">
            <div className="w-[300px] text-sm flex-shrink-0 whitespace-nowrap">
              {t('first_half')}
            </div>
            <div className="w-[400px] flex flex-wrap gap-2 flex-shrink-0">
              <div className="flex justify-between w-full">
                <label className="inline-flex items-center whitespace-nowrap">
                  <Checkbox
                    name="enable_1stHalf"
                    id="enable_1stHalf"
                    checked={Boolean(context.firstHalf.firstHalfState.enableFirstStHalf)}
                    onCheckedChange={() =>
                      setFirstHalfState({
                        enableFirstStHalf: Number(
                          !context.firstHalf.firstHalfState.enableFirstStHalf
                        )
                      })
                    }
                  />
                  <span className="ml-2 text-sm font-semibold">{t('bet_0_45_minutes')}</span>
                </label>

                <label className="inline-flex items-center whitespace-nowrap">
                  <Checkbox
                    name="bet_first_half"
                    id="bet_first_half"
                    disabled={!context.firstHalf.firstHalfState.enableFirstStHalf}
                    checked={Boolean(context.firstHalf.firstHalfState.betFirstHalf)}
                    onCheckedChange={() =>
                      setFirstHalfState({
                        betFirstHalf: Number(!context.firstHalf.firstHalfState.betFirstHalf)
                      })
                    }
                  />
                  <span className="ml-2 text-sm font-semibold">{t('bet_first_half')}</span>
                </label>

                <label className="inline-flex items-center whitespace-nowrap">
                  <Checkbox
                    name="bet_full_time"
                    id="bet_full_time"
                    disabled={!context.firstHalf.firstHalfState.enableFirstStHalf}
                    checked={Boolean(context.firstHalf.firstHalfState.betFullTime)}
                    onCheckedChange={() =>
                      setFirstHalfState({
                        betFullTime: Number(!context.firstHalf.firstHalfState.betFullTime)
                      })
                    }
                  />
                  <span className="ml-2 text-sm font-semibold">{t('bet_full_time')}</span>
                </label>
              </div>
              <div className="flex w-full gap-2 mt-2">
                <div className="w-full">
                  <div className="text-sm mb-1 whitespace-nowrap">{t('betting_from_minutes')}</div>

                  <InputNumber
                    precision={0}
                    min={0}
                    max={45}
                    step={1}
                    value={Number(context.firstHalf.firstHalfState.firstStHalfBettingForm)}
                    onChange={(value) => {
                      context.firstHalf.setFirstHalfState({
                        firstStHalfBettingForm: String(value)
                      })
                    }}
                  />
                </div>

                <div className="w-full">
                  <div className="text-sm mb-1 whitespace-nowrap">{t('betting_to_minutes')}</div>
                  <InputNumber
                    precision={0}
                    min={0}
                    max={45}
                    step={1}
                    value={Number(context.firstHalf.firstHalfState.firstStHalfBettingUntil)}
                    onChange={(value) => {
                      context.firstHalf.setFirstHalfState({
                        firstStHalfBettingUntil: String(value)
                      })
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 mb-2 border-b border-border-default">
        <div className="flex flex-col space-y-6 p-2 pl-0">
          <div className="flex">
            <div className="w-[300px] text-sm flex-shrink-0 whitespace-nowrap">
              {t('second_half')}
            </div>
            <div className="w-[400px] flex flex-wrap gap-2 flex-shrink-0">
              <div className="flex w-full">
                <label className="flex-1 inline-flex items-center w-[232px] flex-shrink-0 whitespace-nowrap">
                  <Checkbox
                    name="enable_2stHalf"
                    id="enable_2stHalf"
                    checked={Boolean(context.secondHalf.secondHalfState.enableSecondStHalf)}
                    onCheckedChange={() =>
                      setSecondHalfState({
                        enableSecondStHalf: Number(
                          !context.secondHalf.secondHalfState.enableSecondStHalf
                        )
                      })
                    }
                  />
                  <span className="ml-2 text-sm font-semibold">{t('bet_46_90_minutes')}</span>
                </label>

                <label className="flex-1 inline-flex items-center whitespace-nowrap">
                  <Checkbox
                    name="bet_second_half"
                    id="bet_second_half"
                    checked={Boolean(context.secondHalf.secondHalfState.betHalfTime)}
                    onCheckedChange={() =>
                      setSecondHalfState({
                        betHalfTime: Number(!context.secondHalf.secondHalfState.betHalfTime)
                      })
                    }
                  />
                  <span className="ml-2 text-sm font-semibold">{t('bet_half_time')}</span>
                </label>
              </div>
              <div className="flex w-full gap-2 mt-2">
                <div className="w-full">
                  <div className="text-sm mb-1 whitespace-nowrap">{t('betting_from_minutes')}</div>

                  <InputNumber
                    precision={0}
                    min={46}
                    max={90}
                    step={1}
                    disabled={!secondHalfState.enableSecondStHalf}
                    value={Number(context.secondHalf.secondHalfState.secondStHalfBettingForm)}
                    onChange={(value) => {
                      context.secondHalf.setSecondHalfState({
                        secondStHalfBettingForm: String(value)
                      })
                    }}
                  />
                </div>

                <div className="w-full">
                  <div className="text-sm mb-1 whitespace-nowrap">{t('betting_to_minutes')}</div>
                  <InputNumber
                    precision={0}
                    min={46}
                    max={90}
                    step={1}
                    disabled={!secondHalfState.enableSecondStHalf}
                    value={Number(context.secondHalf.secondHalfState.secondStHalfBettingUntil)}
                    onChange={(value) => {
                      context.secondHalf.setSecondHalfState({
                        secondStHalfBettingUntil: String(value)
                      })
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 mb-2 border-b border-border-default">
        <div className="flex flex-col space-y-6 p-2 pl-0">
          <div className="flex">
            <div className="w-[300px] text-sm flex-shrink-0 whitespace-nowrap">
              {t('amount_rounding')}
            </div>
            <div className="w-[400px] flex flex-wrap gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 w-full">
                <SwitchCustom
                  disabled={isTrialAccount}
                  onCheckedChange={() =>
                    setBettingModeState({
                      amountRoundingEnabled: Number(!bettingModeState.amountRoundingEnabled)
                    })
                  }
                  checked={Boolean(bettingModeState.amountRoundingEnabled)}
                />
                <span className="text-sm font-medium">{t('enable', { ns: 'layout' })}</span>
              </div>

              <div className="flex w-full pt-2">
                <div className="flex justify-between w-full">
                  <RadioGroup
                    value={bettingModeState.roundType}
                    onValueChange={(value) => {
                      setBettingModeState({ roundType: value })
                    }}
                    className="flex justify-between w-full"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value="roundDown"
                        id="roundDown"
                        disabled={!bettingModeState.amountRoundingEnabled}
                      />
                      <label htmlFor="roundDown" className="text-sm font-medium whitespace-nowrap">
                        {t('round_down')}
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value="roundUp"
                        id="roundUp"
                        disabled={!bettingModeState.amountRoundingEnabled}
                      />
                      <label htmlFor="roundUp" className="text-sm font-medium whitespace-nowrap">
                        {t('round_up')}
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value="Auto"
                        id="Auto"
                        disabled={!bettingModeState.amountRoundingEnabled}
                      />
                      <label htmlFor="Auto" className="text-sm font-medium whitespace-nowrap">
                        {t('auto_mode')}
                      </label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="flex w-full gap-2 mt-2">
                <div className="w-1/2">
                  <div className="text-sm mb-1 whitespace-nowrap">{t('rounding_number')}</div>
                  <InputNumber
                    precision={0}
                    min={1}
                    max={8}
                    step={1}
                    disabled={!bettingModeState.amountRoundingEnabled}
                    value={Number(bettingModeState.roundingNumber)}
                    onChange={(value) => {
                      setBettingModeState({ roundingNumber: String(value) })
                    }}
                  />
                </div>

                <div className="w-1/2">
                  <div className="text-sm mb-1 whitespace-nowrap">{t('test_rounding')}</div>
                  <div className="relative">
                    <Input
                      disabled={!bettingModeState.amountRoundingEnabled}
                      value={bettingModeState.testRounding}
                      onChange={(e) => {
                        const value = e.target.value
                        if (/^\d*$/.test(value)) {
                          setBettingModeState({ testRounding: value })
                        }
                      }}
                      button={{
                        text: 'Test',
                        onClick: handleTestRounding
                      }}
                    />
                    {showTestResult && (
                      <div className="absolute top-full left-0 mt-[-70px] bg-blue-100 border border-blue-300 rounded px-2 py-1 text-sm text-blue-800">
                        {t('result_prefix')}
                        {testResult}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 mb-2 border-b border-border-default">
        <div className="flex flex-col space-y-6 p-2 pl-0">
          <div className="flex">
            <div className="w-[300px] text-sm flex-shrink-0 whitespace-nowrap">
              {t('odds_settings_label')}
            </div>
            <div className="w-[600px] flex flex-wrap gap-2 flex-shrink-0">
              <div className="flex w-full items-center">
                <div className="flex gap-2 w-[270px] items-center flex-shrink-0">
                  <Checkbox
                    id="oddsLessThan"
                    onCheckedChange={() => setCheckboxStates('oddsLessThan')}
                    checked={Boolean(checkboxStates.oddsLessThan)}
                  />

                  <label
                    htmlFor="oddsLessThan"
                    className="cursor-pointer whitespace-nowrap text-sm font-semibold"
                  >
                    {t('dont_bet_odds_less')}
                  </label>
                </div>
                <div className="w-[130px] flex-shrink-0">
                  <InputNumber
                    disabled={!checkboxStates.oddsLessThan}
                    precision={2}
                    step={0.01}
                    min={-1.0}
                    max={1.0}
                    value={Number(inputValuesOddsSetting.oddsLessThanValue)}
                    onChange={(value) =>
                      setInputValuesOddsSetting({
                        oddsLessThanValue: Number(value)
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex w-full items-center">
                <div className="flex gap-2 w-[270px] items-center flex-shrink-0">
                  <Checkbox
                    id="oddsMoreThan"
                    onCheckedChange={() => setCheckboxStates('oddsMoreThan')}
                    checked={Boolean(checkboxStates.oddsMoreThan)}
                  />

                  <label
                    htmlFor="oddsMoreThan"
                    className="cursor-pointer whitespace-nowrap text-sm font-semibold"
                  >
                    {t('dont_bet_odds_greater')}
                  </label>
                </div>
                <div className="w-[130px] flex-shrink-0">
                  <InputNumber
                    disabled={!checkboxStates.oddsMoreThan}
                    precision={2}
                    step={0.01}
                    min={-1.0}
                    max={1.0}
                    value={Number(inputValuesOddsSetting.oddsMoreThanValue)}
                    onChange={(value) =>
                      setInputValuesOddsSetting({
                        oddsMoreThanValue: Number(value)
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex w-full items-center">
                <div className="flex gap-2 w-[270px] items-center flex-shrink-0">
                  <Checkbox
                    id="gameCommissionMoreThan"
                    onCheckedChange={() => setCheckboxStates('gameCommissionMoreThan')}
                    checked={Boolean(checkboxStates.gameCommissionMoreThan)}
                  />

                  <label
                    htmlFor="gameCommissionMoreThan"
                    className="cursor-pointer whitespace-nowrap text-sm font-semibold"
                  >
                    {t('dont_bet_commission_greater')}
                  </label>
                </div>
                <div className="w-[130px] flex-shrink-0">
                  <InputNumber
                    disabled={!checkboxStates.gameCommissionMoreThan}
                    precision={2}
                    step={0.01}
                    min={-1.0}
                    max={1.0}
                    value={Number(inputValuesOddsSetting.gameCommissionMoreThanValue)}
                    onChange={(value) =>
                      setInputValuesOddsSetting({
                        gameCommissionMoreThanValue: Number(value)
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex w-full items-center">
                <div className="flex gap-2 w-[270px] items-center flex-shrink-0">
                  <Checkbox
                    id="gameCommissionLessThan"
                    onCheckedChange={() => setCheckboxStates('gameCommissionLessThan')}
                    checked={Boolean(checkboxStates.gameCommissionLessThan)}
                  />

                  <label
                    htmlFor="gameCommissionLessThan"
                    className="cursor-pointer whitespace-nowrap text-sm font-semibold"
                  >
                    {t('dont_bet_commission_less')}
                  </label>
                </div>
                <div className="w-[130px] flex-shrink-0">
                  <InputNumber
                    disabled={!checkboxStates.gameCommissionLessThan}
                    precision={2}
                    step={0.01}
                    min={-1.0}
                    max={1.0}
                    value={Number(inputValuesOddsSetting.gameCommissionLessThanValue)}
                    onChange={(value) =>
                      setInputValuesOddsSetting({
                        gameCommissionLessThanValue: Number(value)
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 mb-2">
        <div className="flex flex-col space-y-6 p-2 pl-0">
          <div className="flex">
            <div className="w-[300px] text-sm flex-shrink-0 whitespace-nowrap">
              {t('bet_amount_randomizer')}
            </div>
            <div className="w-[400px] flex flex-wrap gap-2 flex-shrink-0">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <SwitchCustom
                    disabled={isTrialAccount}
                    checked={Boolean(enableRandomizer)}
                    onCheckedChange={() => setRandomizerEnabled(Number(!enableRandomizer))}
                  />
                  <span className="text-sm font-medium">{t('enable', { ns: 'layout' })}</span>
                </div>
                <div className="text-[#94979C] font-normal text-sm whitespace-nowrap">
                  {t('effective_bet_amount_eg2')}
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
                    disabled={!enableRandomizer}
                    value={Number(fromRandomizer)}
                    onChange={(value) => {
                      setFromValue(String(value))
                    }}
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
                    disabled={!enableRandomizer}
                    value={Number(toRandomizer)}
                    onChange={(value) => {
                      setToValue(String(value))
                    }}
                  />
                </div>
              </div>

              <div className="w-full">
                <div className="text-sm mb-1  font-medium whitespace-nowrap">
                  {t('calculated_effective_bet_amount')}
                </div>
                <div
                  className={`text-sm font-medium p-1 rounded border text-center border-border-default  whitespace-nowrap ${
                    enableRandomizer ? '' : 'text-gray-600'
                  }`}
                >
                  {effectiveBetAmount}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BettingConfig
