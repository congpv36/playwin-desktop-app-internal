import React, { Dispatch, SetStateAction, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'

import { Button } from '@renderer/components/ui/button'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Input } from '@renderer/components/ui/input'
import { InputNumber } from '@renderer/components/ui/input-number'
import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { PlatformPairContext } from '@renderer/context/PlatformPairContext'
import { handleDataRange } from '@renderer/lib/handleDataRange'
import { handleDataTableMinutes } from '@renderer/lib/handleDataTableMinutes'
import { updateObject } from '@renderer/lib/updateBetTo'

import { BetToType, RangeType, RowType } from '@shared/common/types'
import { CHECK_BOX_DETAIL_SETTING, HDP_OPTIONS } from '@shared/renderer/constants'

interface LineRangeData {
  betOnAllTypes: boolean
  betOnSelectedTypes: boolean
  gameTypes: {
    today: boolean
    early: boolean
    running: boolean
    allMinutes: boolean
  }
  minutesRanges: RowType[]
  checkOdds: boolean
  oddsFrom: number
  oddsTo: number
}

const LineRangeSettingsModal = ({
  setShowAmountRounderSetting,
  typeSportBook,
  lineKey
}: {
  setShowAmountRounderSetting: Dispatch<SetStateAction<boolean>>
  typeSportBook: 'sportBook1' | 'sportBook2'
  lineKey: string
}) => {
  const { t } = useTranslation(['main', 'layout'])
  const { Combination } = useContext(PlatformPairContext)
  const { currentPlatformPair, listPlatformPair, setListPlatformPair } = Combination

  const [isSaving, setIsSaving] = useState(false)

  const [dataBetTo, setDataBetTo] = useState<BetToType>(() => {
    if (lineKey && currentPlatformPair?.[typeSportBook]?.[`${lineKey}_Detail`]) {
      return currentPlatformPair[typeSportBook][`${lineKey}_Detail`]?.betTo || {}
    }
    const firstEnabledSetting = CHECK_BOX_DETAIL_SETTING.find(
      (item) => currentPlatformPair?.[typeSportBook]?.[item.key] === 1
    )
    return firstEnabledSetting
      ? currentPlatformPair[typeSportBook][`${firstEnabledSetting.key}_Detail`]?.betTo || {}
      : {}
  })

  const initializeLineRangeData = (): LineRangeData => {
    if (!currentPlatformPair?.[typeSportBook]) {
      return {
        betOnAllTypes: true,
        betOnSelectedTypes: false,
        gameTypes: {
          today: false,
          early: false,
          running: false,
          allMinutes: false
        },
        minutesRanges: [{ id: uuidv4(), minutesFrom: '', minutesTo: '' }],
        checkOdds: false,
        oddsFrom: 0.01,
        oddsTo: 0.01
      }
    }

    const rangeData = (() => {
      if (lineKey && currentPlatformPair?.[typeSportBook]?.[`${lineKey}_Detail`]) {
        return currentPlatformPair[typeSportBook][`${lineKey}_Detail`]?.range
      }
      const firstEnabledSetting = CHECK_BOX_DETAIL_SETTING.find(
        (item) => currentPlatformPair[typeSportBook][item.key] === 1
      )
      return firstEnabledSetting
        ? currentPlatformPair[typeSportBook][`${firstEnabledSetting.key}_Detail`]?.range
        : null
    })()

    const initialMinutesRanges =
      rangeData?.arrayMinutes?.map((item: { minutesFrom: string; minutesTo: string }) => ({
        id: uuidv4(),
        minutesFrom: item.minutesFrom || '',
        minutesTo: item.minutesTo || ''
      })) || []

    initialMinutesRanges.push({ id: uuidv4(), minutesFrom: '', minutesTo: '' })

    return {
      betOnAllTypes: rangeData?.betAll === 1,
      betOnSelectedTypes: rangeData?.betAll !== 1,
      gameTypes: {
        today: rangeData?.today === 1 || false,
        early: rangeData?.early === 1 || false,
        running: rangeData?.running === 1 || false,
        allMinutes: rangeData?.allMinutes === 1 || false
      },
      minutesRanges:
        initialMinutesRanges.length > 0
          ? initialMinutesRanges
          : [{ id: uuidv4(), minutesFrom: '', minutesTo: '' }],
      checkOdds: rangeData?.checkOdd === 1 || false,
      oddsFrom: parseFloat(rangeData?.oddFrom) || 0.01,
      oddsTo: parseFloat(rangeData?.oddTo) || 0.01
    }
  }

  const [lineRangeData, setLineRangeData] = useState<LineRangeData>(initializeLineRangeData)

  // BetTo logic với flag tracking
  const updateHdp = (field: string, value: number) => {
    if (field === 'selectAll') {
      const newState = HDP_OPTIONS.reduce((acc, hdp) => {
        acc[hdp.key] = value
        return acc
      }, {} as BetToType)

      setDataBetTo({
        ...newState,
        selectAll: value
      })
    } else {
      const updatedData = { ...dataBetTo, [field]: value }
      const allSelected = HDP_OPTIONS.every((hdp) => updatedData[hdp.key])
      updatedData.selectAll = Number(allSelected)

      setDataBetTo(updatedData)
    }
  }

  // Handle range settings với flag tracking
  const handleRangeTypeChange = (value: string) => {
    setLineRangeData((prev) => ({
      ...prev,
      betOnAllTypes: value === 'betOnAllTypes',
      betOnSelectedTypes: value === 'betOnSelectedTypes'
    }))
  }

  const handleGameTypeChange = (
    gameType: keyof typeof lineRangeData.gameTypes,
    checked: boolean
  ) => {
    setLineRangeData((prev) => ({
      ...prev,
      gameTypes: {
        ...prev.gameTypes,
        [gameType]: checked
      }
    }))
  }

  const handleInputChange = (id: string, field: 'minutesFrom' | 'minutesTo', value: string) => {
    if (value !== '' && !/^\d+$/.test(value)) {
      return
    }

    setLineRangeData((prev) => {
      const updatedRanges = prev.minutesRanges.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )

      const currentRowIndex = prev.minutesRanges.findIndex((row) => row.id === id)
      const isLastRow = currentRowIndex === prev.minutesRanges.length - 1
      const currentRow = updatedRanges[currentRowIndex]

      if (isLastRow && currentRow.minutesFrom && currentRow.minutesTo) {
        updatedRanges.push({ id: uuidv4(), minutesFrom: '', minutesTo: '' })
      }

      return {
        ...prev,
        minutesRanges: updatedRanges
      }
    })
  }

  const handleCheckOdds = (checked: boolean) => {
    setLineRangeData((prev) => ({
      ...prev,
      checkOdds: checked
    }))
  }

  const handleOddsChange = (field: 'oddsFrom' | 'oddsTo', value: number) => {
    setLineRangeData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  // Function để update AccountPairContext một cách an toàn
  const updateAccountPairContext = (betToData: BetToType, rangeData: RangeType) => {
    if (!currentPlatformPair || !lineKey) return false

    try {
      // Update chỉ line được chỉ định, tránh conflict với các component khác
      const updatedAccountPair = {
        ...currentPlatformPair,
        [typeSportBook]: {
          ...currentPlatformPair[typeSportBook],
          [`${lineKey}_Detail`]: {
            ...currentPlatformPair[typeSportBook][`${lineKey}_Detail`],
            range: rangeData,
            betTo: betToData,
            lastUpdated: Date.now() // Thêm timestamp để track
          }
        }
      }

      // Update list với debounce để tránh multiple updates
      const updatedList = listPlatformPair.map((pair) =>
        pair.id === currentPlatformPair.id ? updatedAccountPair : pair
      )

      setListPlatformPair(updatedList)
      return true
    } catch (error) {
      console.error('Error updating platform pair context:', error)
      return false
    }
  }

  // Save settings với proper error handling
  const handleSave = async () => {
    if (!currentPlatformPair || !lineKey || isSaving) return

    setIsSaving(true)

    try {
      // Prepare range data
      const dataArrayMinutes = handleDataTableMinutes(lineRangeData.minutesRanges)
      const rangeData: RangeType = {
        betAll: lineRangeData.betOnAllTypes ? 1 : 0,
        today: lineRangeData.gameTypes.today ? 1 : 0,
        early: lineRangeData.gameTypes.early ? 1 : 0,
        running: lineRangeData.gameTypes.running ? 1 : 0,
        allMinutes: lineRangeData.gameTypes.allMinutes ? 1 : 0,
        checkOdd: lineRangeData.checkOdds ? 1 : 0,
        oddFrom: lineRangeData.oddsFrom.toString(),
        oddTo: lineRangeData.oddsTo.toString(),
        arrayMinutes: dataArrayMinutes
      }

      const dataRangeUpdate = handleDataRange(rangeData)

      // Process BetTo data
      updateObject(dataBetTo)

      // Update context
      const success = updateAccountPairContext(dataBetTo, dataRangeUpdate)

      if (success) {
        setShowAmountRounderSetting(false)
      } else {
        console.error('Failed to save changes')
        // Có thể thêm notification error ở đây
      }
    } catch (error) {
      console.error('Error saving line range settings:', error)
      // Có thể thêm notification error ở đây
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setShowAmountRounderSetting(false)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowAmountRounderSetting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-lg w-full max-h-[80vh] overflow-auto ${lineKey.includes('PK') ? 'min-w-[400px] max-w-[400px]' : 'min-w-5xl max-w-5xl'}`}
      >
        <div className="px-6 py-4 border-b border-border-default">
          <h2 className="font-semibold  flex items-center gap-2">
            {lineKey} - {lineKey.includes('PK') ? 'Range Settings' : t('line_range_settings')} (
            {typeSportBook === 'sportBook1' ? t('sportsbook_1') : t('sportsbook_2')})
          </h2>
        </div>

        <div className={lineKey.includes('PK') ? 'block' : 'flex'}>
          {!lineKey.includes('PK') && (
            <div className="w-2/3 border-r border-border-default">
              <div className="p-2 border-b border-border-default font-semibold ">
                <label className="flex items-center">
                  <Checkbox
                    checked={Boolean(dataBetTo.selectAll)}
                    onCheckedChange={(checked) =>
                      updateHdp('selectAll', Number(checked as boolean))
                    }
                  />
                  <span className="ml-2  text-sm font-medium">{t('select_all')}</span>
                </label>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-8 gap-2">
                  {HDP_OPTIONS.map((hdp: { key: string; label: string }) => (
                    <label key={`${hdp.key}_${typeSportBook}`} className="inline-flex items-center">
                      <Checkbox
                        checked={Boolean(dataBetTo[hdp.key])}
                        onCheckedChange={(checked) =>
                          updateHdp(hdp.key, Number(checked as boolean))
                        }
                      />
                      <span
                        className={`ml-1 text-sm cursor-pointer ${
                          dataBetTo[hdp.key] === 1 ? ' font-medium' : ''
                        }`}
                      >
                        {hdp.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className={lineKey.includes('PK') ? 'w-full' : 'w-1/3'}>
            <div className="p-2 border-b border-border-default  text-sm font-semibold ">
              Range Settings
            </div>
            <div className="p-4">
              <div className="flex items-center pb-4 border-b pt-2 border-border-default">
                <RadioGroup
                  value={lineRangeData.betOnAllTypes ? 'betOnAllTypes' : 'betOnSelectedTypes'}
                  onValueChange={handleRangeTypeChange}
                  className="flex justify-center w-full gap-5"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="betOnAllTypes" id="betOnAllTypes" />
                    <Label htmlFor="betOnAllTypes" className="font-medium ">
                      {t('bet_on_all')}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="betOnSelectedTypes" id="betOnSelectedTypes" />
                    <Label htmlFor="betOnSelectedTypes" className="font-medium ">
                      {t('bet_on_selected')}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex">
                <div className="w-1/3 pt-3 text-white text-sm">{t('game_type')}</div>
                <div className="grid grid-cols-2 gap-2 pt-3 w-2/3">
                  <label className="inline-flex items-center w-fit">
                    <Checkbox
                      checked={lineRangeData.gameTypes.today}
                      onCheckedChange={(checked) =>
                        handleGameTypeChange('today', checked as boolean)
                      }
                      disabled={lineRangeData.betOnAllTypes}
                    />
                    <span className="ml-1 text-sm">{t('today')}</span>
                  </label>
                  <label className="inline-flex items-center w-fit">
                    <Checkbox
                      checked={lineRangeData.gameTypes.early}
                      onCheckedChange={(checked) =>
                        handleGameTypeChange('early', checked as boolean)
                      }
                      disabled={lineRangeData.betOnAllTypes}
                    />
                    <span className="ml-1 text-sm">{t('early')}</span>
                  </label>
                  <label className="inline-flex items-center w-fit">
                    <Checkbox
                      checked={lineRangeData.gameTypes.running}
                      onCheckedChange={(checked) =>
                        handleGameTypeChange('running', checked as boolean)
                      }
                      disabled={lineRangeData.betOnAllTypes}
                    />
                    <span className="ml-1 text-sm">{t('running')}</span>
                  </label>
                  <label className="inline-flex items-center w-fit">
                    <Checkbox
                      checked={lineRangeData.gameTypes.allMinutes}
                      onCheckedChange={(checked) =>
                        handleGameTypeChange('allMinutes', checked as boolean)
                      }
                      disabled={
                        lineRangeData.betOnAllTypes || lineRangeData.gameTypes.running === false
                      }
                    />
                    <span className="ml-1  text-sm">{t('all_minutes')}</span>
                  </label>
                </div>
              </div>

              <div className="block pt-3">
                <div className=" rounded-lg border border-border-default overflow-hidden">
                  <div className="px-3 py-2  border-b border-border-default">
                    <div className="grid grid-cols-[25px_1fr_1fr] gap-3 font-semibold  text-sm">
                      <div>#</div>
                      <div>{t('minutes_from')}</div>
                      <div>{t('minutes_to')}</div>
                    </div>
                  </div>

                  <div className="overflow-y-auto h-48">
                    {lineRangeData.minutesRanges.map((row, index) => (
                      <div
                        key={row.id}
                        className={`px-3 py-2   grid grid-cols-[25px_1fr_1fr] gap-3 items-center ${
                          index !== lineRangeData.minutesRanges.length - 1
                            ? 'border-b border-border-default'
                            : ''
                        }`}
                      >
                        <div className="text-gray-400 text-sm">{index + 1}</div>
                        <Input
                          type="text"
                          value={row.minutesFrom}
                          onChange={(e) => handleInputChange(row.id, 'minutesFrom', e.target.value)}
                          disabled={
                            lineRangeData.betOnAllTypes || lineRangeData.gameTypes.allMinutes
                          }
                          className="bg-transparent border border-border-default rounded px-2 py-1  focus:border-brand-color focus:outline-none disabled:opacity-50 text-sm h-8"
                          placeholder={t('from_label')}
                          maxLength={3}
                        />
                        <Input
                          type="text"
                          value={row.minutesTo}
                          onChange={(e) => handleInputChange(row.id, 'minutesTo', e.target.value)}
                          disabled={
                            lineRangeData.betOnAllTypes || lineRangeData.gameTypes.allMinutes
                          }
                          className="bg-transparent border border-border-default rounded px-2 py-1  focus:border-brand-color focus:outline-none disabled:opacity-50 text-sm h-8"
                          placeholder={t('to_label')}
                          maxLength={3}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex py-3 gap-2">
                <label className="w-52 gap-1">
                  <div className="flex items-center">
                    <Checkbox checked={lineRangeData.checkOdds} onCheckedChange={handleCheckOdds} />
                    <span className="ml-1  text-sm">{t('check_odds')}</span>
                  </div>
                </label>
                <div>
                  <div className="pb-1  text-sm">{t('from_label')}</div>
                  <InputNumber
                    value={lineRangeData.oddsFrom}
                    onChange={(value) => handleOddsChange('oddsFrom', value)}
                    disabled={!lineRangeData.checkOdds}
                    precision={2}
                    step={0.01}
                    min={-1}
                    max={1}
                    className="w-full text-sm"
                  />
                </div>
                <div>
                  <div className="pb-1  text-sm">{t('to_label')}</div>
                  <InputNumber
                    value={lineRangeData.oddsTo}
                    onChange={(value) => handleOddsChange('oddsTo', value)}
                    disabled={!lineRangeData.checkOdds}
                    precision={2}
                    step={0.01}
                    min={-1}
                    max={1}
                    className="w-full text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border-default">
          <div className="flex justify-end py-3 px-4">
            <div className="gap-3 flex">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="bg-transparent bg-white text-text-default border-border-default hover:bg-transparent hover:border-gray-600 px-3 py-1 w-32"
                disabled={isSaving}
              >
                {t('cancel', { ns: 'layout' })}
              </Button>
              <Button
                onClick={handleSave}
                className="bg-brand-color px-3 py-1 w-32 text-white"
                disabled={isSaving}
              >
                {isSaving ? t('saving', { ns: 'layout' }) : t('save', { ns: 'layout' })}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(LineRangeSettingsModal)
