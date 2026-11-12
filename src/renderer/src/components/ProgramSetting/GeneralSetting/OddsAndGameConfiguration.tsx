import { useContext } from 'react'
import { useTranslation } from 'react-i18next'

import { InputNumber } from '@renderer/components/ui/input-number'
import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { SettingContext } from '@renderer/context/SettingContext'

import { SchedulerItem } from './GameTypeScheduler/SchedulerItem'

function OddsAndGameConfiguration() {
  const context = useContext(SettingContext)
  if (!context) return null

  const { t } = useTranslation(['main', 'layout'])

  return (
    <div>
      <h1 className="text-sm font-semibold mb-5 border-b pb-2 border-b-border-default whitespace-nowrap">
        {t('odds_game_configuration')}
      </h1>
      <div className="grid grid-cols-1 gap-2 mb-2 border-b border-border-default">
        <div className="flex flex-col p-2 pl-0">
          <div className="flex">
            <div className="w-[300px] text-sm flex-shrink-0 whitespace-nowrap">
              {t('odds_type')}
            </div>
            <div className="w-[400px] flex-shrink-0">
              <div>
                <Select defaultValue="Malay">
                  <SelectTrigger className="w-full bg-white border-border-default">
                    <SelectValue placeholder={t('default_type')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-border-default">
                    <SelectItem value="Malay" className="text-sm">
                      {t('malay')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 mb-2 border-b border-border-default">
        <div className="flex flex-col space-y-6 p-2 pl-0">
          <div className="flex">
            <div className="w-[300px] text-sm flex-shrink-0 whitespace-nowrap">
              {t('profit_commission')}
            </div>
            <div className="w-[400px] flex items-center gap-2 flex-shrink-0">
              <div className="w-1/2">
                <div className="text-sm mb-[6px] whitespace-nowrap">{t('from_label')}</div>
                <InputNumber
                  precision={2}
                  min={-1}
                  max={1}
                  step={0.01}
                  allowNegative={true}
                  value={Number(context.oddsTypeSetting.profitMin)}
                  onChange={(value) => {
                    context.oddsTypeSetting.setProfitMin(value.toString())
                  }}
                />
              </div>
              <div className="w-1/2">
                <div className="text-sm mb-[6px] whitespace-nowrap">{t('to_label')}</div>
                <InputNumber
                  precision={2}
                  min={-1}
                  max={1}
                  step={0.01}
                  allowNegative={true}
                  value={Number(context.oddsTypeSetting.profitMax)}
                  onChange={(value) => {
                    context.oddsTypeSetting.setProfitMax(value.toString())
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 mb-2 border-b border-border-default">
        <div className="flex flex-col space-y-6 p-2 pl-0">
          <div className="flex">
            <div className="w-[300px] text-sm flex-shrink-0 whitespace-nowrap">
              {t('game_type')}
            </div>
            <div className="w-[400px] flex items-center gap-2 flex-shrink-0">
              <div className="flex justify-between w-full">
                <RadioGroup
                  className="flex justify-between w-full"
                  value={context.gameType.gameType}
                  onValueChange={context.gameType.setGameType}
                >
                  <div className="flex items-center space-x-2 whitespace-nowrap">
                    <RadioGroupItem value="Running" id="Running" />
                    <Label htmlFor="Running">{t('running')}</Label>
                  </div>
                  <div className="flex items-center space-x-2 whitespace-nowrap">
                    <RadioGroupItem value="Today" id="Today" />
                    <Label htmlFor="Today">{t('today')}</Label>
                  </div>
                  <div className="flex items-center space-x-2 whitespace-nowrap">
                    <RadioGroupItem value="Early" id="Early" />
                    <Label htmlFor="Early">{t('early')}</Label>
                  </div>
                  <div className="flex items-center space-x-2 whitespace-nowrap">
                    <RadioGroupItem value="None" id="None" />
                    <Label htmlFor="None">{t('none_type')}</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 mb-2">
        <div className="flex flex-col space-y-6 p-2 pl-0">
          <div className="flex">
            <div className="w-[300px] text-sm flex-shrink-0 whitespace-nowrap">
              {t('game_type_scheduler')}
            </div>
            <div className="w-[400px] flex items-center gap-2 flex-shrink-0">
              <div className="flex justify-between w-full">
                <div className="flex flex-col gap-2 w-full text-sm font-semibold">
                  <SchedulerItem
                    label={t('running')}
                    state={context.gameTypeScheduler.running}
                    id="Running_Checkbox_Scheduler"
                  />
                  <SchedulerItem
                    label={t('today')}
                    state={context.gameTypeScheduler.today}
                    id="Today_Checkbox_Scheduler"
                  />
                  <SchedulerItem
                    label={t('early')}
                    state={context.gameTypeScheduler.early}
                    id="Early_Checkbox_Scheduler"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OddsAndGameConfiguration
