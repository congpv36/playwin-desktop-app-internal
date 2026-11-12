import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { COUNTRY_IP } from '@renderer/lib/country-ip.data'

type Props = {
  onSelectCountry?: (country: string) => void
}

export default function RandomIP({ onSelectCountry }: Props) {
  const { t } = useTranslation('main')

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-[160px] outline-none border border-border-default hover:border-gray-700 h-[40px] font-semibold rounded-[8px]"
      >
        {t('random_IP')}
      </button>

      {open && (
        <div className="absolute bottom-[45px] left-0 bg-white w-[160px] border border-border-default rounded-[8px] shadow-md z-50 max-h-[400px] overflow-y-auto">
          {Object.keys(COUNTRY_IP).map((country) => (
            <div
              key={country}
              onClick={() => {
                onSelectCountry?.(country)
                setOpen(false)
              }}
              className="pl-3 py-[2px] hover:bg-hover-default text-sm cursor-pointer"
            >
              {country}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
