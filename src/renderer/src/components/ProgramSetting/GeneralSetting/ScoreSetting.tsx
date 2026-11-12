import { useContext, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { InputNumber } from '@renderer/components/ui/input-number'
import { SwitchCustom } from '@renderer/components/ui/switch'
import { SettingContext } from '@renderer/context/SettingContext'

function ScoreSetting() {
  const containerRef = useRef(null)

  const context = useContext(SettingContext)
  if (!context) return null

  const { t } = useTranslation(['main', 'layout'])

  const { settingTotalGoal, setSettingTotalGoal } = context.totalGoal
  const { settingScoreList, setSettingScoreList } = context.scoreList

  const handleToggleTotalGoal = (checked) => {
    setSettingTotalGoal((prev) => ({
      ...prev,
      enable: checked ? 1 : 0
    }))
  }

  const handleChangeTotalGoal = (field, value) => {
    setSettingTotalGoal((prev) => ({
      ...prev,
      [field]: value ?? 0
    }))
  }

  const cleanList = (list) => {
    const filtered = list.filter((row, index) => row.home || row.away || index === list.length - 1)
    return filtered.length ? filtered : [{ home: '', away: '' }]
  }

  const handleChangeScore = (index, field, value) => {
    const numericValue = value.replace(/[^0-9]/g, '')

    const newList = [...settingScoreList.list]
    newList[index][field] = numericValue

    const isLastRow = index === newList.length - 1
    const hasValue = newList[index].home || newList[index].away

    if (isLastRow && hasValue) {
      newList.push({ home: '', away: '' })
    }

    setSettingScoreList((prev) => ({
      ...prev,
      list: cleanList(newList)
    }))
  }

  const handleToggleScoreList = (checked) => {
    setSettingScoreList((prev) => ({
      ...prev,
      enable: checked ? 1 : 0
    }))
  }

  return (
    <div className="mb-5">
      <h1 className="text-sm font-semibold mb-5 border-b pb-2 border-border-default">
        {t('score_settings')}
      </h1>

      <div className="flex flex-col space-y-6 p-2 pl-0">
        <div className="flex">
          <div className="w-[300px] text-sm flex-shrink-0">{t('check_total_goal')}</div>

          <div className="w-[400px] text-sm flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <SwitchCustom
                checked={!!settingTotalGoal.enable}
                onCheckedChange={handleToggleTotalGoal}
              />
              <span className="text-sm font-medium">{t('enable', { ns: 'layout' })}</span>
            </div>

            <div className="flex gap-2">
              <div className="w-1/2">
                <div className="text-sm mb-[6px]">{t('from_label')}</div>
                <InputNumber
                  precision={0}
                  min={0}
                  max={100}
                  step={1}
                  disabled={!settingTotalGoal.enable}
                  value={settingTotalGoal.from}
                  onChange={(value) => handleChangeTotalGoal('from', value)}
                />
              </div>

              <div className="w-1/2">
                <div className="text-sm mb-[6px]">{t('to_label')}</div>
                <InputNumber
                  precision={0}
                  min={0}
                  max={100}
                  step={1}
                  disabled={!settingTotalGoal.enable}
                  value={settingTotalGoal.to}
                  onChange={(value) => handleChangeTotalGoal('to', value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex">
          <div className="w-[300px] text-sm flex-shrink-0">{t('check_score_list')}</div>

          <div className="w-[400px] flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <SwitchCustom
                checked={!!settingScoreList.enable}
                onCheckedChange={handleToggleScoreList}
              />
              <span className="text-sm font-medium">{t('enable', { ns: 'layout' })}</span>
            </div>

            <div
              className={`border rounded-lg border-border-default overflow-hidden${settingScoreList.enable ? ' bg-white' : ''}`}
            >
              <div className="grid grid-cols-2 text-sm font-medium">
                <div className="p-2 ">{t('home_team')}</div>
                <div className="p-2">{t('away_team')}</div>
              </div>

              <div ref={containerRef} className="max-h-[140px] overflow-y-auto">
                {settingScoreList.list.map((row, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-2 border-t border-border-default text-sm"
                  >
                    <input
                      className="px-2 py-[7px] border-r border-border-default outline-none bg-transparent"
                      value={row.home}
                      disabled={!settingScoreList.enable}
                      onChange={(e) => handleChangeScore(index, 'home', e.target.value)}
                    />
                    <input
                      className="px-2 py-[7px] outline-none bg-transparent"
                      value={row.away}
                      disabled={!settingScoreList.enable}
                      onChange={(e) => handleChangeScore(index, 'away', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScoreSetting
