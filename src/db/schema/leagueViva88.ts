export type LeagueViva88Type = {
  id: number
  idLeague: number
  nameLeague: string
  league: string
}

const leagueViva88Schema = `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idLeague INTEGER NOT NULL,
        nameLeague TEXT NOT NULL,
        league TEXT
      `

export default leagueViva88Schema
