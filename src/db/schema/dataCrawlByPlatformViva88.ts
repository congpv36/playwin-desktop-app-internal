const dataCrawlByPlatformViva88Schema = `
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        leagueid INTEGER  NULL,
        leaguenameen INTEGER  NULL,

        matchid INTEGER NOT NULL,
        hteamnameen INTEGER  NULL,
        ateamnameen INTEGER  NULL,

        oddsstatus INTEGER  NULL,

        livehomescore INTEGER  NULL,
        liveawayscore INTEGER  NULL,

        specialOdd INTEGER  NULL,
        bettype INTEGER  NULL,

        kickofftime INTEGER  NULL,
        liveperiod INTEGER  NULL,
        livetimer INTEGER  NULL,
        oddsid INTEGER  NULL,
        parenttypeid INTEGER  NULL,
        odds1a INTEGER  NULL,
        odds2a INTEGER  NULL,
        hdp1 INTEGER  NULL,
        hdp2 INTEGER  NULL,
        awayred INTEGER  NULL,
        homered INTEGER  NULL,
        isht INTEGER  NULL
      `

export default dataCrawlByPlatformViva88Schema
