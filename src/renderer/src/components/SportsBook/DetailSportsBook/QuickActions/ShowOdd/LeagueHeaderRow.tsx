import { memo } from 'react'

export const LeagueHeaderRow = memo(function LeagueHeaderRow({ league }: { league: string }) {
  return (
    <div className="bg-gray-100 border-b flex items-center pl-1 text-red-700 font-bold h-6">
      ☆ {league.toUpperCase()}
    </div>
  )
})
