import React, { useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Checkbox } from '@renderer/components/ui/checkbox'
import { InputNumber } from '@renderer/components/ui/input-number'
import { Label } from '@renderer/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@renderer/components/ui/tooltip'
import { PlatformPairContext } from '@renderer/context/PlatformPairContext'
import QuestionMarkCircle from '@renderer/icons/question-mark-circle'

const PlatformSetting = ({ typeSportBook }) => {
  const { t } = useTranslation(['main', 'layout'])
  const { Combination } = useContext(PlatformPairContext)
  const { listPlatformPair, setListPlatformPair, currentPlatformPair } = Combination

  const dataAccountPair = useMemo(
    () =>
      typeSportBook === 'sportBook1'
        ? currentPlatformPair.sportBook1
        : currentPlatformPair.sportBook2,
    [typeSportBook, currentPlatformPair]
  )

  const updateField = (field: string, value: string | number) => {
    const updatedList = listPlatformPair.map((item) => {
      if (item.id === currentPlatformPair.id) {
        return {
          ...item,
          [typeSportBook]: {
            ...item[typeSportBook],
            [field]: value
          }
        }
      }
      return item
    })
    setListPlatformPair(updatedList)
  }

  const updateCheckOdd = (value: boolean) => {
    updateField('checkOdd', Number(value))
  }

  const updateBetOpposite = (value: boolean) => {
    updateField('betOpposite', Number(value))
  }

  const updateOddFrom = (value: number) => {
    updateField('oddFrom', value)
  }

  const updateOddTo = (value: number) => {
    updateField('oddTo', value)
  }

  return (
    <div className="flex justify-center items-center">
      <div className="flex flex-col justify-center items-center ">
        <h1 className="text-sm font-bold py-2  ">
          {dataAccountPair ? dataAccountPair.name : '(SportsBook)'}
        </h1>
        <div className="flex gap-6">
          <div className="flex items-center gap-1">
            <Checkbox
              id={`CheckOdds_${typeSportBook}`}
              checked={Boolean(dataAccountPair?.checkOdd)}
              onCheckedChange={updateCheckOdd}
            />
            <Label htmlFor={`CheckOdds_${typeSportBook}`} className=" text-sm whitespace-nowrap">
              {t('check_odds')}
            </Label>
          </div>
          <div className="flex gap-2">
            <InputNumber
              precision={2}
              step={0.01}
              min={-2}
              disabled={!dataAccountPair?.checkOdd}
              value={Number(dataAccountPair?.oddFrom) ?? 0.01}
              onChange={(value) => updateOddFrom(value)}
            />
            <span className="text-gray-400 self-center">{t('to_label')}</span>
            <InputNumber
              precision={2}
              step={0.01}
              max={2}
              disabled={!dataAccountPair?.checkOdd}
              value={Number(dataAccountPair?.oddTo) ?? 0.01}
              onChange={(value) => updateOddTo(value)}
            />
          </div>
        </div>
        <div className="flex items-center mt-5 w-full">
          <div className="flex items-center gap-1">
            <Checkbox
              id={`BetOpposite_${typeSportBook}`}
              checked={Boolean(dataAccountPair?.betOpposite)}
              onCheckedChange={updateBetOpposite}
            />
            <Label htmlFor={`BetOpposite_${typeSportBook}`} className=" text-sm">
              {t('bet_opposite')}
            </Label>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="cursor-default">
                  <QuestionMarkCircle className="text-brand-color size-5" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-gray-50 text-gray-800 border border-gray-300  shadow-lg "
                >
                  <p>{t('bet_opposite_desc')}</p>
                  <p>{t('home_away_over_under')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(PlatformSetting)
