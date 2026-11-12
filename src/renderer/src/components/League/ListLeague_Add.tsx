import React, { useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'

import { LeagueFilterContext } from '@renderer/context/LeagueFilterContext'

import { getThemeClass } from '@shared/common/constants'

import { Button } from '../ui/button'

const ListLeague_Add = () => {
  const context = useContext(LeagueFilterContext)
  const { t } = useTranslation(['main', 'layout'])
  if (!context) return null

  const { leagues } = context.listLeague
  const { filterType } = context.filterType
  const {
    listBlockLeagueTable,
    setListBlockLeagueTable,
    listAllowLeagueTable,
    setListAllowLeagueTable
  } = context.tableData

  const [selectedLeagues, setSelectedLeagues] = useState<number[]>([])
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)
  const [searchBuffer, setSearchBuffer] = useState<string>('')
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Record<number, HTMLParagraphElement | null>>({})

  const handleSelectLeague = (
    event: React.MouseEvent | { ctrlKey?: boolean; shiftKey?: boolean; metaKey?: boolean },
    leagueId: number,
    index: number
  ) => {
    if (event.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)
      const newSelection = leagues.slice(start, end + 1).map((league) => league.id)
      setSelectedLeagues((prev) => Array.from(new Set([...prev, ...newSelection])))
    } else if (event.ctrlKey || event.metaKey) {
      setSelectedLeagues((prev) =>
        prev.includes(leagueId) ? prev.filter((id) => id !== leagueId) : [...prev, leagueId]
      )
    } else {
      setSelectedLeagues([leagueId])
    }
    setLastSelectedIndex(index)
  }

  const handleAddClick = () => {
    const dataLeagueFilter = leagues
      .filter((league) => selectedLeagues.includes(league.id))
      .map((league) => ({
        id: uuidv4(),
        league: league.league
      }))
    setSelectedLeagues([])
    filterType === 'Block'
      ? setListBlockLeagueTable([...listBlockLeagueTable, ...dataLeagueFilter])
      : setListAllowLeagueTable([...listAllowLeagueTable, ...dataLeagueFilter])
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (key.length !== 1 || !/^[a-z0-9]$/.test(key)) return

      let newSearchBuffer = searchBuffer + key
      setSearchBuffer(newSearchBuffer)

      const searchStartIndex = currentSearchIndex
      let index = leagues.findIndex(
        (league, idx) =>
          idx >= searchStartIndex &&
          league.league.toLowerCase().startsWith(newSearchBuffer.toLowerCase())
      )

      if (index === -1) {
        index = leagues.findIndex((league) =>
          league.league.toLowerCase().startsWith(newSearchBuffer.toLowerCase())
        )

        if (index === -1) {
          newSearchBuffer = key
          setSearchBuffer(newSearchBuffer)
          setCurrentSearchIndex(0)

          index = leagues.findIndex((league) =>
            league.league.toLowerCase().startsWith(newSearchBuffer.toLowerCase())
          )
        }
      }

      if (index !== -1) {
        setCurrentSearchIndex(index)
      }

      if (index !== -1) {
        const league = leagues[index]
        const el = itemRefs.current[league.id]

        if (el && containerRef.current) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }

        handleSelectLeague({ ctrlKey: false, shiftKey: false }, league.id, index)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [leagues, lastSelectedIndex, searchBuffer, currentSearchIndex])

  return (
    <div className="bg-layout-color">
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-4 w-4 text-text-default"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder={t('main:search')}
            className="w-full pl-10 pr-3 py-2 bg-white border border-border-default rounded text-sm focus:outline-none focus:border-green-500 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="bg-white border border-border-default rounded h-[678px]">
        <div ref={containerRef} className="custom-scrollbar overflow-auto h-full">
          {leagues.length > 0 &&
            leagues.map((league, index) => {
              const isSelected = selectedLeagues.includes(league.id)
              return (
                <p
                  key={league.id}
                  ref={(el) => (itemRefs.current[league.id] = el)}
                  className={`mx-[1px] text-text-default pl-2 py-2 text-sm cursor-pointer border-b border-border-default last:border-b-0 ${
                    isSelected
                      ? getThemeClass('bg') + ' text-white'
                      : ' hover:text-white hover:bg-brand-color'
                  }`}
                  onClick={(event) => handleSelectLeague(event, league.id, index)}
                >
                  {league.league}
                </p>
              )
            })}
        </div>
      </div>

      <div className="mt-2">
        <Button
          onClick={handleAddClick}
          className="w-full p-2 px-4  text-white font-medium rounded transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <span className="text-lg">+</span>
          {t('main:add')}
        </Button>
      </div>
    </div>
  )
}

export default React.memo(ListLeague_Add)
