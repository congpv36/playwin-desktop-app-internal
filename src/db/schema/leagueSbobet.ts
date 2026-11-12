export type LeagueSbobetType = {
  id: number
  idLeague: number
  nameLeague: string
  league: string
}

const leagueSbobetSchema = `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idLeague INTEGER NOT NULL,
        nameLeague TEXT NOT NULL,
        league TEXT
      `

export default leagueSbobetSchema
