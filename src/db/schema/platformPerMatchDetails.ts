export type PlatformPerMatchDetailsType = {
  id: number
  platform: string
  sport: string
  coverage: string
  gameStatus: string
  redCard: string
  score: string
  league: string
  home: string
  away: string
  bet: string
  HDP: string
  amount: string
  count: string
}

const platformPerMatchDetailsSchema = `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        
        platform TEXT,
        sport TEXT,
        coverage TEXT,
        gameStatus TEXT,
        redCard TEXT,
        score TEXT,
        league TEXT,
        home TEXT,
        away TEXT,
        bet TEXT,
        HDP TEXT,
        amount TEXT,
        count TEXT
      `
export default platformPerMatchDetailsSchema
