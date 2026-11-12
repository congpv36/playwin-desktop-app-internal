import React, { useCallback, useContext } from 'react'
import { useTranslation } from 'react-i18next'

import SelectMultiple from '@renderer/components/LeaguePointRandomizer/SelectMultiple'
import { LeaguePointRandomizerContext } from '@renderer/context/LeaguePointRandomizerContext'

const ListLeague = () => {
  const context = useContext(LeaguePointRandomizerContext)
  const { t } = useTranslation(['main', 'layout'])
  if (!context) return null

  const { listSelectedLeague, setListSelectedLeague, selectedLeague, setSelectedLeague } = context

  const handleRemoveLeague = useCallback(
    (removeId: string) => {
      const removeIndex = listSelectedLeague.findIndex((l) => l.id === removeId)
      if (removeIndex === -1) return

      const newList = listSelectedLeague.filter((l) => l.id !== removeId)
      setListSelectedLeague(newList)

      if (selectedLeague?.id !== removeId) return

      const nextItem = newList[removeIndex] || newList[removeIndex - 1] || null
      setSelectedLeague(nextItem)
    },
    [listSelectedLeague, selectedLeague, setListSelectedLeague, setSelectedLeague]
  )

  return (
    <div className="grow h-[665px]">
      <div className="custom-scrollbar overflow-auto h-full">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border-default bg-white">
              <th className="sticky top-0 z-10  text-left py-3 px-4  text-sm font-medium w-12 bg-white ">
                #
              </th>
              <th className="sticky top-0 z-10  text-left py-3 px-4  text-sm font-medium bg-white">
                {t('main:league_col')}
              </th>
              <th className="sticky top-0 z-10  w-12 bg-white ">
                <SelectMultiple />
              </th>
            </tr>
          </thead>

          <tbody>
            {listSelectedLeague.length > 0 &&
              listSelectedLeague.map((league, index) => (
                <tr
                  key={league.id}
                  className={`cursor-pointer border-b border-border-default transition-colors duration-200 font-semibold text-text-default ${
                    selectedLeague?.id === league.id
                      ? 'bg-brand-color text-white'
                      : 'hover:bg-brand-color hover:text-white'
                  }`}
                  onClick={() => setSelectedLeague(league)}
                >
                  <td className="py-1 px-4 text-sm">{index + 1}</td>

                  <td className="py-1 px-4">
                    <span className="w-full bg-transparent text-sm outline-none border-none">
                      {league.league}
                    </span>
                  </td>

                  <td className="py-1 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveLeague(league.id)
                        }}
                        className="hover:text-red-400 transition-colors duration-200"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default React.memo(ListLeague)
