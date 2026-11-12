import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import BoxLabel from '@renderer/layouts/BoxLabel'

import { SchedulerItem } from '@renderer/components/ProgramSetting/GeneralSetting/GameTypeScheduler/SchedulerItem'
import { SettingContext } from '@renderer/context/SettingContext'

const GameTypeScheduler = () => {
  const context = useContext(SettingContext)
  if (!context) return null

  const { t } = useTranslation(['main', 'layout'])
  const { running, today, early } = context.gameTypeScheduler
  return (
    <BoxLabel label={t('game_type_scheduler')} className="w-[301px]">
      <div className="py-2 px-5 flex flex-col gap-[1.5px]">
        <SchedulerItem label={t('running')} state={running} id="Running_Checkbox_Scheduler" />
        <SchedulerItem label={t('today')} state={today} id="Today_Checkbox_Scheduler" />
        <SchedulerItem label={t('early')} state={early} id="Early_Checkbox_Scheduler" />
      </div>
    </BoxLabel>
  )
}

export default React.memo(GameTypeScheduler)
