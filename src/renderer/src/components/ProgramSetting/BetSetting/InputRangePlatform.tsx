import React, { useContext } from 'react'

import RangeSlider from '@renderer/components/ProgramSetting/BetSetting/RangeSlider'
import { BetSettingContext } from '@renderer/context/BetSettingContext'

const InputRangePlatform = () => {
  const context = useContext(BetSettingContext)
  if (!context) return null

  const { listRangePlatform, setListRangePlatform } = context.RangePlatform

  const handleChange = (index: number) => (value: number[]) => {
    const newValue = value[0]
    setListRangePlatform((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], valueRange: newValue }
      return updated
    })
  }

  return (
    <div className="overflow-hidden">
      {listRangePlatform.map((item, index) => (
        <div key={item.id} className="overflow-hidden">
          <RangeSlider
            label={item.platform}
            value={item.valueRange}
            onChange={handleChange(index)}
          />
        </div>
      ))}
    </div>
  )
}
export default React.memo(InputRangePlatform)
