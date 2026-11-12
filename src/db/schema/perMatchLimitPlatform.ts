export type PerMatchLimitPlatformType = {
  id: number
  league: string
  home: string
  away: string
  platform: string
  count: string
  countCurrent: string
  amount: string
  amountCurrent: string
}

const perMatchLimitPlatformSchema = `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        league TEXT,
        home TEXT,
        away TEXT,
        platform TEXT,
        count TEXT,
        countCurrent TEXT,
        amount TEXT,
        amountCurrent TEXT
      `
export default perMatchLimitPlatformSchema
