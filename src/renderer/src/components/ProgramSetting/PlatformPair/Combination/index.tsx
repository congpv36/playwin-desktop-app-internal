import { memo, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PlatformPairContext } from '@renderer/context/PlatformPairContext'

const CombinationComponent = () => {
  const { t } = useTranslation(['main', 'layout'])
  const context = useContext(PlatformPairContext)
  const { listPlatformPair, currentPlatformPair, setCurrentPlatformPair } = context.Combination

  const containerRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  const moveSelection = useCallback(
    (direction: 'prev' | 'next') => {
      const index = listPlatformPair.findIndex((pair) => pair.id === currentPlatformPair.id)
      if (index === -1) return

      let newIndex = index
      if (direction === 'prev' && index > 0) {
        newIndex = index - 1
      } else if (direction === 'next' && index < listPlatformPair.length - 1) {
        newIndex = index + 1
      }

      if (newIndex !== index) {
        setCurrentPlatformPair(listPlatformPair[newIndex])
      }
    },
    [listPlatformPair, currentPlatformPair, setCurrentPlatformPair]
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
      className="rounded-lg border border-border-default overflow-hidden h-[645px] bg-white"
    >
      <div className="px-3 py-1 text-sm font-semibold border-b border-border-default">
        {t('combinations')}
      </div>
      <div className="overflow-y-auto h-[500px]">
        {listPlatformPair.length > 0 &&
          listPlatformPair.map((platform) => (
            <p
              key={`${platform.id}`}
              className={` px-4 py-1 border-b border-border-default text-sm hover:bg-brand-color cursor-pointer transition-colors flex justify-between items-center ${
                currentPlatformPair.id === platform.id ? 'bg-brand-color font-bold text-white ' : ''
              }`}
              onClick={() => setCurrentPlatformPair(platform)}
            >
              <div className="flex w-full items-center">
                <div className="flex items-center gap-2 w-1/3">
                  <span>{platform.sportBook1.name}</span>
                </div>
                <div className="mx-2 w-1/3 text-center font-bold">{t('vs_lower')}</div>
                <div className="flex items-center gap-2 w-1/3">
                  <span>{platform.sportBook2.name}</span>
                </div>
              </div>
            </p>
          ))}

        {listPlatformPair.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500">
            {t('no_combinations_available')}
          </div>
        )}
      </div>
    </div>
  )
}

export const Combination = memo(CombinationComponent)
