import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import BoxLabel from '@renderer/layouts/BoxLabel'

import { Modal } from '@renderer/components/Common/Modal'
import { NotificationError } from '@renderer/components/NotificationPopup/NotificationError'
import { Button } from '@renderer/components/ui/button'
import { BettingModeState } from '@renderer/context/SettingContext'
import { calculateRoundedValue } from '@renderer/lib/calculateRoundedValue'
import InformationCircle from '@renderer/icons/information-circle'

export const AmountRounderSettingPopup = ({
  bettingModeState,
  setShowAmountRounderSetting,
  setBettingModeState
}: {
  bettingModeState: BettingModeState
  setShowAmountRounderSetting: Dispatch<SetStateAction<boolean>>
  setBettingModeState: (dataAmountRounderSetting) => void
}) => {
  const { t } = useTranslation(['main', 'layout'])

  useEffect(() => {
    setSelectedValue(bettingModeState.roundType)
    setRoundingNumber(Number(bettingModeState.roundingNumber))
    setIsEnabled(Boolean(bettingModeState.amountRoundingEnabled))
  }, [bettingModeState])

  const [selectedValue, setSelectedValue] = useState('Auto')
  const [roundingNumber, setRoundingNumber] = useState(1)
  const [isEnabled, setIsEnabled] = useState(false)

  const [testRoundingValue, setTestRoundingValue] = useState('4879')
  const [numberTest, setNumberTest] = useState<string | null>(null)

  const [showAlertMsg, setShowAlertMsg] = useState(false)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedValue(event.target.value)
  }

  const handleCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    targetSetter: Dispatch<SetStateAction<boolean>>
  ) => {
    targetSetter(event.target.checked)
  }

  const handleTest = () => {
    const value = parseInt(testRoundingValue, 10)

    if (isNaN(value)) {
      setTestRoundingValue('0')
      setNumberTest('0')
      setShowAlertMsg(true)
      return
    }

    const roundedValue = calculateRoundedValue(
      value,
      testRoundingValue,
      roundingNumber,
      selectedValue
    )

    setNumberTest(roundedValue + '')
    setShowAlertMsg(true)
  }

  const handleOK = () => {
    setBettingModeState({
      amountRoundingEnabled: +isEnabled,
      roundType: selectedValue,
      roundingNumber
    })
    setShowAmountRounderSetting(false)
  }

  return (
    <Modal title={t('amount_rounder_setting')} onClose={() => setShowAmountRounderSetting(false)}>
      <div className="flex flex-col bg-layout-color h-[280px] rounded-b-xl pt-2">
        <div className="flex h-full p-2 relative">
          <BoxLabel label={t('amount_rounder')} className="w-[300px]">
            <div className="p-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="AmountRounder"
                  checked={isEnabled}
                  onChange={(e) => handleCheckboxChange(e, setIsEnabled)}
                />
                <label htmlFor="AmountRounder" className="ml-2">
                  {t('amount_rounding_enabled')}
                </label>
              </div>
              <div className="pl-6 pt-6">
                <div className="flex flex-col gap-1 mb-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="group1"
                      value="roundDown"
                      checked={selectedValue === 'roundDown'}
                      onChange={handleChange}
                    />
                    <span className="ml-1">{t('round_down')}</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="group1"
                      value="roundUp"
                      checked={selectedValue === 'roundUp'}
                      onChange={handleChange}
                    />
                    <span className="ml-1">{t('round_up')}</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="group1"
                      value="Auto"
                      checked={selectedValue === 'Auto'}
                      onChange={handleChange}
                    />
                    <span className="ml-1">{t('auto_mode')}</span>
                  </label>
                </div>
                <div className="flex flex-col gap-2">
                  <div>
                    <span className="w-32 inline-block">{t('rounding_number')}</span>
                    <input
                      type="number"
                      value={roundingNumber}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        setRoundingNumber(Math.max(1, Math.min(8, value)))
                      }}
                      className="border border-gray-500 w-10 outline-none"
                    />
                  </div>
                  <div>
                    <span className="w-32 inline-block">{t('test_rounding')}</span>
                    <input
                      type="text"
                      maxLength={10}
                      value={testRoundingValue}
                      onChange={(e) => {
                        const value = e.target.value
                        if (/^\d*$/.test(value)) {
                          setTestRoundingValue(value)
                        }
                      }}
                      className="border-b-2 border-gray-500 w-20 focus:border-[#0000FF] outline-none"
                    />
                    <span className="text-[#0000FF] text-sm ml-2 underline" onClick={handleTest}>
                      {t('test_now')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </BoxLabel>
          {!isEnabled && (
            <div
              className="bg-layout-color absolute opacity-50 pointer-events-auto right-[11px] top-[57px] z-50"
              style={{ width: '291px', height: '169px' }}
            />
          )}
        </div>
        <div className="flex justify-end rounded-b-xl">
          <Button
            variant="outline"
            className="bg-white border border-gray-400 border-solid h-6 w-20 hover:border-blue-500 leading-none mr-2 my-2 px-8"
            onClick={handleOK}
          >
            {t('ok', { ns: 'layout' })}
          </Button>
        </div>
      </div>
      <NotificationError
        title={t('message', { ns: 'layout' })}
        messageError={`${t('rounding_result')}${numberTest}`}
        showAlertDialog={showAlertMsg}
        setShowAlertDialog={setShowAlertMsg}
        ReactElement={<InformationCircle className="text-blue-500 mr-1" />}
      />
    </Modal>
  )
}
