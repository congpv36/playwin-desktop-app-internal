import React, { useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { PlatformPairContext } from '@renderer/context/PlatformPairContext'

const GeneralSetting = ({ typeSportBook }) => {
  const { t } = useTranslation(['main', 'layout'])
  const { Combination } = useContext(PlatformPairContext)
  const { listPlatformPair, setListPlatformPair, currentPlatformPair, setCurrentPlatformPair } =
    Combination

  const dataAccountPair = useMemo(
    () =>
      typeSportBook === 'sportBook1'
        ? currentPlatformPair.sportBook1
        : currentPlatformPair.sportBook2,
    [typeSportBook, currentPlatformPair]
  )

  const updateField = (field: string, value: string) => {
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

    const updatedCurrent = {
      ...currentPlatformPair,
      [typeSportBook]: {
        ...currentPlatformPair[typeSportBook],
        [field]: value
      }
    }

    setListPlatformPair(updatedList)
    setCurrentPlatformPair(updatedCurrent)
  }

  return (
    <>
      <div className="flex justify-center pt-6">
        <RadioGroup
          value={dataAccountPair?.generalSetting}
          onValueChange={(value) => updateField('generalSetting', value)}
          className="flex space-x-2 items-center"
        >
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="BetAll" id={`BetAll${typeSportBook}`} />
            <Label htmlFor={`BetAll${typeSportBook}`} className="text-sm">
              {t('bet_all')}
            </Label>
          </div>
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="NoBet" id={`NoBet_${typeSportBook}`} />
            <Label htmlFor={`NoBet_${typeSportBook}`} className="text-sm">
              {t('no_bet')}
            </Label>
          </div>
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="BetSelected" id={`BetSelected${typeSportBook}`} />
            <Label htmlFor={`BetSelected${typeSportBook}`} className="text-sm">
              {t('bet_selected')}
            </Label>
          </div>
        </RadioGroup>
      </div>
    </>
  )
}

export default React.memo(GeneralSetting)
