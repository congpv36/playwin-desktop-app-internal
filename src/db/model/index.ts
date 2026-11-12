import db from '@db/config/database'
import accountSchema from '@db/schema/account'
import activePlatformShowOddsSchema from '@db/schema/activePlatformShowOdds'
import allowLeagueSchema from '@db/schema/allowLeague'
import authTokensSchema from '@db/schema/authTokens'
import betListResultSchema from '@db/schema/betListResult'
import blockLeagueSchema from '@db/schema/blockLeague'
import contraListSchema from '@db/schema/contraList'
import dataBetSchema from '@db/schema/dataBet'
import dataCrawlByPlatformViva88Schema from '@db/schema/dataCrawlByPlatformViva88'
import eventSbobetSchema from '@db/schema/eventSbobet'
import eventViva88Schema from '@db/schema/eventViva88'
import failedBetListSchema from '@db/schema/failedBetList'
import infoTicketForDelaySecSchema from '@db/schema/infoTicketForDelaySec'
import leaguePointRandomizerSchema from '@db/schema/leaguePointRandomizer'
import leagueSbobetSchema from '@db/schema/leagueSbobet'
import leagueViva88Schema from '@db/schema/leagueViva88'
import nameLeagueSchema from '@db/schema/nameLeague'
import nameTeamSchema from '@db/schema/nameTeam'
import perMatchLimitSchema from '@db/schema/perMatchLimit'
import perMatchLimitPlatformSchema from '@db/schema/perMatchLimitPlatform'
import platformSchema from '@db/schema/platform'
import platformPairSchema from '@db/schema/platformPair'
import platformPerMatchDetailsSchema from '@db/schema/platformPerMatchDetails'
import platformUrlSchema from '@db/schema/platformUrl'
import scheduledLoginLogoutSchema from '@db/schema/scheduledLoginLogout'
import settingSchema from '@db/schema/setting'
import settingLeagueFilterSchema from '@db/schema/settingLeagueFilter'
import settingPerMatchLimitSettingSchema from '@db/schema/settingPerMatchLimitSetting'
import sportBookCombinationSchema from '@db/schema/sportBookCombination'
import sportsBookSchema from '@db/schema/sportsBook'
import sportsBookProvidersSchema from '@db/schema/sportsBookProvidersSchema'
import successListSchema from '@db/schema/successList'
import settingsTableViewSchema from '@db/schema/tableViewSettings'
import waitingListSchema from '@db/schema/waitingList'

export interface RecordData {
  [key: string]: string | number | boolean | null
}
type QueryCondition = Record<string, string | number | boolean>

class Model {
  private tableName: string

  constructor(tableName: string, schema: string) {
    this.tableName = tableName
    db.prepare(`CREATE TABLE IF NOT EXISTS ${this.tableName} (${schema})`).run()
  }

  count(): number {
    const result = db.prepare(`SELECT COUNT(*) AS count FROM ${this.tableName}`).get()
    return result.count
  }

  findOne<T>(query: QueryCondition): T | undefined {
    const keys = Object.keys(query)
    const values = Object.values(query)

    const conditions = keys.map((key) => `${key} = ?`).join(' AND ')

    return db.prepare(`SELECT * FROM ${this.tableName} WHERE ${conditions}`).get(...values) as
      | T
      | undefined
  }

  findOneWithMaxTimestamp<T>(query: QueryCondition): T | undefined {
    const keys = Object.keys(query)
    const values = Object.values(query)

    const conditions = keys.map((key) => `${key} = ?`).join(' AND ')

    const sql = `SELECT * FROM ${this.tableName} WHERE ${conditions} ORDER BY timestamp DESC LIMIT 1`

    return db.prepare(sql).get(...values) as T | undefined
  }

  findAll(query: RecordData = {}): RecordData[] {
    const keys = Object.keys(query)
    if (keys.length === 0) {
      return db.prepare(`SELECT * FROM ${this.tableName}`).all()
    }

    const conditions = keys.map((key) => `${key} = ?`).join(' AND ')
    const values = Object.values(query)
    return db.prepare(`SELECT * FROM ${this.tableName} WHERE ${conditions}`).all(...values)
  }

