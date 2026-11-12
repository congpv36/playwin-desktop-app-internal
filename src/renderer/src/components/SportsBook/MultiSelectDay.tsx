import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import { Checkbox } from '@renderer/components/ui/checkbox'

import { DAYS_OF_WEEK } from '@shared/common/constants'

export default function MultiSelectDay({
  value,
  onChange
}: {
  value: { day: string; time: string }[]
  onChange: (val: { day: string; time: string }[]) => void
}) {
  const { t } = useTranslation(['main', 'layout'])
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<null | {
    top: number
    left: number
    width: number
  }>(null)

  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedDays = value.map((v) => v.day)
  const isAllSelected = selectedDays.length === DAYS_OF_WEEK.length

  const toggleItem = (day: string) => {
    const exists = value.find((v) => v.day === day)

    if (exists) {
      onChange(value.filter((v) => v.day !== day))
    } else {
      onChange([...value, { day, time: '00:00' }])
    }
  }

  const updateTime = (day: string, time: string) => {
    onChange(value.map((v) => (v.day === day ? { ...v, time } : v)))
  }

  const toggleSelectAll = () => {
    if (isAllSelected) {
      onChange([])
    } else {
      onChange(
        DAYS_OF_WEEK.map((d) => ({
          day: d,
          time: '00:00'
        }))
      )
    }
  }

  const getLabel = () => {
    if (value.length === 0) return t('none_selected')
    if (value.length === DAYS_OF_WEEK.length) return `${t('all_selected')} (${DAYS_OF_WEEK.length})`
    if (value.length > 1) return `${value.length} selected`
    return value[0]?.day
  }

  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()

      const dropdownHeight = 260
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top

      const shouldOpenTop = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight

      setPosition({
        top: shouldOpenTop
          ? rect.top + window.scrollY - dropdownHeight
          : rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    } else {
      setPosition(null)
    }
  }, [isOpen])

  useLayoutEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node

      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [])

  return (
    <>
      <div className="w-[230px]" ref={triggerRef}>
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          className="border border-border-default p-1 rounded cursor-pointer flex justify-between items-center"
        >
          <span className="ml-2">{getLabel()}</span>
          <span className="text-gray-500">▼</span>
        </div>
      </div>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={dropdownRef}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: position.top,
              left: position.left,
              width: position.width
            }}
            className="z-[9999] border border-border-default rounded bg-white pt-2 py-1 px-2 shadow text-sm"
          >
            <label className="flex items-center gap-2 mb-2">
              <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} />
              {t('select_all')}
            </label>

            {DAYS_OF_WEEK.map((day) => {
              const selected = value.find((v) => v.day === day)

              return (
                <div key={day} className="flex items-center justify-between mb-1 h-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={!!selected} onCheckedChange={() => toggleItem(day)} />
                    {day}
                  </label>

                  {selected && (
                    <input
                      type="time"
                      value={selected.time}
                      onChange={(e) => updateTime(day, e.target.value)}
                      className="bg-white border border-border-default rounded px-[5px] py-[1px] text-xs"
                    />
                  )}
                </div>
              )
            })}
          </div>,
          document.body
        )}
    </>
  )
}
