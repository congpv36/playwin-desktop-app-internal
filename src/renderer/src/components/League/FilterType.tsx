import React, { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { LeagueFilterContext } from '@renderer/context/LeagueFilterContext'

const FilterType = () => {
  const context = useContext(LeagueFilterContext)
  const { t } = useTranslation(['main', 'layout'])
  if (!context) return null

  const { filterType, setFilterType } = context.filterType
  const [isOpen, setIsOpen] = useState(false)

  const filterOptions = [
    { value: 'Block', label: t('main:block_list') },
    { value: 'Allow', label: t('main:allow_list') }
  ]

  const selectedOption = filterOptions.find((option) => option.value === filterType)

  const handleSelect = (value: string) => {
    setFilterType(value)
    setIsOpen(false)
  }

  return (
    <div className="flex items-center justify-between py-3 px-4">
      <h3 className="text-sm font-medium whitespace-nowrap text-ellipsis flex-shrink">
        {t('main:filter_leagues')}
      </h3>

      <div className="relative flex-shrink-0 ml-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border-default rounded  text-sm hover:border-[#C0443C] focus:outline-none focus:border-[#C0443C] transition-colors duration-200 whitespace-nowrap"
        >
          <span className="whitespace-nowrap">{selectedOption?.label}</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute bg-white right-0 top-full mt-1 w-32 border border-border-default rounded shadow-lg z-10">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-green-400 hover:text-white transition-colors duration-200 first:rounded-t last:rounded-b ${
                  filterType === option.value ? 'bg-brand-color text-white' : ''
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(FilterType)
