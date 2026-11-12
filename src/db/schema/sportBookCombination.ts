export type SportBookCombinationDBType = {
  id: string
  isValid: number
  key: string
  sportBook1: string
  sportBook2: string
}

const sportBookCombinationSchema = `
            id TEXT PRIMARY KEY,
            
            isValid INTEGER,
            key TEXT,
            sportBook1 TEXT,
            sportBook2 TEXT
          `

export default sportBookCombinationSchema
