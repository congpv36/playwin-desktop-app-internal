import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import AmountRounderSetting from '@renderer/components/ProgramSetting/PlatformPair/BetSetting/AmountRounderSetting'
import DetailedSetting from '@renderer/components/ProgramSetting/PlatformPair/BetSetting/DetailedSetting'
import GeneralSetting from '@renderer/components/ProgramSetting/PlatformPair/BetSetting/GeneralSetting'
import PlatformSetting from '@renderer/components/ProgramSetting/PlatformPair/BetSetting/PlatformSetting'

import LineRangeSettingsModal from './modal/LineRangeSettingsModal'

const SettingCombinationComponent = () => {
  const { t } = useTranslation(['main', 'layout'])
  const [showPopupLineRangeSetting, setShowPopupLineRangeSetting] = useState(false)
  const [currentPlatformForLineRange, setCurrentPlatformForLineRange] = useState<
    'sportBook1' | 'sportBook2'
  >('sportBook1')
  const [currentLineKey, setCurrentLineKey] = useState('')

  const handleShowPopupLineRange = (
    typeSportBook: 'sportBook1' | 'sportBook2',
    lineKey?: string
  ) => {
    setCurrentPlatformForLineRange(typeSportBook)
    if (lineKey) setCurrentLineKey(lineKey)
    setShowPopupLineRangeSetting(true)
  }

  return (
    <div className="block">
      <div className="border-border-default border-b pt-5 pb-[2px] text-base font-semibold">
        {t('bet_setting')}
      </div>
      <div className="flex ">
        <div className="flex-1">
          <PlatformSetting typeSportBook="sportBook1" />
          <AmountRounderSetting sportBook="sportBook1" />
          <GeneralSetting typeSportBook="sportBook1" />
          <DetailedSetting
            typeSportBook="sportBook1"
            handleShowPopupLineRange={(lineKey) => {
              return handleShowPopupLineRange('sportBook1', lineKey)
            }}
          />
        </div>
        <div className="text-sm font-bold py-2.5 text-center text-red-500 ">{t('vs')}</div>
        <div className="flex-1">
          <PlatformSetting typeSportBook="sportBook2" />
          <AmountRounderSetting sportBook="sportBook2" />
          <GeneralSetting typeSportBook="sportBook2" />
          <DetailedSetting
            typeSportBook="sportBook2"
            handleShowPopupLineRange={(lineKey) => handleShowPopupLineRange('sportBook2', lineKey)}
          />
        </div>
      </div>

      {showPopupLineRangeSetting && (
        <LineRangeSettingsModal
          setShowAmountRounderSetting={setShowPopupLineRangeSetting}
          typeSportBook={currentPlatformForLineRange}
          lineKey={currentLineKey}
        />
      )}
    </div>
  )
}

export const SettingCombination = memo(SettingCombinationComponent)
