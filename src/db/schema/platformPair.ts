export type PlatformPairType = {
  id: number
  platform1: string
  platform2: string
  key: string
}

const platformPairSchema = `
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        platform1 TEXT,
        platform2 TEXT,

        key TEXT
        `

export default platformPairSchema
