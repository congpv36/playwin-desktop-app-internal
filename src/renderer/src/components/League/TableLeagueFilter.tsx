import React, { useContext } from 'react'

import { LeagueFilterContext } from '@renderer/context/LeagueFilterContext'

const TableLeagueFilter = ({ selectedRows, handleRowClick }) => {
  const context = useContext(LeagueFilterContext)
  if (!context) return null

  const { filterType } = context.filterType
  const {
    listBlockLeagueTable,
    setListBlockLeagueTable,
    listAllowLeagueTable,
    setListAllowLeagueTable
  } = context.tableData as {
    listBlockLeagueTable: { id: string | number; league: string }[]
    setListBlockLeagueTable: React.Dispatch<
      React.SetStateAction<{ id: string | number; league: string }[]>
    >
    listAllowLeagueTable: { id: string | number; league: string }[]
    setListAllowLeagueTable: React.Dispatch<
      React.SetStateAction<{ id: string | number; league: string }[]>
    >
  }

  const listLeagueTable = filterType === 'Block' ? listBlockLeagueTable : listAllowLeagueTable
  const setListLeagueTable =
    filterType === 'Block' ? setListBlockLeagueTable : setListAllowLeagueTable

  const handleInputChange = (id: number | string, newValue: string) => {
    const updatedList = listLeagueTable.map((league) =>
      league.id === id ? { ...league, league: newValue } : league
    )
    setListLeagueTable(updatedList)
  }
  const handleDeleteLeague = (id: number | string) => {
    const updatedList = listLeagueTable.filter((league) => league.id !== id)
    setListLeagueTable(updatedList)
  }
  return (
    <div className="grow bg-white h-[654px] rounded-b-lg">
      <div className="custom-scrollbar overflow-auto h-full">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-left py-3 px-4  text-sm font-medium w-12">#</th>
              <th className="text-left py-3 px-4  text-sm font-medium">League</th>
              <th className="w-16"></th>
            </tr>
          </thead>
          <tbody>
            {listLeagueTable.map(
              (league: { id: number | string; league: string }, index: number) => (
                <tr
                  key={league.id}
                  onClick={(e) => handleRowClick(index, e)}
                  className={`cursor-pointer border-b border-border-default hover:bg-brand-color hover:text-white transition-colors duration-200 ${
                    selectedRows.has(index) ? 'text-white font-semibold bg-brand-color' : ''
                  }`}
                >
                  <td className="py-1 px-4  text-sm">{index + 1}</td>
                  <td className="py-1 px-4">
                    <input
                      type="text"
                      value={league.league}
                      maxLength={255}
                      className={`w-full bg-transparent  text-sm outline-none border-none ${
                        selectedRows.has(index) ? 'text-white' : ''
                      }`}
                      onChange={(e) => handleInputChange(league.id, e.target.value)}
                    />
                  </td>
                  <td className="py-1 px-4">
                    <div className="flex items-center gap-2">
                      {/* Delete Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteLeague(league.id)
                        }}
                        className=" hover:text-red-400 transition-colors duration-200"
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
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default React.memo(TableLeagueFilter)
