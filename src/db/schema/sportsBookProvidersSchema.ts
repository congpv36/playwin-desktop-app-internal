export type SportsBookProvidersType = {
  id: string
  idSportsBook: string
}

const sportsBookProvidersSchema = `
        id TEXT PRIMARY KEY NOT NULL,
        idSportsBook TEXT NOT NULL
      `

export default sportsBookProvidersSchema
