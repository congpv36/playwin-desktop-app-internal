/* eslint-disable @typescript-eslint/no-explicit-any */
import { join } from 'path'
import { setTimeout as delay } from 'timers/promises'

import {
  Account,
  AuthToken,
  clearAllTables,
  clearTable,
  ensureNameTeamLookupIndex,
  NameLeague,
  NameTeam,
  Platform,
  ScheduledLoginLogout,
  Setting,
  SettingLeagueFilter,
  SettingTableView,
  SportsBookProviders
} from '@db/model'
import { ScheduledLoginLogoutType } from '@db/schema/scheduledLoginLogout'
import { SettingSchemaType } from '@db/schema/setting'
import { is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import { v4 as uuidv4 } from 'uuid'

import { Announcement, PlatformType, SettingLeagueFilterType } from '@shared/common/types'
import { SettingTableViewType } from '@shared/common/types'
import { DEFAULT_ACCOUNT_STATUS, DEFAULT_SETTING } from '@shared/main/constants'

import { createPopupImage } from './browserWindows/popupImage'
import { initSocket } from './browserWindows/service/socket'

import { createInitAppWindow } from '@/browserWindows/initAppWindow'
import { createMainWindow } from '@/browserWindows/mainWindow'
import { fetchDataSystem } from '@/browserWindows/service/fetchDataSystem'
import { handleUserSettingsSync } from '@/browserWindows/service/handleUserSettingsSync'
import { createWorkerScheduledLoginSetting, createWorkerScheduledLogoutSetting } from '@/worker'
import { systemLogToFile } from '@/worker/lib/systemLogToFile'

type ResponseData<T> = {
  message: string
  data: T
}

let loginWindow: BrowserWindow | null = null
let mainWindow: BrowserWindow | null = null

app.setAppUserModelId(import.meta.env.VITE_APP_USER_MODEL_ID)

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
}

