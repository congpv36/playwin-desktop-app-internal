export type ActivePlatformShowOddsType = {
  id: string
  platformName: string
}

const activePlatformShowOddsSchema = `
          id TEXT PRIMARY KEY NOT NULL,

          platformName TEXT
          `

export default activePlatformShowOddsSchema