  findById(id: number | string) {
    return db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`).get(id)
  }

  create(data: RecordData) {
    const keys = Object.keys(data).join(', ')
    const values = Object.values(data)
    const placeholders = values.map(() => '?').join(', ')

    const stmt = db.prepare(`
      INSERT INTO ${this.tableName} (${keys})
      VALUES (${placeholders})
      RETURNING *
    `)

    const result = stmt.get(...values)
    return result
  }

  findAll_SettingAccountPair(query: RecordData = {}): RecordData[] {
    const keys = Object.keys(query)
    let records: RecordData[]

    if (keys.length === 0) {
      records = db
        .prepare(
          `
        SELECT 
          s.*, 
          a1.loginID as account1_loginID,
          a1.platformName as account1_platForm, 
          a2.loginID as account2_loginID,
          a2.platformName as account2_platForm
        FROM ${this.tableName} s
        LEFT JOIN account a1 ON s.id_account1 = a1.id
        LEFT JOIN account a2 ON s.id_account2 = a2.id
      `
        )
        .all()
    } else {
      const conditions = keys.map((key) => `${key} = ?`).join(' AND ')
      const values = Object.values(query)
      records = db
        .prepare(
          `
        SELECT 
          s.*, 
          a1.loginID as account1_loginID,
          a1.platformName as account1_platForm, 
          a2.loginID as account2_loginID,
          a2.platformName as account2_platForm
        FROM ${this.tableName} s
        LEFT JOIN account a1 ON s.id_account1 = a1.id
        LEFT JOIN account a2 ON s.id_account2 = a2.id
        WHERE ${conditions}
      `
        )
        .all(...values)
    }

    return records
  }

  delete_SettingAccountPairByNamePlatform(platform: string) {
    const deleteTransaction = db.transaction(() => {
      const accountIds = db
        .prepare(
          `
          SELECT id FROM Account WHERE platformName = ?
        `
        )
        .all(platform)
        .map((row) => row.id)

      if (accountIds.length === 0) {
        return
      }

      const placeholders = accountIds.map(() => '?').join(', ')

      db.prepare(
        `
        DELETE FROM ${this.tableName}
        WHERE id_account1 IN (${placeholders}) OR id_account2 IN (${placeholders})
      `
      ).run(...accountIds, ...accountIds)
    })

    deleteTransaction.immediate()
  }

  insertMany(records: RecordData[]): void {
    if (!records.length) return

    const firstRecord = records[0]
    const keys = Object.keys(firstRecord).join(', ')
    const placeholder = '(?' + ',?'.repeat(Object.keys(firstRecord).length - 1) + ')'
    const allPlaceholders = new Array(records.length).fill(placeholder).join(', ')
    const values = records.flatMap((record) => Object.values(record))

    db.transaction(() => {
      db.prepare(`INSERT INTO ${this.tableName} (${keys}) VALUES ${allPlaceholders}`).run(...values)
    }).immediate()
  }

  update(query: RecordData, updates: RecordData): RecordData {
    if (Object.keys(query).length === 0) {
      const updateKeys = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(', ')
      const updateValues = Object.values(updates)

      const sql = `UPDATE ${this.tableName} SET ${updateKeys}`
      db.prepare(sql).run(...updateValues)

      const selectSql = `SELECT * FROM ${this.tableName} LIMIT 1`
      const updatedRecord = db.prepare(selectSql).get()
      return updatedRecord
    } else {
      const queryKeys = Object.keys(query)
        .map((key) => `${key} = ?`)
        .join(' AND ')
      const queryValues = Object.values(query)

      const updateKeys = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(', ')
      const updateValues = Object.values(updates)

      const sql = `UPDATE ${this.tableName} SET ${updateKeys} WHERE ${queryKeys}`
      const params = [...updateValues, ...queryValues]

      const selectBeforeUpdateSql = `SELECT * FROM ${this.tableName} WHERE ${queryKeys}`

      db.prepare(sql).run(...params)

      const updatedRecord = db.prepare(selectBeforeUpdateSql).get(...queryValues)
      return updatedRecord || null
    }
  }

  updateMany(query: RecordData, data: RecordData) {
    const conditionKeys = Object.keys(query)
    const updateKeys = Object.keys(data)

    if (conditionKeys.length === 0 || updateKeys.length === 0) {
      throw new Error('Missing query conditions or update data')
    }

    const conditionClause = conditionKeys.map((key) => `${key} = ?`).join(' AND ')
    const updateClause = updateKeys.map((key) => `${key} = ?`).join(', ')

    const conditionValues = Object.values(query)
    const updateValues = Object.values(data)

    const stmt = db.prepare(`
    UPDATE ${this.tableName}
    SET ${updateClause}
    WHERE ${conditionClause}
    RETURNING *
  `)

    return db
      .transaction(() => {
        return stmt.all(...updateValues, ...conditionValues)
      })
      .immediate()
  }

  updateManyExcludeOrderID1(query: RecordData, data: RecordData) {
    const conditionKeys = Object.keys(query)
    const updateKeys = Object.keys(data)

    if (updateKeys.length === 0) {
      throw new Error('Missing update data')
    }

    let conditionClause = conditionKeys.map((key) => `${key} = ?`).join(' AND ')
    const updateClause = updateKeys.map((key) => `${key} = ?`).join(', ')

    if (conditionClause) {
      conditionClause += ' AND orderID != 1'
    } else {
      conditionClause = 'orderID != 1'
    }

    const conditionValues = Object.values(query)
    const updateValues = Object.values(data)

    db.transaction(() => {
      db.prepare(`UPDATE ${this.tableName} SET ${updateClause} WHERE ${conditionClause}`).run(
        ...updateValues,
        ...conditionValues
      )
    }).immediate()
  }

  updateTypeCrawlForRefresh(newTypeCrawl: string): number {
    const updateQuery = `UPDATE ${this.tableName} SET typeCrawl = ? WHERE checkBoxRefresh = ?`
    const result = db.prepare(updateQuery).run(newTypeCrawl, 1)

    return result.changes
  }

  updateRecordsByCondition(query: RecordData, updateData: RecordData) {
    const conditionKeys = Object.keys(query)
    const updateKeys = Object.keys(updateData)

    if (conditionKeys.length === 0 || updateKeys.length === 0) {
      throw new Error('Missing query conditions or update data')
    }

    const conditionClause = conditionKeys.map((key) => `${key} = ?`).join(' AND ')
    const updateClause = updateKeys.map((key) => `${key} = ?`).join(', ')

    const conditionValues = Object.values(query)
    const updateValues = Object.values(updateData)

    db.transaction(() => {
      db.prepare(`UPDATE ${this.tableName} SET ${updateClause} WHERE ${conditionClause}`).run(
        ...updateValues,
        ...conditionValues
      )
    }).immediate()
  }

  delete(query: RecordData) {
    // model.delete({ id: 1 })
    const [key, value] = Object.entries(query)[0]

    db.transaction(() => {
      db.prepare(`DELETE FROM ${this.tableName} WHERE ${key} = ?`).run(value)
    }).immediate()
  }

  deleteMany(query: RecordData) {
    const conditions = Object.entries(query)
      .map(([key]) => `${key} = ?`)
      .join(' AND ')

    const values = Object.values(query)

    db.transaction(() => {
      db.prepare(`DELETE FROM ${this.tableName} WHERE ${conditions}`).run(...values)
    }).immediate()
  }

  deleteAll() {
    db.transaction(() => {
      db.prepare(`DELETE FROM ${this.tableName}`).run()
    }).immediate()
  }

  getNewest() {
    return db.prepare(`SELECT * FROM ${this.tableName} ORDER BY id DESC LIMIT 1`).get()
  }
}

export function createModel(tableName: string, schema: string): Model {
  return new Model(tableName, schema)
}

export function clearAllTables() {
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master 
       WHERE type='table' 
       AND name NOT LIKE 'sqlite_%'`
    )
    .all()

