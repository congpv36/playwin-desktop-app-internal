import db from '@db/config/database'
import { bumpCacheVersion, NAME_TEAM_CACHE_KEY, NameLeague, NameTeam, Platform } from '@db/model'

import { PlatformType } from '@shared/common/types'

import { systemLogToFile } from '@/worker/lib/systemLogToFile'

type AutoMappingLeague = {
  leagueId: string
  leagueName: string
  standardLeagueName: null | string
  platformId: string
  platformName: string
  platformUrl: string
  leagueCreatedAt: string
}

type AutoMappingTeam = {
  teamId: string
  teamName: string
  standardTeamName: null | string
  platformId: string
  platformName: string
  platformUrl: string
  leagueId: string
  leagueName: string
  standardLeagueName: null | string
  teamCreatedAt: string
}

export type AutoMappingUpdatedData = {
  leagues: AutoMappingLeague[]
  sportType: string
  teams: AutoMappingTeam[]
}

export const handleAutoMappingUpdated = async (data: AutoMappingUpdatedData) => {
  const leagues = data?.leagues ?? []
  const teams = data?.teams ?? []
  if (leagues.length === 0 && teams.length === 0) return

  try {
    const transaction = db.transaction(() => {
      for (const league of leagues) {
        const platform = Platform.findOne({ name: league.platformName }) as PlatformType
        if (!platform) continue

        const findCriteria = {
          nameLeague: league.leagueName.trim(),
          platform: league.platformName
        }
        const existing = NameLeague.findOne(findCriteria)
        if (existing) {
          NameLeague.update(findCriteria, { league: league.standardLeagueName })
        } else {
          NameLeague.create({
            ...findCriteria,
            idPlatform: platform.id,
            league: league.standardLeagueName
          })
        }
      }

      for (const team of teams) {
        const platform = Platform.findOne({ name: team.platformName }) as PlatformType
        if (!platform) continue

        const findCriteria = {
          nameTeam: team.teamName.trim(),
          nameLeague: team.leagueName.trim(),
          platform: team.platformName
        }
        const existing = NameTeam.findOne(findCriteria)
        if (existing) {
          NameTeam.update(findCriteria, {
            team: team.standardTeamName,
            league: team.standardLeagueName
          })
        } else {
          NameTeam.create({
            ...findCriteria,
            idPlatform: platform.id,
            team: team.standardTeamName,
            league: team.standardLeagueName
          })
        }
      }

      if (teams.length) bumpCacheVersion(NAME_TEAM_CACHE_KEY)
    })
    transaction.immediate()
  } catch (error) {
    await systemLogToFile(`auto_mapping_updated: ${(error as Error).message}`, 'Error')
    console.error('handleAutoMappingUpdated error:', error)
  }
}
