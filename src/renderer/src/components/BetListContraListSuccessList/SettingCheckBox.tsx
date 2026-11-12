import React from 'react'
import { useTranslation } from 'react-i18next'

import { Checkbox } from '@renderer/components/ui/checkbox'

const SettingCheckBox = ({ settings, handleCheckboxChange }) => {
  const { t } = useTranslation(['main', 'layout'])
  return (
    <div className="flex gap-2 w-[260px]">
      <div className="flex items-center mr-[20px]">
        <Checkbox
          id="clear"
          checked={Boolean(settings.clearWhenOver100)}
          onCheckedChange={handleCheckboxChange('clearWhenOver100')}
        />
        <label htmlFor="clear" className="ml-[8px] cursor-pointer">
          {t('clear_when_100_bets')}
        </label>
      </div>
      <div className="flex items-center cursor-pointer">
        <Checkbox
          id="scroll"
          checked={Boolean(settings.enableScroll)}
          onCheckedChange={handleCheckboxChange('enableScroll')}
        />
        <label htmlFor="scroll" className="ml-[8px] cursor-pointer">
          {t('scroll_label')}
        </label>
      </div>
    </div>
  )
}

export default React.memo(SettingCheckBox)