function createWindow() {
  const loginWindow = new BrowserWindow({
    width: 456,
    height: 638,
    maximizable: false,
    minimizable: false,
    resizable: false,
    show: false,
    autoHideMenuBar: true,
    center: true,
    frame: false,
    titleBarOverlay: false,
    transparent: true,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    trafficLightPosition: { x: 15, y: 10 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  ipcMain.on('CloseLoginWindow', () => {
    loginWindow.close()
    app.quit()
  })

  let isLoggingIn = false
  ipcMain.on('AttemptLogin', async (event, { username, password }) => {
    if (isLoggingIn) return

    isLoggingIn = true
    try {
      const payload = { username, password, appType: import.meta.env.VITE_APP_TYPE }

      const response = await fetch(`${import.meta.env.VITE_URL}/user/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        await systemLogToFile('Login: Invalid credentials.', 'Error')
        return event.reply('LoginResult', { success: false, message: 'Invalid credentials.' })
      }
      const responseData = (await response.json()) as {
        data: { accessToken: string; account: any; refreshToken: string; versionLatest: string }
      }

      AuthToken.create({
        accessToken: responseData.data.accessToken,
        refreshToken: responseData.data.refreshToken
      })

      try {
        await systemLogToFile(`[Login] SetupCheckUpdate has been activated`, 'Program')
        setupCheckUpdate(event, loginWindow, responseData)
      } catch (error) {
        console.log('[Login] Error in setupCheckUpdate', error)
        await systemLogToFile(`[Login] CheckUpdateVersion: ${JSON.stringify(error)}`, 'Error')
      }
    } catch (error) {
      if (error instanceof Error) {
        await systemLogToFile(`Login: ${JSON.stringify(error.message)}`, 'Error')
        console.error('Login error:', error)
        event.reply('LoginResult', {
          success: false,
          message: `Login Fail: ${error.message}`
        })
      } else {
        await systemLogToFile('Login: An error occurred during login. Please try again.', 'Error')

        console.error('Login error:', error)
        event.reply('LoginResult', {
          success: false,
          message: 'An error occurred during login. Please try again.'
        })
      }
    } finally {
      isLoggingIn = false
    }
  })

  loginWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    loginWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/#/login`)
  } else {
    loginWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'login' })
  }

  loginWindow.webContents.once('did-finish-load', () => {
    loginWindow.show()
  })

  return loginWindow
}

function setupCheckUpdate(
  event: Electron.IpcMainEvent,
  loginWindow: BrowserWindow,
  responseData: {
    data: { accessToken: string; account: any; refreshToken: string; versionLatest: string }
  }
) {
  if (is.dev) {
    autoUpdater.forceDevUpdateConfig = true
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: import.meta.env.VITE_URL_RELEASES
    })
    // Skip update check in dev mode
    proceedToLoadingWindow(event, loginWindow, responseData)
    return
  }

  autoUpdater.checkForUpdates()

  autoUpdater.on('checking-for-update', async () => {
    await systemLogToFile(`[Login] Checking for update...`, 'Program')

    console.log('Login: Checking for update...')
  })

  autoUpdater.on('update-available', async () => {
    await systemLogToFile(`[Login] Update-available...`, 'Program')

    console.log('Login: Update available, downloading...')
    if (loginWindow) {
      loginWindow.webContents.send('show-loading')
    }
    autoUpdater.downloadUpdate()
  })

  autoUpdater.on('update-not-available', async () => {
    await systemLogToFile(`[Login] Update-not-available...`, 'Program')

    console.log('Login: No update available.')
    proceedToLoadingWindow(event, loginWindow, responseData)
  })

  autoUpdater.on('error', async (err) => {
    await systemLogToFile(`[Login] CheckForUpdates: ERR_NAME_NOT_RESOLVED`, 'Program')

    console.log('Login: AutoUpdater error:', err)
    proceedToLoadingWindow(event, loginWindow, responseData)
  })

  autoUpdater.on('download-progress', async (progress) => {
    await systemLogToFile(`[Login] Download-progress: ${Math.round(progress.percent)}%`, 'Program')

    console.log(`Login:  Downloading... ${Math.round(progress.percent)}%`)

    if (loginWindow) {
      loginWindow?.webContents.send('update-download-progress', Math.round(progress.percent))
    }
  })

  autoUpdater.on('update-downloaded', async () => {
    await systemLogToFile(`[Login] Update-downloaded.`, 'Program')

    console.log('Login: Update-downloaded')

    loginWindow?.webContents.send('update-downloaded')
    await new Promise((resolve) => setTimeout(resolve, 4000))
    autoUpdater.quitAndInstall(true, true)
  })
}

async function proceedToLoadingWindow(
  event: Electron.IpcMainEvent,
  loginWindow: BrowserWindow,
  responseData: {
    data: { accessToken: string; account: any; refreshToken: string; versionLatest: string }
  }
) {
  autoUpdater.removeAllListeners()
  await systemLogToFile(`Get /api/v1/user/auth/login: Response 200 OK`, 'Program')
  const { accessToken, account } = responseData.data

  event.reply('LoginResult', { success: true, message: 'success', data: responseData.data })

  loginWindow?.close()
  const initAppWindow = createInitAppWindow()

  await handleUserSettingsSync(accessToken)

  Account.update({}, DEFAULT_ACCOUNT_STATUS)

  const dataSetting = Setting.findAll() as SettingSchemaType[]
  if (!dataSetting.length) {
    Setting.create(DEFAULT_SETTING)
    Account.updateTypeCrawlForRefresh('Running')
  } else {
    Account.updateTypeCrawlForRefresh(dataSetting[0].gameType)
  }

  SportsBookProviders.create({ id: uuidv4(), idSportsBook: 'sports-book1' })

  const settingTableView = SettingTableView.findAll() as unknown as SettingTableViewType[]
  if (!settingTableView.length) {
    SettingTableView.insertMany([
      { tab: 'BetList', contraStrategy: 'auto', clear: 1, scroll: 1 },
      { tab: 'WaitingList', contraStrategy: '', clear: 1, scroll: 1 },
      { tab: 'ContraList', contraStrategy: 'auto', clear: 1, scroll: 1 },
      { tab: 'SuccessList', contraStrategy: '', clear: 0, scroll: 0 },
      { tab: 'FailedBetList', contraStrategy: '', clear: 1, scroll: 1 }
    ])
  } else {
    SettingTableView.update({ tab: 'BetList' }, { contraStrategy: 'auto', clear: 1, scroll: 1 })
    SettingTableView.update({ tab: 'WaitingList' }, { contraStrategy: '', clear: 1, scroll: 1 })
    SettingTableView.update({ tab: 'ContraList' }, { contraStrategy: 'auto', clear: 1, scroll: 1 })
    SettingTableView.update({ tab: 'SuccessList' }, { contraStrategy: '', clear: 0, scroll: 0 })

    if (!SettingTableView.findOne({ tab: 'FailedBetList' })) {
      SettingTableView.create({ tab: 'FailedBetList', contraStrategy: '', clear: 1, scroll: 1 })
    }
  }

  const settingLeagueFilter = SettingLeagueFilter.findAll() as SettingLeagueFilterType[]
  if (!settingLeagueFilter.length) {
    SettingLeagueFilter.create({
      id: uuidv4(),
      filterType: 'Block',
      blockMajorLeague: 0,
      allowMajorLeague: 0
    })
  }

  await Promise.all([
    fetchDataSystem(
      `${import.meta.env.VITE_URL}/user/platform`,
      Platform,
      (platform: { id: string; platformName: string; url: string }) => ({
        findCriteria: { name: platform.platformName },
        data: { uuid: platform.id, name: platform.platformName, url: platform.url }
      }),
      accessToken
    ),
    fetchDataSystem(
      `${import.meta.env.VITE_URL}/user/league`,
      NameLeague,
      (league: {
        leagueId: string
        leagueName: string
        standardLeagueName: null | string
        platformId: string
        platformName: string
        platformUrl: string
      }) => {
        const platform = Platform.findOne({ name: league.platformName }) as PlatformType
        if (!platform) return null
        return {
          findCriteria: {
            nameLeague: league.leagueName.trim(),
            platform: league.platformName,
            league: league.standardLeagueName
          },
          data: {
            nameLeague: league.leagueName.trim(),
            platform: league.platformName,
            idPlatform: platform.id,
            league: league.standardLeagueName
          }
        }
      },
      accessToken
    ),
    fetchDataSystem(
      `${import.meta.env.VITE_URL}/user/team`,
      NameTeam,
      (team: {
        teamId: string
        teamName: string
        standardTeamName: null | string
        platformId: string
        platformName: string
        platformUrl: string
        leagueId: string
        leagueName: string
        standardLeagueName: null | string
      }) => {
        const platform = Platform.findOne({ name: team.platformName }) as PlatformType
        if (!platform) return null
        return {
          findCriteria: {
            nameTeam: team.teamName.trim(),
            platform: team.platformName,
            nameLeague: team.leagueName.trim(),
            team: team.standardTeamName,
            league: team.standardLeagueName
          },
          data: {
            nameTeam: team.teamName.trim(),
            nameLeague: team.leagueName.trim(),
            platform: team.platformName,
            idPlatform: platform.id,
            team: team.standardTeamName,
            league: team.standardLeagueName
          }
        }
      },
      accessToken
    )
  ]).catch(async (error) => {
    console.error('Error in concurrent API calls:', error)
    await systemLogToFile(
      `Concurrent API calls failed: ${error instanceof Error ? error.message || 'Unknown error' : String(error)}`,
      'Error'
    )
  })

  const listPlatform = Platform.findAll() as PlatformType[]
  const listScheduledLoginLogout = ScheduledLoginLogout.findAll() as ScheduledLoginLogoutType[]

  if (listScheduledLoginLogout.length !== 0) {
    const listScheduledLoginLogoutParse = listScheduledLoginLogout.map((item) => {
      const loginSetting = JSON.parse(item.loginSetting)
      const logoutSetting = JSON.parse(item.logoutSetting)

      return {
        ...item,
        loginSetting: JSON.stringify({
          enabled: loginSetting.enabled || 0,
          schedules: Array.isArray(loginSetting.schedules) ? loginSetting.schedules : []
        }),
        logoutSetting: JSON.stringify({
          enabled: logoutSetting.enabled || 0,
          schedules: Array.isArray(logoutSetting.schedules) ? logoutSetting.schedules : []
        })
      }
    }) as ScheduledLoginLogoutType[]

    clearTable('ScheduledLoginLogout')
    ScheduledLoginLogout.insertMany(listScheduledLoginLogoutParse)

    const validPlatformNames = listPlatform.map((item) => item.name)

    const invalidScheduled = listScheduledLoginLogoutParse.filter(
      (item) => !validPlatformNames.includes(item.platformName)
    )

    invalidScheduled.forEach((item) => {
      ScheduledLoginLogout.delete({ id: item.id })
    })

    const scheduledPlatformNames = listScheduledLoginLogoutParse.map((item) => item.platformName)

    const missingPlatforms = listPlatform.filter((p) => !scheduledPlatformNames.includes(p.name))
    if (missingPlatforms.length > 0) {
      const newRecords = missingPlatforms.map((p) => ({
        id: uuidv4() as string,
        platformName: p.name,
        checked: 0,
        loginSetting: JSON.stringify({ enabled: 0, schedules: [] }),
        logoutSetting: JSON.stringify({ enabled: 0, schedules: [] })
      }))

      ScheduledLoginLogout.insertMany(newRecords)
    }
  } else {
    const scheduledLoginLogoutList = listPlatform.map((p) => ({
      id: uuidv4() as string,
      platformName: p.name,
      checked: 0,
      loginSetting: JSON.stringify({ enabled: 0, schedules: [] }),
      logoutSetting: JSON.stringify({ enabled: 0, schedules: [] })
    }))

    ScheduledLoginLogout.insertMany(scheduledLoginLogoutList)
  }

  const [responseApiImage] = await Promise.all([
    fetch(
      `${import.meta.env.VITE_URL}/user/system-config/announcement?appType=${import.meta.env.VITE_APP_TYPE}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      }
    )
  ])

  const dataImage = (await responseApiImage.json()) as ResponseData<Announcement>

  initAppWindow.webContents.send('init-app-done')
  await delay(2000)

  mainWindow = await createMainWindow(account)
  mainWindow.webContents.once('did-finish-load', () => {
    if (dataImage?.data.isEnable) {
      const popupA = createPopupImage(
        dataImage?.data?.announcementType,
        dataImage?.data?.content,
        import.meta.env.VITE_URL_IMAGE + dataImage?.data?.filePath
      )
      popupA.on('closed', () => {
        if (account.warningExpired) {
          mainWindow?.webContents.send('show-session-expire-popup', {
            expiredDate: account.expiredDate,
            autoCloseMs: 5000
          })
        }
      })
    } else {
      if (account.warningExpired) {
        mainWindow?.webContents.send('show-session-expire-popup', {
          expiredDate: account.expiredDate,
          autoCloseMs: 5000
        })
      }
    }

    initAppWindow.close()
  })

  initSocket(accessToken, 'en', mainWindow)
  createWorkerScheduledLoginSetting(mainWindow)
  createWorkerScheduledLogoutSetting(mainWindow)
}

app.on('second-instance', () => {
  if (loginWindow && !loginWindow.isDestroyed()) {
    if (loginWindow.isMinimized()) loginWindow.restore()
    loginWindow.focus()
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

// Without these listeners Electron shows a blocking error dialog for any stray exception in the main process
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
  systemLogToFile(`Uncaught exception: ${error.stack ?? error.message}`, 'Error')
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
  systemLogToFile(`Unhandled rejection: ${String((reason as Error)?.stack ?? reason)}`, 'Error')
})

app.whenReady().then(() => {
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  loginWindow = createWindow()

  clearAllTables()
  ensureNameTeamLookupIndex()
})

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) {
    loginWindow = createWindow()
  }
})

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
