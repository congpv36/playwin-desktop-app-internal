import React, { useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { InputNumber } from '@renderer/components/ui/input-number'
import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { SwitchCustom } from '@renderer/components/ui/switch'
import { PlatformPairContext } from '@renderer/context/PlatformPairContext'

import { AmountRounderSettingType } from '@shared/common/types'

interface AmountRoundingProps {
  sportBook: string
}

const AmountRounderSetting = ({ sportBook }: AmountRoundingProps) => {
  const { t } = useTranslation(['main', 'layout'])
  const { Combination } = useContext(PlatformPairContext)
  const { listPlatformPair, setListPlatformPair, currentPlatformPair } = Combination

  const profile = localStorage.getItem('profile')
  const isTrialAccount = profile ? JSON.parse(profile)?.isTrialAccount : false

  const [isOpen, setIsOpen] = useState(false)
  const [showAlertMsg, setShowAlertMsg] = useState(false)
  const [testRoundingValue, setTestRoundingValue] = useState('4879')
  const [numberTest, setNumberTest] = useState('')

  const dataPlatformPair = useMemo(
    () =>
      sportBook === 'sportBook1' ? currentPlatformPair.sportBook1 : currentPlatformPair.sportBook2,
    [sportBook, currentPlatformPair]
  )

  const amountRounderSetting = useMemo(
    () =>
      dataPlatformPair?.amountRounderSetting || {
        rounder: 0,
        roundType: 'roundDown',
        roundValue: 5
      },
    [dataPlatformPair]
  )

  const updateRounder = (checked: boolean) => {
    const updatedSetting = { ...amountRounderSetting, rounder: checked ? 1 : 0 }
    updateAmountRounderSetting(updatedSetting)
  }

  const updateRoundType = (value: string) => {
    const updatedSetting = { ...amountRounderSetting, roundType: value }
    updateAmountRounderSetting(updatedSetting)
  }

  const updateRoundValue = (value: string) => {
    const updatedSetting = { ...amountRounderSetting, roundValue: value }
    updateAmountRounderSetting(updatedSetting)
  }

  const updateAmountRounderSetting = (newSetting: AmountRounderSettingType) => {
    if (!currentPlatformPair) return

    const updatedPlatformPair = {
      ...currentPlatformPair,
      [sportBook]: {
        ...dataPlatformPair,
        amountRounderSetting: newSetting
      }
    }

    const updatedList = listPlatformPair.map((pair) => {
      if (pair.id === currentPlatformPair.id) {
        return updatedPlatformPair
      }
      return pair
    })
    setListPlatformPair(updatedList)
    Combination.setCurrentPlatformPair(updatedPlatformPair)
  }

  const testRounder = () => {
    if (!testRoundingValue) return

    const amount = parseFloat(testRoundingValue)
    const roundValue = Number(amountRounderSetting.roundValue)
    let result = amount

    switch (amountRounderSetting.roundType) {
      case 'roundDown':
        result = Math.floor(amount / roundValue) * roundValue
        break
      case 'roundUp':
        result = Math.ceil(amount / roundValue) * roundValue
        break
      case 'auto':
        result = Math.round(amount / roundValue) * roundValue
        break
    }

    setNumberTest(result.toString())

    setShowAlertMsg(true)
    setTimeout(() => {
      setShowAlertMsg(false)
    }, 2000)
  }

  const onToggle = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      <div className="pt-4">
        <div className={`h-full duration-300 ease-in-out z-10`}>
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border rounded-[6px] px-2 py-[2px] border-border-default bg-white">
              <h3 className="text-sm font-medium">{t('amount_rounding')}</h3>

              <Button variant="plain-white" size="sm" onClick={onToggle}>
                {isOpen ? (
                  <>
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 18 8"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11 6.5L6 1.5L1 6.5"
                        stroke="#94979C"
                        strokeWidth="1.66667"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                ) : (
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 18 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 1.5L6 6.5L11 1.5"
                      stroke="#94979C"
                      strokeWidth="1.66667"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </Button>
            </div>
            <div
              className={`flex-1 overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="overflow-y-auto pt-5 h-full">
                <div className="space-y-4">
                  {/* Enable Checkbox */}
                  <div className="flex items-center space-x-2">
                    <SwitchCustom
                      disabled={isTrialAccount}
                      checked={Boolean(amountRounderSetting.rounder)}
                      onCheckedChange={(value) => {
                        updateRounder(value)
                      }}
                    />
                    <Label htmlFor="amount-rounder-enabled" className="cursor-pointer">
                      {t('amount_rounding_enabled')}
                    </Label>
                  </div>

                  {/* Settings Content */}
                  <div className={`space-y-4`}>
                    {/* Round Type */}
                    <div className="space-y-2">
                      <Label className="">{t('round_type')}</Label>
                      <RadioGroup
                        disabled={!amountRounderSetting.rounder}
                        value={amountRounderSetting.roundType}
                        onValueChange={updateRoundType}
                        className="flex justify-center items-center"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="roundDown" id="round-down" />
                          <Label htmlFor="round-down" className="cursor-pointer">
                            {t('round_down')}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="roundUp" id="round-up" />
                          <Label htmlFor="round-up" className="cursor-pointer">
                            {t('round_up')}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="auto" id="auto" />
                          <Label htmlFor="auto" className="cursor-pointer">
                            {t('auto_mode')}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Rounding Number */}
                    <div className="space-y-2">
                      <Label className="">{t('rounding_number')}</Label>
                      <InputNumber
                        disabled={!amountRounderSetting.rounder}
                        value={Number(amountRounderSetting.roundValue)}
                        onChange={(value) => {
                          updateRoundValue(Number(value).toString())
                        }}
                        min={1}
                        max={8}
                        precision={0}
                        className="w-20"
                      />
                    </div>

                    {/* Test Rounding */}
                    <div className="space-y-2">
                      <Label className="">{t('test_rounding')}</Label>
                      <div className="relative">
                        <Input
                          disabled={!amountRounderSetting.rounder}
                          value={testRoundingValue}
                          onChange={(e) => {
                            const value = e.target.value
                            if (/^\d*$/.test(value)) {
                              setTestRoundingValue(value)
                            }
                          }}
                          button={{
                            text: 'Test',
                            onClick: testRounder
                          }}
                        />
                        {showAlertMsg && (
                          <div className="absolute top-0 right-14 mt-1 bg-blue-100 border border-blue-300 rounded px-2 py-1 text-sm text-blue-800">
                            {t('result_prefix')}
                            {numberTest}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default React.memo(AmountRounderSetting)
