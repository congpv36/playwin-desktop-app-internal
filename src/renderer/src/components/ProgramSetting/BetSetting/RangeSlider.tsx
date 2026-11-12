import React from 'react'
import * as Slider from '@radix-ui/react-slider'

interface RangeSliderProps {
  label: string
  value: number
  onChange: (value: number[]) => void
}

const RangeSlider = ({ label, value, onChange }: RangeSliderProps) => {
  return (
    <div className="flex items-center mt-3 overflow-hidden">
      <div className="flex-shrink-0  text-sm flex items-center  w-[300px] whitespace-nowrap">
        <p className="font-medium w-16">{label}</p>
        <span className="ml-3 text-brand-color">{value}</span>
      </div>
      <div className="w-[400px] flex items-center flex-shrink-0 overflow-hidden">
        <p className="text-xs font-semibold text-gray-400 mr-3 whitespace-nowrap">0</p>

        <div className="flex-1 flex items-center relative min-w-0">
          <div className="flex-1 relative mx-1 min-w-0">
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-5"
              value={[value]}
              onValueChange={onChange}
              max={7}
              min={0}
              step={1}
            >
              <Slider.Track className="bg-gray-400 relative grow rounded-full h-[6px]">
                <Slider.Range className="absolute rounded-full h-full bg-brand-color" />
              </Slider.Track>
              <Slider.Thumb
                className="block w-5 h-5 bg-white rounded-full border-2 hover:bg-gray-50 focus:outline-none focus:ring-2 
                focus:ring-offset-2 cursor-pointer border-brand-color data-[state=open]:ring-brand-color"
                aria-label="Volume"
              />
            </Slider.Root>
          </div>
        </div>
        <p className="text-xs font-semibold text-gray-400 ml-3 whitespace-nowrap">7</p>
      </div>
    </div>
  )
}

export default React.memo(RangeSlider)
