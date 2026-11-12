import { memo } from 'react'

import { OddValue } from './OddValue'

export const MarketBox = memo(function MarketBox({
  homeOdd,
  line,
  awayOdd,
  isOu = false,
  hdp_point = 0,
  changedHome,
  changedAway,
  onHomeClick,
  onAwayClick
}: {
  homeOdd: number
  line: string
  awayOdd: number
  isOu?: boolean
  hdp_point?: number
  changedHome: boolean
  changedAway: boolean
  onHomeClick?: () => void
  onAwayClick?: () => void
}) {
  if (homeOdd === 0 && awayOdd === 0) return null

  const showHomeLabel = isOu || hdp_point <= 0
  const showAwayLabel = isOu || hdp_point > 0

  return (
    <div className="flex flex-col gap-1">
      <div
        onClick={onHomeClick}
        className="grid grid-cols-2 h-6 border rounded bg-white hover:bg-yellow-200 cursor-pointer"
      >
        {showHomeLabel && (
          <div className="flex items-center justify-center font-medium">{line}</div>
        )}
        <div className={`flex items-center justify-end pr-1 ${!showHomeLabel ? 'col-span-2' : ''}`}>
          <OddValue value={homeOdd} isChanged={changedHome} />
        </div>
      </div>
      <div
        onClick={onAwayClick}
        className="grid grid-cols-2 h-6 border rounded bg-white hover:bg-yellow-200 cursor-pointer"
      >
        {showAwayLabel && (
          <div className="flex items-center justify-center font-medium">{isOu ? 'u' : line}</div>
        )}
        <div className={`flex items-center justify-end pr-1 ${!showAwayLabel ? 'col-span-2' : ''}`}>
          <OddValue value={awayOdd} isChanged={changedAway} />
        </div>
      </div>
    </div>
  )
})
