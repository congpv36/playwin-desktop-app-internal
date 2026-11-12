export type SettingPerMatchLimitType = {
  id: string
  namePlatform: string
  limitMethod: string
  limitType: string
  totalAmount: string
  totalCount: string
}

const settingPerMatchLimitSettingSchema = `
        id TEXT PRIMARY KEY NOT NULL,

        namePlatform TEXT,
        limitMethod TEXT,

        limitType TEXT,
        totalAmount TEXT,
        totalCount TEXT
      `

export default settingPerMatchLimitSettingSchema
