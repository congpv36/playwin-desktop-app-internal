const leaguePointRandomizerSchema = `
            id TEXT PRIMARY KEY,
            
            league TEXT,
            checked INTEGER,
            fromValue TEXT,
            toValue TEXT
      `

export default leaguePointRandomizerSchema
