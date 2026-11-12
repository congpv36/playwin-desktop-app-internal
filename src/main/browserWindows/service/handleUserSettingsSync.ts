/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Account,
  AllowLeague,
  BlockLeague,
  LeaguePointRandomizer,
  ScheduledLoginLogout,
  Setting,
  SettingLeagueFilter,
  SettingPerMatchLimit,
  SportBookCombination,
  SportsBook
} from '@db/model'
import { SportBookCombinationDBType } from '@db/schema/sportBookCombination'

import { systemLogToFile } from '@/worker/lib/systemLogToFile'

type SyncConfig<T, R = T> = {
  data?: T[]
  model: {
    findAll: () => R[]
    insertMany: (data: R[]) => void
  }
  transform?: (item: T) => R
}

const syncIfEmpty = <T, R = T>({ data, model, transform }: SyncConfig<T, R>) => {
  if (!data || data.length === 0) return

  const existed = model.findAll()
  if (existed.length > 0) return

  const insertData = transform ? data.map(transform) : (data as unknown as R[])
  model.insertMany(insertData)
}

export const handleUserSettingsSync = async (accessToken: string) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_URL}/user/users/setting`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      }
    })

    const { data } = (await res.json()) as {
      data: Record<string, any>
    }

    if (!data || Object.keys(data).length === 0) {
      return
    }

    const {
      accounts = [],
      accountPairs = [],
      settings = [],
      settingLeagueFilter = [],
      settingPerMatchLimit = [],
      sportsBook = [],
      leagueFilters = [],
      blockLeagues = [],
      allowLeagues = [],
      leaguePointRandomizer = [],
      scheduledLoginLogout = []
    } = data

    syncIfEmpty({ data: allowLeagues, model: AllowLeague })
    syncIfEmpty({ data: blockLeagues, model: BlockLeague })
    syncIfEmpty({ data: leagueFilters, model: SettingLeagueFilter })
    syncIfEmpty({ data: settings, model: Setting })
    syncIfEmpty({ data: sportsBook, model: SportsBook })
    syncIfEmpty({ data: settingPerMatchLimit, model: SettingPerMatchLimit })
    syncIfEmpty({ data: settingLeagueFilter, model: SettingLeagueFilter })
    syncIfEmpty({ data: accounts, model: Account })
    syncIfEmpty({ data: leaguePointRandomizer, model: LeaguePointRandomizer })
    syncIfEmpty({ data: scheduledLoginLogout, model: ScheduledLoginLogout })

    syncIfEmpty({
      data: accountPairs,
      model: SportBookCombination,
      transform: (accountPair: SportBookCombinationDBType) => ({
        id: accountPair.id,
        isValid: accountPair.isValid,
        key: accountPair.key,
        sportBook1: JSON.stringify(accountPair.sportBook1),
        sportBook2: JSON.stringify(accountPair.sportBook2)
      })
    })
  } catch (error) {
    console.error('HandleUserSettingsSync error:', error)
    await systemLogToFile(`HandleUserSettingsSync error`, 'Program')
  }
}