  const transaction = db.transaction(() => {
    db.prepare('PRAGMA foreign_keys = OFF').run()

    for (const table of tables) {
      db.prepare(`DELETE FROM ${table.name}`).run()
    }

    db.prepare('PRAGMA foreign_keys = ON').run()
  })

  transaction.immediate()
}

export function clearTable(tableName: string) {
  const tableExists = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`)
    .get(tableName)

  if (tableExists) {
    const deleteTransaction = db.transaction(() => {
      db.prepare('PRAGMA foreign_keys = OFF').run()
      db.prepare(`DELETE FROM ${tableName}`).run()
      db.prepare('PRAGMA foreign_keys = ON').run()
    })

    deleteTransaction.immediate()
  }
}
export const AuthToken = createModel('AuthToken', authTokensSchema)

export const Account = createModel('Account', accountSchema)
export const Platform = createModel('Platform', platformSchema)
export const SportsBook = createModel('SportsBook', sportsBookSchema)
export const Setting = createModel('Setting', settingSchema)
export const NameTeam = createModel('NameTeam', nameTeamSchema)
export const NameLeague = createModel('NameLeague', nameLeagueSchema)

export function ensureNameTeamLookupIndex() {
  db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_nameteam_lookup
     ON NameTeam (platform, nameLeague, nameTeam, team, league)`
  ).run()
}

