const nameTeamSchema = `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nameTeam TEXT NOT NULL,
        nameLeague TEXT,
        platform TEXT NOT NULL,
        idPlatform INTEGER NOT NULL,
        team TEXT,
        league TEXT
      `
export default nameTeamSchema
