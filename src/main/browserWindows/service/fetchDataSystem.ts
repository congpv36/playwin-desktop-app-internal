/* eslint-disable @typescript-eslint/no-explicit-any */
import db from '@db/config/database'
import Model, {
  Account,
  bumpCacheVersion,
  clearTable,
  dropNameTeamLookupIndex,
  ensureNameTeamLookupIndex,
  NAME_TEAM_CACHE_KEY,
  NameLeague,
  Platform,
  PlatformUrl,
  SportBookCombination,
  SportsBook
} from '@db/model'
import { SportBookCombinationDBType } from '@db/schema/sportBookCombination'
import { v4 as uuidv4 } from 'uuid'

import { isAllowedPlatform } from '@shared/common/constants'
import { AccountType, SportsBookType } from '@shared/common/types'

import { ensureTrailingSlash } from '@/browserWindows/service/ensureTrailingSlash'
import { systemLogToFile } from '@/worker/lib/systemLogToFile'

export const fetchDataSystem = async (
  url: string,
  model: Model,
  mapFn: any,
  accessToken: string
) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  })

  if (!response.ok) {
    await systemLogToFile(`Get ${url}: ${JSON.stringify(response.statusText)}`, 'Error')
    console.error(`Error fetching ${url}:`, response.statusText)
    return
  }

  const responseData = (await response.json()) as { data: { rows: any[] } }
  await systemLogToFile(`Get ${new URL(url).pathname}: Response 200 OK`, 'Program')

  const { rows } = responseData.data

  const mappedRows: any[] =
    model === Platform ? [] : rows.map(mapFn).filter((item) => item !== null)

  const transaction = db.transaction(() => {
    if (model === Platform) {
      clearTable('PlatformUrl')
      clearTable('Platform')

      const allowedPlatforms = rows.filter(
        (platform: { id: string; platformName: string; url: string; urls: string[] }) =>
          isAllowedPlatform(platform.platformName)
      )

      const platformNamesFromApi = new Set(
        allowedPlatforms.map((platform) => platform.platformName as string)
      )

      for (const platform of allowedPlatforms) {
        if (platform.urls.length !== 0) {
          for (const urlOption of platform.urls) {
            PlatformUrl.create({
              id: uuidv4(),
              url: ensureTrailingSlash(urlOption),
              platformName: platform.platformName
            })
          }
        }

        const existingRecord = Platform.findOne({ uuid: platform.id })

        if (!existingRecord) {
          Platform.create({
            uuid: platform.id,
            name: platform.platformName,
            url: platform.url
          })
        }
      }

      const listAccount = Account.findAll() as AccountType[]
      for (const acc of listAccount) {
        if (acc.platformName !== '1XBet' && !platformNamesFromApi.has(acc.platformName)) {
          Account.delete({ id: acc.id })
        }
      }

      const listSportsBook = SportsBook.findAll() as SportsBookType[]
      for (const sportsBook of listSportsBook) {
        if (sportsBook.platform !== '1XBet' && !platformNamesFromApi.has(sportsBook.platform)) {
          SportsBook.delete({ id: sportsBook.id })
        }
      }
      const listSportBookCombination =
        SportBookCombination.findAll() as SportBookCombinationDBType[]
      for (const item of listSportBookCombination) {
        const [platformA, platformB] = item.key.split('_')
        const isProtected = platformA === '1XBet' || platformB === '1XBet'

        if (
          !isProtected &&
          (!platformNamesFromApi.has(platformA) || !platformNamesFromApi.has(platformB))
        ) {
          SportBookCombination.delete({ id: item.id })
        }
      }
    } else {
      if (model === NameLeague) {
        clearTable('NameLeague')
      } else {
        dropNameTeamLookupIndex()
        clearTable('NameTeam')
      }

      let insertStmt
      if (model === NameLeague) {
        insertStmt = db.prepare(`
            INSERT INTO NameLeague (nameLeague, platform, idPlatform, league)
            VALUES (?, ?, ?, ?)
          `)
      } else {
        insertStmt = db.prepare(`
            INSERT INTO NameTeam (nameTeam, nameLeague, platform, idPlatform, team, league)
            VALUES (?, ?, ?, ?, ?, ?)
          `)
      }

      for (const mappedData of mappedRows) {
        if (model === NameLeague) {
          insertStmt.run(
            mappedData.data.nameLeague,
            mappedData.data.platform,
            mappedData.data.idPlatform,
            mappedData.data.league
          )
        } else {
          insertStmt.run(
            mappedData.data.nameTeam,
            mappedData.data.nameLeague,
            mappedData.data.platform,
            mappedData.data.idPlatform,
            mappedData.data.team,
            mappedData.data.league
          )
        }
      }

      if (model !== NameLeague) {
        ensureNameTeamLookupIndex()
        bumpCacheVersion(NAME_TEAM_CACHE_KEY)
      }
    }
  })
  transaction.immediate()
}
