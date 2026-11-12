export type EventSbobetType = {
  id: number
  idLeague: number
  nameLeague: string
  league: string

  idEvent: number
  nameHome: string
  nameAway: string
  home: string
  away: string
  showTime: string
  liveperiod: number
  livehomescore: number
  liveawayscore: number
  livetimer: string
  awayred: number
  homered: number
  isht: string
}

const eventSbobetSchema = `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idLeague INTEGER NOT NULL,
        nameLeague TEXT NOT NULL,
        league TEXT,

        idEvent INTEGER NOT NULL,
        nameHome TEXT NOT NULL,
        nameAway TEXT NOT NULL,
        home TEXT,
        away TEXT,
        showTime TEXT,
        liveawayscore INTEGER,
        livehomescore INTEGER,
        livetimer INTEGER,
        awayred INTEGER,
        homered INTEGER,
        liveperiod INTEGER,
        isht TEXT,
        liveHandicapType TEXT,
        nonLiveHandicapType TEXT
      `
export default eventSbobetSchema
