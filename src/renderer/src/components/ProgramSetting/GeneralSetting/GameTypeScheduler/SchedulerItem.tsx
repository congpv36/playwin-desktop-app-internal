import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Checkbox } from '@renderer/components/ui/checkbox'
import { Input } from '@renderer/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@renderer/components/ui/tooltip'
import QuestionMarkCircle from '@renderer/icons/question-mark-circle'

interface SchedulerItemProps {
  label: string
  state: {
    value: number
    input: string
    setValue: (val: number) => void
    setInput: (val: string) => void
  }
  id: string
}

export const SchedulerItem: React.FC<SchedulerItemProps> = ({ label, state, id }) => {
  const { t } = useTranslation(['main', 'layout'])
  const [error, setError] = useState<string | null>(null)

  const handleCheckboxChange = useCallback(() => {
    state.setValue(Number(!state.value))
    setError(null)
  }, [state])

  const MAX_ENTRY = 2
  const ENTRY_REGEX = /^(\d{4}-\d{4})(,)?$/

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[^0-9\-,]/g, '')
      const entries = value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      // Regex cho từng entry
      const entryFormat = /^\d{4}-\d{4}$/
      if (entries.length > 2) {
        setError(t('only_2_time_ranges'))
        return
      }
      if (entries.some((entry) => entry && !entryFormat.test(entry))) {
        setError(t('time_format_hint'))
      } else {
        setError(null)
      }
      state.setInput(value)
    },
    [state]
  )
  return (
    <>
      <div className="flex items-center">
        <div className="w-1/2 flex items-center ">
          <Checkbox id={id} onCheckedChange={handleCheckboxChange} checked={Boolean(state.value)} />

          <label htmlFor={id} className="ml-2 cursor-pointer w-full">
            {label}
          </label>
        </div>
        <div className="w-full justify-end flex items-center">
          <div className="relative">
            <Input
              type="text"
              id={`${id}_Text`}
              className={`pr-10 w-full border-border-default  bg-white ${!state.value ? 'text-gray-500' : ''}`}
              disabled={!state.value}
              maxLength={19}
              value={state.input}
              onChange={handleInputChange}
              placeholder="eg: 0315-1359,1700-2329"
            />
            <div className="absolute right-2 top-1 cursor-pointer">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="cursor-pointer">
                    <QuestionMarkCircle className="text-[#85888E]" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="left"
                    className="bg-gray-50 text-gray-800 border border-border-default  shadow-lg "
                  >
                    <p>eg: 0315-1359,1700-2329</p>
                    <p>The setting will be ON during:</p>
                    <p>(1) 3:15:00 AM ~ 1:59:59 PM</p>
                    <p>(2) 5:00:00 AM ~ 11:29:59 PM</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
      {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
    </>
  )
}
