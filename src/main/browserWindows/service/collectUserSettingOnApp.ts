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
import { SettingSchemaType } from '@db/schema/setting'
import { SportBookCombinationDBType } from '@db/schema/sportBookCombination'

import { AccountType, SettingLeagueFilterType, TableLeagueFilterType } from '@shared/common/types'
import { DEFAULT_ACCOUNT_STATUS } from '@shared/main/constants'

export function handleCollectUserSettingOnApp() {
  const listAccount = Account.findAll() as AccountType[]
  const listAccountDefault = listAccount.map((account) => ({
    ...account,
    ...DEFAULT_ACCOUNT_STATUS
  }))

  const listScheduledLoginLogout = ScheduledLoginLogout.findAll()
  const listSettingLeagueFilter = SettingLeagueFilter.findAll()
  const listSettingPerMatchLimit = SettingPerMatchLimit.findAll()
  const listSportsBook = SportsBook.findAll()
  const listLeaguePointRandomizer = LeaguePointRandomizer.findAll()

  const platformPair = SportBookCombination.findAll() as SportBookCombinationDBType[]

  const listPlatformPair = platformPair?.length
    ? (platformPair.map((item) => {
        return {
          id: item.id,
          isValid: item.isValid,
          key: item.key,
          sportBook1: item.sportBook1 ? JSON.parse(String(item.sportBook1)) : {},
          sportBook2: item.sportBook2 ? JSON.parse(String(item.sportBook2)) : {}
        }
      }) as SportBookCombinationDBType[])
    : []

  const dataSetting = Setting.findAll() as SettingSchemaType[]
  const dataSettingLeagueFilter = SettingLeagueFilter.findAll() as SettingLeagueFilterType[]
  const blockLeagues = BlockLeague.findAll() as TableLeagueFilterType[]
  const allowLeagues = AllowLeague.findAll() as TableLeagueFilterType[]
  const platforms = SportsBook.findAll()
  const valueRanges = platforms.map((item) => ({
    platform: item.platform,
    valueRange: item.valueRange ?? 0
  }))
  const bettingSetting = {
    isOther: dataSetting[0].isOther,
    isBetUnderSelected: dataSetting[0].isBetUnderSelected,
    isBetOverSelected: dataSetting[0].isBetOverSelected,
    isBetPutSelected: dataSetting[0].isBetPutSelected,
    isBetEatSelected: dataSetting[0].isBetEatSelected,
    valueRanges: valueRanges
  }
  const settingsBundle = {
    accounts: listAccountDefault,

    settingLeagueFilter: listSettingLeagueFilter,
    settingPerMatchLimit: listSettingPerMatchLimit,
    sportsBook: listSportsBook,

    accountPairs: listPlatformPair,
    bettingSettings: bettingSetting,
    settings: dataSetting,
    leagueFilters: dataSettingLeagueFilter,
    blockLeagues: blockLeagues,
    allowLeagues: allowLeagues,

    leaguePointRandomizer: listLeaguePointRandomizer,
    scheduledLoginLogout: listScheduledLoginLogout
  }
  return settingsBundle
}