export function dropNameTeamLookupIndex() {
  db.prepare('DROP INDEX IF EXISTS idx_nameteam_lookup').run()
}

export const NAME_TEAM_CACHE_KEY = 'NameTeam'
createModel('CacheVersion', 'name TEXT PRIMARY KEY, version INTEGER NOT NULL')

export function bumpCacheVersion(name: string) {
  db.prepare(
    `INSERT INTO CacheVersion (name, version) VALUES (?, 1)
     ON CONFLICT(name) DO UPDATE SET version = version + 1`
  ).run(name)
}

export function getCacheVersion(name: string): number {
  const row = db.prepare('SELECT version FROM CacheVersion WHERE name = ?').get(name)
  return row?.version ?? 0
}

export const LeagueViva88 = createModel('LeagueViva88', leagueViva88Schema)
export const EventViva88 = createModel('EventViva88', eventViva88Schema)
export const IndexViva88 = createModel('IndexViva88', dataCrawlByPlatformViva88Schema)

export const LeagueSbobet = createModel('LeagueSbobet', leagueSbobetSchema)
export const EventSbobet = createModel('EventSbobet', eventSbobetSchema)

export const PerMatchLimit = createModel('PerMatchLimit', perMatchLimitSchema)
export const PerMatchLimitPlatform = createModel(
  'PerMatchLimitPlatform',
  perMatchLimitPlatformSchema
)

export const PerMatchDetail = createModel('PerMatchDetail', platformPerMatchDetailsSchema)
export const DataBet = createModel('DataBet', dataBetSchema)

export const BetListResult = createModel('BetListResult', betListResultSchema)
export const FailedBetList = createModel('FailedBetList', failedBetListSchema)
export const WaitingList = createModel('WaitingList', waitingListSchema)
export const ContraList = createModel('ContraList', contraListSchema)
export const SuccessList = createModel('SuccessList', successListSchema)
export const SuccessListShowOdd = createModel('SuccessListShowOdd', successListSchema)
export const BlockLeague = createModel('BlockLeague', blockLeagueSchema)
export const AllowLeague = createModel('AllowLeague', allowLeagueSchema)

export const SettingPerMatchLimit = createModel(
  'SettingPerMatchLimit',
  settingPerMatchLimitSettingSchema
)

export const SettingLeagueFilter = createModel('SettingLeagueFilter', settingLeagueFilterSchema)

export const SportBookCombination = createModel('SportBookCombination', sportBookCombinationSchema)
export const PlatformPair = createModel('PlatformPair', platformPairSchema)
export const PlatformUrl = createModel('PlatformUrl', platformUrlSchema)

export const SettingTableView = createModel('SettingTableView', settingsTableViewSchema)
export const TicketDelaySec = createModel('TicketDelaySec', infoTicketForDelaySecSchema)
export const LeaguePointRandomizer = createModel(
  'LeaguePointRandomizer',
  leaguePointRandomizerSchema
)

export const ScheduledLoginLogout = createModel('ScheduledLoginLogout', scheduledLoginLogoutSchema)
export const SportsBookProviders = createModel('SportsBookProviders', sportsBookProvidersSchema)

export const ActivePlatformShowOdds = createModel(
  'ActivePlatformShowOdds',
  activePlatformShowOddsSchema
)

export default Model
