import React, { useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Checkbox } from '@renderer/components/ui/checkbox'
import { PlatformPairContext } from '@renderer/context/PlatformPairContext'
import { getBetText } from '@renderer/lib/getBetText'

import { CHECK_BOX_DETAIL_SETTING } from '@shared/renderer/constants'

const DetailedSetting = ({ typeSportBook, handleShowPopupLineRange }) => {
  const { t } = useTranslation(['main', 'layout'])
  const { Combination } = useContext(PlatformPairContext)
  const { listPlatformPair, setListPlatformPair, currentPlatformPair } = Combination

  const dataAccountPair = useMemo(() => {
    return currentPlatformPair[typeSportBook] || {}
  }, [typeSportBook, currentPlatformPair])

  const isBetSelected = dataAccountPair.generalSetting === 'BetSelected'
  const updateField = (field: string, value: number) => {
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

  const updateCheckBox = (key: string, value: boolean) => {
    updateField(key, Number(value))
  }

  const handleShowPopup = ({ key, typeDetail }) => {
    handleShowPopupLineRange(key, typeDetail)
  }

  return (
    <div className="pt-4">
      <div className="text-sm font-semibold mt-3 mb-1 whitespace-nowrap overflow-hidden">
        {t('detailed_settings')}
      </div>
      <div className="flex gap-4">
        {['FT', 'Half'].map((category) => (
          <div key={category} className="flex-1 flex flex-col gap-1.5">
            {CHECK_BOX_DETAIL_SETTING.filter((cb) => cb.key.startsWith(category)).map(
              ({ key, label }) => {
                const labelTextBetTo = getBetText(dataAccountPair[`${key}_Detail`]?.betTo)

                return (
                  <div key={key} className="flex items-center gap-1">
                    <div className="flex gap-1 col-span-4 items-center">
                      <Checkbox
                        disabled={!isBetSelected}
                        className="cursor-pointer"
                        id={`${key}_${typeSportBook}`}
                        checked={Boolean(dataAccountPair[key])}
                        onCheckedChange={(checked) => updateCheckBox(key, checked as boolean)}
                      />
                      <label
                        className="cursor-pointer text-xs font-semibold whitespace-nowrap"
                        htmlFor={`${key}_${typeSportBook}`}
                      >
                        {label}
                      </label>
                    </div>
                    <div className="relative col-span-2">
                      <p
                        className={`${dataAccountPair[key] === 1 ? 'block' : 'hidden'} cursor-pointer underline italic text-blue-color text-xs ${isBetSelected ? '' : 'opacity-50'}`}
                        onClick={() => handleShowPopup({ key, typeDetail: 'BetTo' })}
                      >
                        {key.includes('PK') ? '' : labelTextBetTo}
                      </p>
                    </div>
                    <div className="relative col-span-3">
                      <p
                        className={`${dataAccountPair[key] === 1 ? 'block' : 'hidden'} cursor-pointer text-end underline italic text-blue-color text-xs ${isBetSelected ? '' : 'opacity-50'}`}
                        onClick={() => handleShowPopup({ key, typeDetail: 'Range' })}
                      >
                        {dataAccountPair[`${key}_Detail`]?.range.betAll === 1
                          ? t('range_all')
                          : t('range_custom')}
                      </p>
                    </div>
                  </div>
                )
              }
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default React.memo(DetailedSetting)
