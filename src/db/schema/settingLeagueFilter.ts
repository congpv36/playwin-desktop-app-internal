const settingLeagueFilterSchema = `
          id TEXT PRIMARY KEY NOT NULL,
          filterType TEXT,
          blockMajorLeague INTEGER,
          allowMajorLeague INTEGER
          `

export default settingLeagueFilterSchema
