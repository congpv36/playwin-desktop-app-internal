export type PerMatchLimitType = {
  id: number
  league: string
  home: string
  away: string
  bet: string
  time: number
  type: string
  hdp_point: number
  odd: number
  betAmount_Standard: string
  idAccount: string
}

const perMatchLimitSchema = `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        league TEXT,
        home TEXT,
        away TEXT,
        bet TEXT,
        time INTEGER,
        type TEXT,
        hdp_point REAL,
        odd REAL,
        betAmount_Standard TEXT,
        idAccount TEXT,

        FOREIGN KEY (idAccount) REFERENCES Account(id) ON DELETE CASCADE
      `
export default perMatchLimitSchema
