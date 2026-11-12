import React from 'react'
import { useTranslation } from 'react-i18next'

import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'

interface Prop {
  strategy: string
  handleChangeStrategy: (e: string) => void
}

const ContraStrategy = ({ strategy, handleChangeStrategy }: Prop) => {
  const { t } = useTranslation(['main', 'layout'])
  return (
    <div className="flex items-center gap-5 min-w-[420px]">
      <p>{t('contra_strategy_label')}</p>
      <RadioGroup className="flex gap-5" value={strategy} onValueChange={handleChangeStrategy}>
        <div className="flex items-center gap-1">
          <RadioGroupItem value="auto" id="auto" />
          <Label htmlFor="auto" className="cursor-pointer">
            {t('auto_mode')}
          </Label>
        </div>
        <div className="flex items-center gap-1">
          <RadioGroupItem value="manual" id="manual" />
          <Label htmlFor="manual" className="cursor-pointer">
            {t('manual')}
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}

export default React.memo(ContraStrategy)
