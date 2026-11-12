import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import BoxLabel from '@renderer/layouts/BoxLabel'

import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { SettingContext } from '@renderer/context/SettingContext'

const GameType = () => {
  const context = useContext(SettingContext)
  if (!context) return null

  const { t } = useTranslation(['main', 'layout'])
  const { gameType, setGameType } = context.gameType

  return (
    <BoxLabel label={t('game_type')} className="w-[301px] ">
      <RadioGroup
        value={gameType}
        onValueChange={setGameType}
        className="flex h-full justify-center items-center"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Running" id="Running" className="bg-white" />
          <Label htmlFor="Running">{t('running')}</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Today" id="Today" className="bg-white" />
          <Label htmlFor="Today">{t('today')}</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Early" id="Early" className="bg-white" />
          <Label htmlFor="Early">{t('early')}</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="None" id="None" className="bg-white" />
          <Label htmlFor="None">{t('none_type')}</Label>
        </div>
      </RadioGroup>
    </BoxLabel>
  )
}

export default React.memo(GameType)
