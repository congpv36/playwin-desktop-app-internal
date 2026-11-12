import React, { useCallback, useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import { PlatformType } from '@shared/common/types'

interface Props {
  title: string
  listPlatform: PlatformType[]
  setPlatform: (value: PlatformType) => void
  platformCurrent: PlatformType | undefined
}

const PlatformNumber = ({ title, listPlatform, setPlatform, platformCurrent }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (listPlatform.length > 0 && !platformCurrent) {
      setPlatform(listPlatform[0])
    }
  }, [listPlatform, platformCurrent, setPlatform])

  const moveSelection = useCallback(
    (direction: 'prev' | 'next') => {
      const index = listPlatform.findIndex((item) => item.id === platformCurrent?.id)
      if (index === -1) return

      let newIndex = index
      if (direction === 'prev' && index > 0) {
        newIndex = index - 1
      } else if (direction === 'next' && index < listPlatform.length - 1) {
        newIndex = index + 1
      }

      if (newIndex !== index) {
        setPlatform(listPlatform[newIndex])
      }
    },
    [listPlatform, platformCurrent, setPlatform]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowLeft'].includes(e.key)) {
        e.preventDefault()
        moveSelection('prev')
      } else if (['ArrowDown', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        moveSelection('next')
      }
    }

    if (isFocused) {
      window.addEventListener('keydown', handleKeyDown)
    } else {
      window.removeEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFocused, moveSelection])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) {
        setIsFocused(true)
      } else {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={twMerge(
        'w-1/2 border-t border-border-default overflow-hidden bg-white',
        title === 'SportBook 1'
          ? 'rounded-l-lg border-l border-r'
          : title === 'SportBook 2'
            ? 'rounded-r-lg border-r border-l-0'
            : 'rounded-lg border-l border-r'
      )}
    >
      <div className="px-4 py-1 text-sm font-semibold border-b whitespace-nowrap  border-border-default">
        {title}
      </div>
      <div className="overflow-y-auto max-h-80">
        {listPlatform.map((platform) => (
          <div
            key={platform.id}
            className={`px-4 py-1 text-sm border-b border-border-default hover:bg-brand-color  hover:text-white cursor-pointer transition-colors ${
              platformCurrent?.id === platform.id ? `bg-brand-color text-white font-bold` : ''
            }`}
            onClick={() => setPlatform(platform)}
          >
            {platform.name}
          </div>
        ))}
        {listPlatform.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500">No platforms available</div>
        )}
      </div>
    </div>
  )
}

export default React.memo(PlatformNumber)
