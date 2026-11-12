import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import BoxLabel from '@renderer/layouts/BoxLabel'

import { Checkbox } from '@renderer/components/ui/checkbox'
import { InputNumber } from '@renderer/components/ui/input-number'

type SwitchSettings = {
  isSwitchBySuccessCount: number
  isSwitchByCredit: number
  minSuccessCount: string
  maxSuccessCount: string
  maxCredit: string
}

export type RandomDelayLoginSettings = {
  isRandomDelayLogin: number
  minDelayLogin: string
  maxDelayLogin: string
}

type AccountSwitchingSettingProps = {
  settings: SwitchSettings
  onSettingsChange: (newSettings: SwitchSettings) => void
  randomDelaySettings: RandomDelayLoginSettings
  onRandomDelaySettingsChange: (newSettings: RandomDelayLoginSettings) => void
}

const AccountSwitchingSetting: React.FC<AccountSwitchingSettingProps> = ({
  settings,
  onSettingsChange,
  randomDelaySettings,
  onRandomDelaySettingsChange
}) => {
  const { t } = useTranslation(['main', 'layout'])
  const handleChange = (key: string, value: string | number) => {
    onSettingsChange({
      ...settings,
      [key]: value
    })
  }

  const handleRandomDelayChange = (key: keyof RandomDelayLoginSettings, value: string | number) => {
    onRandomDelaySettingsChange({
      ...randomDelaySettings,
      [key]: value
    })
  }

  const isRandomDelayEnabled = Boolean(randomDelaySettings.isRandomDelayLogin)
  const minDelay = Number(randomDelaySettings.minDelayLogin)
  const maxDelay = Number(randomDelaySettings.maxDelayLogin)

  // Track which field the user edited last so the error message points at that field
  const [lastEditedDelayField, setLastEditedDelayField] = useState<'from' | 'to'>('to')

  let randomDelayError = ''
  if (isRandomDelayEnabled) {
    if (minDelay < 0) randomDelayError = t('random_delay_login_from_negative_error')
    else if (minDelay > maxDelay) {
      randomDelayError =
        lastEditedDelayField === 'from'
          ? t('random_delay_login_from_greater_error', { from: minDelay, to: maxDelay })
          : t('random_delay_login_to_less_error', { from: minDelay, to: maxDelay })
    }
  }

  const numericInputProps = {
    type: 'number',
    min: '0',
    step: 1,
    pattern: '[0-9]*',
    onKeyDown: (e: { key: string; preventDefault: () => void }) => {
      if (['e', 'E', '+', ',', '-', '.'].includes(e.key)) e.preventDefault()
      const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab']
      if (!/^[0-9]$/.test(e.key) && !allowedKeys.includes(e.key)) e.preventDefault()
    }
  }

  return (
    <BoxLabel label={t('account_switching_setting')} className="w-full pt-7 pb-2 px-2">
      <div className="flex gap-20">
        {/* Success Count Block */}
        <div className="flex gap-2">
          <div className="flex items-center justify-center">
            <Checkbox
              id="success-count-toggle"
              checked={Boolean(settings.isSwitchBySuccessCount)}
              onCheckedChange={(checked) => handleChange('isSwitchBySuccessCount', Number(checked))}
            />
            <label htmlFor="success-count-toggle" className="mx-1 cursor-pointer text-sm">
              {t('switching_when_bet_success_count')}
            </label>
            <span className="leading-none">{'>'} </span>=
          </div>
          <div className="w-14">
            <InputNumber
              {...numericInputProps}
              precision={0}
              min={1}
              max={45}
              step={1}
              disabled={!settings.isSwitchBySuccessCount}
              value={Number(settings.minSuccessCount)}
              onChange={(value) => {
                handleChange('minSuccessCount', String(value))
              }}
            />
          </div>
          <div className="w-14">
            <InputNumber
              {...numericInputProps}
              precision={0}
              min={1}
              max={45}
              step={1}
              disabled={!settings.isSwitchBySuccessCount}
              value={Number(settings.maxSuccessCount)}
              onChange={(value) => {
                handleChange('maxSuccessCount', String(value))
              }}
            />
          </div>
        </div>

        {/* Credit Block */}
        <div className="flex gap-2">
          <div className="flex items-center justify-center">
            <Checkbox
              id="credit-toggle"
              checked={Boolean(settings.isSwitchByCredit)}
              onCheckedChange={(checked) => handleChange('isSwitchByCredit', Number(checked))}
            />
            <label htmlFor="credit-toggle" className="mx-1 text-sm first-line:cursor-pointer">
              {t('switching_when_bet_credit')}
            </label>
            <span className="leading-none">{'<'}</span> =
          </div>
          <div className="w-20">
            <InputNumber
              {...numericInputProps}
              precision={0}
              min={0}
              max={999999}
              step={1}
              disabled={!settings.isSwitchByCredit}
              value={Number(settings.maxCredit ?? 50)}
              onChange={(value) => {
                handleChange('maxCredit', String(value))
              }}
            />
          </div>
        </div>
      </div>

      {/* Random Delay Login Block */}
      <div className="flex mt-2 gap-20">
        <div className="flex items-center justify-center">
          <Checkbox
            id="random-delay-login-toggle"
            checked={isRandomDelayEnabled}
            onCheckedChange={(checked) =>
              handleRandomDelayChange('isRandomDelayLogin', Number(checked))
            }
          />
          <label htmlFor="random-delay-login-toggle" className="mx-1 cursor-pointer text-sm">
            {t('random_delay_login_setting')}
          </label>
        </div>
        <div className="flex gap-6">
          <div className="flex items-center gap-1 text-sm">
            <span>{t('random_delay_login_from')}</span>
            <div className="w-20">
              <InputNumber
                {...numericInputProps}
                precision={0}
                min={0}
                max={3600}
                step={1}
                disabled={!isRandomDelayEnabled}
                value={minDelay}
                onChange={(value) => {
                  setLastEditedDelayField('from')
                  handleRandomDelayChange('minDelayLogin', String(value))
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span>{t('random_delay_login_to')}</span>
            <div className="w-20">
              <InputNumber
                {...numericInputProps}
                precision={0}
                min={0}
                max={3600}
                step={1}
                disabled={!isRandomDelayEnabled}
                value={maxDelay}
                onChange={(value) => {
                  setLastEditedDelayField('to')
                  handleRandomDelayChange('maxDelayLogin', String(value))
                }}
              />
            </div>
            <span>{t('random_delay_login_seconds')}</span>
          </div>
          {randomDelayError && (
            <p className="self-center text-sm font-semibold text-red-500">{randomDelayError}</p>
          )}
        </div>
      </div>
    </BoxLabel>
  )
}

export default React.memo(AccountSwitchingSetting)
