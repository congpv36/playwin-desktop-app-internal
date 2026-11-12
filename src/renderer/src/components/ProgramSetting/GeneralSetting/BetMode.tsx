import { useContext } from 'react'
import { useTranslation } from 'react-i18next'

import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { SettingContext } from '@renderer/context/SettingContext'

import { BET_MODES } from '@shared/common/constants'

function BetMode() {
  const { t } = useTranslation('main')

  const context = useContext(SettingContext)
  if (!context) return null

  return (
    <div className="mb-5 ">
      <div className="text-base font-semibold mb-5 flex py-2">
        <div className="w-[300px] text-sm font-semibold">{t('bet_mode')}</div>
        <div className=" flex items-center">
          <div className="flex w-full">
            <RadioGroup
              className="flex gap-16"
              value={context.betMode.betMode}
              onValueChange={context.betMode.setBetMode}
            >
              <div className="flex items-center space-x-1 whitespace-nowrap">
                <RadioGroupItem value={`${BET_MODES.Auto}`} id={`${BET_MODES.Auto}`} />
                <Label htmlFor={`${BET_MODES.Auto}`} className="text-sm font-medium">
                  {t('auto')}
                </Label>
              </div>
              <div className="flex items-center space-x-1 whitespace-nowrap">
                <RadioGroupItem value={`${BET_MODES.HomeOnly}`} id={`${BET_MODES.HomeOnly}`} />
                <Label htmlFor={`${BET_MODES.HomeOnly}`} className="text-sm font-medium">
                  {t('home_only')}
                </Label>
              </div>
              <div className="flex items-center space-x-1 whitespace-nowrap">
                <RadioGroupItem value={`${BET_MODES.AwayOnly}`} id={`${BET_MODES.AwayOnly}`} />
                <Label htmlFor={`${BET_MODES.AwayOnly}`} className="text-sm font-medium">
                  {t('away_only')}
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BetMode
