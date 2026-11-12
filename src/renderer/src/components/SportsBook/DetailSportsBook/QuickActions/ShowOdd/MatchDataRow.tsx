import { memo } from 'react'

import { GAME_TYPES } from '@shared/common/constants'

import { MarketBox } from './MarketBox'
import { MatchLine, MockAccountInfo, OddCell, OddModalInfo } from './types'

const MATCH_LINE_HEIGHT = 68

export const MatchDataRow = memo(function MatchDataRow({
  league,
  home,
  away,
  gameType,
  date,
  time,
  score,
  stat,
  markets,
  li,
  changedKeys,
  account,
  onOddClick
}: {
  league: string
  home: string
  away: string
  gameType: string
  date: string
  time: string
  score: string
  stat: string
  markets: MatchLine[]
  li: number

  changedKeys: Set<string>
  account: MockAccountInfo | null
  onOddClick: (info: OddModalInfo) => void
}) {
  const ck = (mi: number, field: string) => changedKeys.has(`${li}_${mi}_${field}`)

  const mk =
    (
      marketType: 'HDP' | 'OU',
      half: 'Match' | '1st Half',
      side: OddModalInfo['side'],
      cell: OddCell
    ) =>
    () =>
      onOddClick({
        league,
        home,
        away,
        marketType,
        half,
        side,
        line: cell.line,
        hdp_point: cell.hdp_point,
        value: side === 'Home' || side === 'Over' ? cell.homeOdd : cell.awayOdd,
        homeOdd: cell.homeOdd,
        awayOdd: cell.awayOdd,
        meta: cell.meta,
        account: account ?? undefined
      })

  return (
    <div className="flex border-b" style={{ height: MATCH_LINE_HEIGHT * markets.length }}>
      <div className="w-[70px] shrink-0 border-r flex flex-col items-center justify-center text-center font-semibold">
        {gameType === GAME_TYPES.RUNNING ? (
          <>
            <div>{score}</div>
            <div className="text-red-700 text-xs">{stat}</div>
          </>
        ) : gameType === GAME_TYPES.TODAY ? (
          <>
            <div>{time}</div>
            <div className="text-red-700 text-xs">Live</div>
          </>
        ) : (
          <>
            <div className="text-red-700">{date}</div>
            <div className="text-gray-500 text-xs">{time}</div>
          </>
        )}
      </div>

      <div className="w-[780px] shrink-0 flex flex-col">
        {markets.map(({ mi, match, firstHalf }) => (
          <div
            key={mi}
            className="grid grid-cols-[300px_120px_120px_120px_120px]"
            style={{ height: MATCH_LINE_HEIGHT }}
          >
            <div className="pl-4 border-r flex flex-col justify-center">
              <div
                className={`${match.hdp.hdp_point < 0 ? 'text-orange-color' : 'text-blue-color'} font-medium`}
              >
                {home}
              </div>
              <div
                className={`${match.hdp.hdp_point > 0 ? 'text-orange-color' : 'text-blue-color'} mt-2 font-medium`}
              >
                {away}
              </div>
            </div>

            <div className="p-2">
              <MarketBox
                homeOdd={match.hdp.homeOdd}
                line={match.hdp.line}
                awayOdd={match.hdp.awayOdd}
                hdp_point={match.hdp.hdp_point}
                changedHome={ck(mi, 'hdp_homeOdd')}
                changedAway={ck(mi, 'hdp_awayOdd')}
                onHomeClick={mk('HDP', 'Match', 'Home', match.hdp)}
                onAwayClick={mk('HDP', 'Match', 'Away', match.hdp)}
              />
            </div>

            <div className="p-2">
              <MarketBox
                homeOdd={match.ou.homeOdd}
                line={match.ou.line}
                awayOdd={match.ou.awayOdd}
                isOu
                changedHome={ck(mi, 'ou_homeOdd')}
                changedAway={ck(mi, 'ou_awayOdd')}
                onHomeClick={mk('OU', 'Match', 'Over', match.ou)}
                onAwayClick={mk('OU', 'Match', 'Under', match.ou)}
              />
            </div>

            <div className="p-2">
              {firstHalf?.hdp && (
                <MarketBox
                  homeOdd={firstHalf.hdp.homeOdd}
                  line={firstHalf.hdp.line}
                  awayOdd={firstHalf.hdp.awayOdd}
                  changedHome={false}
                  changedAway={false}
                  onHomeClick={mk('HDP', '1st Half', 'Home', firstHalf.hdp)}
                  onAwayClick={mk('HDP', '1st Half', 'Away', firstHalf.hdp)}
                />
              )}
            </div>

            <div className="p-2">
              {firstHalf?.ou && (
                <MarketBox
                  homeOdd={firstHalf.ou.homeOdd}
                  line={firstHalf.ou.line}
                  awayOdd={firstHalf.ou.awayOdd}
                  isOu
                  changedHome={false}
                  changedAway={false}
                  onHomeClick={mk('OU', '1st Half', 'Over', firstHalf.ou)}
                  onAwayClick={mk('OU', '1st Half', 'Under', firstHalf.ou)}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})
