export type AuthTokenType = {
  id: number
  accessToken: string
  refreshToken: string
}

const authTokensSchema = `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        accessToken TEXT NOT NULL,
        refreshToken TEXT NOT NULL
          `

export default authTokensSchema
