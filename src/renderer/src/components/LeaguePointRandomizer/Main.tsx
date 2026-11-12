import React, { useContext } from 'react'

import AmountRandomizer from '@renderer/components/LeaguePointRandomizer/AmountRandomizer'
import ListLeague from '@renderer/components/LeaguePointRandomizer/ListLeague'
import { LeaguePointRandomizerContext } from '@renderer/context/LeaguePointRandomizerContext'

const Main = () => {
  const context = useContext(LeaguePointRandomizerContext)
  if (!context) return null

  const { listSelectedLeague } = context

  return (
    <div className="flex flex-col flex-1 overflow-hidden  ">
      <ListLeague />
      {listSelectedLeague.length > 0 && <AmountRandomizer />}
    </div>
  )
}

export default React.memo(Main)
