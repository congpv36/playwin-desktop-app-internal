import { AllowLeague, BlockLeague, SettingLeagueFilter } from '@db/model'

import { MAJOR_LEAGUE } from '@shared/common/constants'
import { SettingLeagueFilterType, TableLeagueFilterType } from '@shared/common/types'

export function checkMatchLeagueFilterRule(league: string) {
  let leagueFilter: { league: string }[] = []

  const { filterType, blockMajorLeague, allowMajorLeague } =
    SettingLeagueFilter.findAll()[0] as SettingLeagueFilterType
  const blockLeagues = BlockLeague.findAll() as TableLeagueFilterType[]
  const allowLeagues = AllowLeague.findAll() as TableLeagueFilterType[]

  if (filterType == 'Block') {
    leagueFilter = blockLeagues.map(({ league }) => ({ league }))
    if (blockMajorLeague == 1) {
      leagueFilter.push(...MAJOR_LEAGUE)
    }
  } else {
    leagueFilter = allowLeagues.map(({ league }) => ({ league }))
    if (allowMajorLeague == 1) {
      leagueFilter.push(...MAJOR_LEAGUE)
    }
  }

  const normalizedLeague = league.toLowerCase()

  if (filterType == 'Block') {
    if (leagueFilter.length == 0) {
      return false
    }
    return leagueFilter.some(({ league: filterLeague }) => {
      const normalizedFilter = filterLeague.toLowerCase()

      if (normalizedFilter.startsWith('%')) {
        return normalizedLeague === normalizedFilter.slice(1)
      }
      return normalizedLeague.includes(normalizedFilter)
    })
  } else {
    if (leagueFilter.length == 0) {
      return true
    }
    return !leagueFilter.some(({ league: filterLeague }) => {
      const normalizedFilter = filterLeague.toLowerCase()

      if (normalizedFilter.startsWith('%')) {
        return normalizedLeague === normalizedFilter.slice(1)
      }
      return normalizedLeague.includes(normalizedFilter)
    })
  }
}
