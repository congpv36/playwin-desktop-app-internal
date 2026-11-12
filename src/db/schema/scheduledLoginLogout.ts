export type ScheduledLoginLogoutType = {
  id: string
  platformName: string
  checked: number
  loginSetting: string
  logoutSetting: string
}

const scheduledLoginLogoutSchema = `
        id TEXT PRIMARY KEY NOT NULL,

        platformName TEXT NOT NULL,
        checked INTEGER NOT NULL,
        
        loginSetting TEXT NOT NULL,
        logoutSetting TEXT NOT NULL
        `

export default scheduledLoginLogoutSchema
