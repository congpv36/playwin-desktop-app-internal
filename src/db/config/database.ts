const os = require('os')
const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3-multiple-ciphers')

const roamingPath = path.join(os.homedir(), 'AppData', 'Roaming')
const folderPath = path.join(roamingPath, `${import.meta.env.VITE_BUILD_TARGET}-data`)

if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath, { recursive: true })
}

const dbFilePath = path.join(folderPath, 'database.sqlite')
if (!fs.existsSync(dbFilePath)) {
  fs.writeFileSync(dbFilePath, '')
}

const db = new Database(dbFilePath, { timeout: 30000 })

db.pragma(`cipher='sqlcipher'`)
db.pragma(`legacy=4`)
db.pragma(`key='${import.meta.env.VITE_KEY_DB}'`)

db.pragma('busy_timeout = 30000')
db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')
db.pragma('foreign_keys = ON')

export default db
