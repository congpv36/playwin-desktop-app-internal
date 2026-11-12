import { join } from 'path'

import {
  Account,
  ActivePlatformShowOdds,
  AllowLeague,
  BetListResult,
  BlockLeague,
  clearTable,
  ContraList,
  createModel,
  FailedBetList,
  LeaguePointRandomizer,
  NameLeague,
  PerMatchDetail,
  PerMatchLimit,
  Platform,
  PlatformUrl,
  ScheduledLoginLogout,
  Setting,
  SettingLeagueFilter,
  SettingPerMatchLimit,
  SettingTableView,
  SportsBook,
  SportsBookProviders,
  SuccessList,
  SuccessListShowOdd,
  WaitingList
} from '@db/model'
import dataCrawlByPlatformSchema from '@db/schema/dataCrawlByPlatform'
import { ScheduledLoginLogoutType } from '@db/schema/scheduledLoginLogout'
import { SettingSchemaType } from '@db/schema/setting'
import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'

import { LanguageType } from '@shared/common/constants'
import {
  AccountType,
  DataCrawlType,
  LeaguePointRandomizerType,
  NameLeagueType,
  PlatformType,
  ScheduledLoginLogoutParseType,
  SettingPerMatchLimitType,
  SportsBookType
} from '@shared/common/types'
import {
  BetListDBType,
  SettingTableViewType,
  WaitingSuccessContraDBType
} from '@shared/common/types'
import {
  DEFAULT_ACCOUNT_STATUS,
  DEFAULT_SPORTS_BOOK_CONFIG,
  DEFAULT_TEAM_NAME_LIMIT,
  STATUS_ACCOUNT
} from '@shared/main/constants'
import {
  DataBetSettingPayload,
  SaveBetFixedAmountValueType,
  SchedulerType
} from '@shared/main/types'

import { handleGetTicketShowOdd } from './service/handleGetTicketShowOdd'
import { handlePlaceTicketShowOdd } from './service/handlePlaceTicketShowOdd'
import { processShowOdds } from './service/showOddsTransform'

import { GetListPlatformPair } from '@/browserWindows/service/getListPlatformPair'
import { GetSportBook1SportBook2 } from '@/browserWindows/service/getSportBook1SportBook2'
import { getSuggestedClient } from '@/browserWindows/service/getSuggestedClient'
import { handleDeletePlatForm } from '@/browserWindows/service/handleDeletePlatForm'
import { handleGetDataSportsBook } from '@/browserWindows/service/handleGetDataSportsBook'
import { handleListReportFile } from '@/browserWindows/service/handleListReportFile'
import { handleLoginAll } from '@/browserWindows/service/handleLoginAll'
import {
  handleLoginAccount,
  handleLogoutAccount
} from '@/browserWindows/service/handleLoginLogoutAccount'
import { handleLogoutAll } from '@/browserWindows/service/handleLogoutAll'
import { refreshAccessToken } from '@/browserWindows/service/refreshAccessToken'
import { SaveSportBookCombination } from '@/browserWindows/service/saveSportBookCombination'
import { sendUserSettingsToServer } from '@/browserWindows/service/sendUserSettingsToServer'
import { setupAutoUpdater } from '@/browserWindows/service/setupAutoUpdater'
import { updateDataAccount } from '@/browserWindows/service/updateDataAccount'
import { updateDataListAccount } from '@/browserWindows/service/updateDataListAccount'
import { updateSportsBookPairStatus } from '@/browserWindows/service/updateSportsBookPairStatus'
import { platformPairStatusManager } from '@/worker/handlePairPlatform/manager'
import {
  abortDelayLogin,
  cancelAllDelayLogins,
  getDelayLoginSnapshot,
  loginNowDelayLogin
} from '@/worker/lib/delayLogin'
import { systemLogToFile } from '@/worker/lib/systemLogToFile'
import { PLATFORM, TABLE_NAME_BY_PLATFORM } from '@/worker/platform/platform.config'
import {
  cancelOtpForLoginWorker,
  cancelRateLimitForLoginWorker,
  submitOtpToLoginWorker
} from '@/worker/workerCrawl.manager'

export async function createMainWindow(account: {
  id: string
  username: string
  isActive: boolean
  role: string
}) {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 177,
    minHeight: 100,
    show: false,
    autoHideMenuBar: true,
    center: true,
    frame: false,
    titleBarOverlay: false,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    trafficLightPosition: { x: 15, y: 10 },
    icon: 'build/icon.png',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/#/main`)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'main' })
  }

  mainWindow.on('closed', cancelAllDelayLogins)

  mainWindow.webContents.once('did-finish-load', async () => {
    mainWindow.show()
    platformPairStatusManager(mainWindow)
    if (!is.dev) {
      await systemLogToFile(`[Main] SetupAutoCheckUpdate has been activated`, 'Program')
      setupAutoUpdater()
    }
  })

  ipcMain.on('window-control', (event, action: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    switch (action) {
      case 'minimize':
        win.minimize()
        break
      case 'maximize':
        win.isMaximized() ? win.unmaximize() : win.maximize()
        break
      case 'close':
        win.close()
        break
    }
  })
  //************************************** Popup Account *********************************************** */
  let activeSportsBook: string = 'sports-book1'

  ipcMain.on('SetActiveSportsbookTab', (_, activeId) => {
    activeSportsBook = activeId
  })
  //************************************** SettingWindow *********************************************** */

  ipcMain.handle('GetDataSetting', () => {
    const setting = Setting.findAll()[0] as SettingSchemaType

    const settingTotalGoal = setting?.settingTotalGoal
      ? JSON.parse(setting.settingTotalGoal)
      : { enable: 0, from: 0, to: 0 }

    const settingScoreListRaw = setting?.settingScoreList
      ? JSON.parse(setting.settingScoreList)
      : { enable: 0, list: [] }

    return {
      ...setting,
      settingTotalGoal: settingTotalGoal,
      settingScoreList: {
        ...settingScoreListRaw,
        list: [...settingScoreListRaw.list, { home: '', away: '' }]
      }
    }
  })

  let intervalId: NodeJS.Timeout | null = null

  ipcMain.on('SaveSettingWindow', async (_, data: SettingSchemaType) => {
    const setting = Setting.findAll()[0] as SettingSchemaType
    Setting.update({ id: setting.id }, data)

    Account.updateMany({ checkBoxRefresh: 1 }, { typeCrawl: data.gameType })

    const scheduler = {
      schedulerRunning: data.schedulerRunning,
      schedulerInputRunning: data.schedulerInputRunning,
      schedulerToday: data.schedulerToday,
      schedulerInputToday: data.schedulerInputToday,
      schedulerEarly: data.schedulerEarly,
      schedulerInputEarly: data.schedulerInputEarly
    }

    function scheduleLogger(scheduler: SchedulerType) {
      const now = new Date()
      const currentTime = now.getHours() * 100 + now.getMinutes()

      const parseTimeRange = (timeRange: string) => {
        if (!timeRange) return null
        const [start, end] = timeRange.split('-').map(Number)
        const isCrossDay = end < start
        return { start, end, isCrossDay }
      }

      const isTimeInRange = (current: number, start: number, end: number, isCrossDay: boolean) => {
        if (isCrossDay) {
          return current >= start || current <= end
        } else {
          return current >= start && current <= end
        }
      }

      const allSchedulersOff =
        scheduler.schedulerEarly === 0 &&
        scheduler.schedulerToday === 0 &&
        scheduler.schedulerRunning === 0

      if (allSchedulersOff) {
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = null
          console.log('Scheduler stopped: All schedulers are 0')
        }
        return
      }

      const earlyRange =
        scheduler.schedulerEarly === 1 && scheduler.schedulerInputEarly
          ? parseTimeRange(scheduler.schedulerInputEarly)
          : null
      const todayRange =
        scheduler.schedulerToday === 1 && scheduler.schedulerInputToday
          ? parseTimeRange(scheduler.schedulerInputToday)
          : null
      const runningRange =
        scheduler.schedulerRunning === 1 && scheduler.schedulerInputRunning
          ? parseTimeRange(scheduler.schedulerInputRunning)
          : null

      const activeSchedulers = [
        { enabled: scheduler.schedulerEarly, input: scheduler.schedulerInputEarly },
        { enabled: scheduler.schedulerToday, input: scheduler.schedulerInputToday },
        { enabled: scheduler.schedulerRunning, input: scheduler.schedulerInputRunning }
      ].filter((s) => s.enabled === 1)

      if (activeSchedulers.length > 0 && activeSchedulers.every((s) => !s.input)) {
        Setting.update({ id: setting.id }, { gameType: 'None' })
        console.log('Length==0 = > None')
        return
      }

      if (
        earlyRange &&
        isTimeInRange(currentTime, earlyRange.start, earlyRange.end, earlyRange.isCrossDay)
      ) {
        Account.updateTypeCrawlForRefresh('Early')
        Setting.update({ id: setting.id }, { ...data, gameType: 'Early' })
        console.log('Early')
      } else if (
        todayRange &&
        isTimeInRange(currentTime, todayRange.start, todayRange.end, todayRange.isCrossDay)
      ) {
        Account.updateTypeCrawlForRefresh('Today')
        Setting.update({ id: setting.id }, { ...data, gameType: 'Today' })

        console.log('Today')
      } else if (
        runningRange &&
        isTimeInRange(currentTime, runningRange.start, runningRange.end, runningRange.isCrossDay)
      ) {
        Account.updateTypeCrawlForRefresh('Running')
        Setting.update({ id: setting.id }, { ...data, gameType: 'Running' })

        console.log('Running')
      } else {
        Account.updateTypeCrawlForRefresh('None')
        Setting.update({ id: setting.id }, { ...data, gameType: 'None' })

        console.log('None')
      }
    }

    function startScheduler(scheduler: SchedulerType) {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
        console.log('Previous scheduler stopped')
      }

      if (
        scheduler.schedulerEarly === 0 &&
        scheduler.schedulerToday === 0 &&
        scheduler.schedulerRunning === 0
      ) {
        console.log('Scheduler not started: All schedulers are 0')
        return
      } else {
        scheduleLogger(scheduler)

        if (!intervalId) {
          intervalId = setInterval(() => {
            scheduleLogger(scheduler)
          }, 40000)
        }
      }
    }

    startScheduler(scheduler)

    await sendUserSettingsToServer()
  })

  ipcMain.on('SaveSettingPopupSwitchBetMode', (_, data: { isBetByOtherAcc: number }) => {
    const setting = Setting.findAll()[0] as SettingSchemaType
    Setting.update({ id: setting.id }, data)

    Account.update({}, DEFAULT_ACCOUNT_STATUS)

    Object.values(PLATFORM).forEach((platform) => {
      const clearName = TABLE_NAME_BY_PLATFORM[platform] ?? platform
      clearTable(clearName)
    })

    mainWindow.webContents.send('DataSportsBook', handleGetDataSportsBook(activeSportsBook))
    mainWindow.webContents.send('onSwitchBetMode', data.isBetByOtherAcc)
  })

  ipcMain.on('SaveSettingLanguage', async (_, data: { language: LanguageType }) => {
    const setting = Setting.findAll()[0] as SettingSchemaType
    Setting.update({ id: setting.id }, { language: data.language })
  })
  //******************************************************************************************************* */

  //************************************** BetSettingWindow *********************************************** */

  ipcMain.handle('GetRangePlatform', () => {
    const sportBooks = SportsBook.findAll() as SportsBookType[]
    const rangePlatforms = sportBooks.map(({ id, platform, valueRange }) => ({
      id,
      platform,
      valueRange
    }))

    const setting = Setting.findAll()[0] as SettingSchemaType

    const otherSetting = {
      id: setting.id,
      isOther: setting.isOther,
      isBetUnderSelected: setting.isBetUnderSelected,
      isBetOverSelected: setting.isBetOverSelected,
      isBetPutSelected: setting.isBetPutSelected,
      isBetEatSelected: setting.isBetEatSelected
    }

    return {
      rangePlatforms,
      otherSetting
    }
  })

  ipcMain.on('DataBetSetting', async (_event, payload: DataBetSettingPayload) => {
    const { rangePlatforms, otherSetting } = payload

    for (const { id, valueRange } of rangePlatforms) {
      SportsBook.update({ id }, { valueRange })
    }
    Setting.update(
      { id: otherSetting.id },
      {
        isOther: otherSetting.isOther,
        isBetUnderSelected: otherSetting.isBetUnderSelected,
        isBetOverSelected: otherSetting.isBetOverSelected,
        isBetPutSelected: otherSetting.isBetPutSelected,
        isBetEatSelected: otherSetting.isBetEatSelected
      }
    )

    await sendUserSettingsToServer()
  })

  //******************************************************************************************************* */

  //************************************** ProxyServerSettingGeneral *********************************************** */

  ipcMain.on('UpdateDataProxyServerSettingsGeneral', async (_, data) => {
    const setting = Setting.findAll()[0] as SettingSchemaType
    if (!setting) return

    Setting.update(
      { id: setting.id },
      {
        ipAddress: data.ipAddress,
        port: data.port || '0',
        username: data.username,
        password: data.password
      }
    )

    await sendUserSettingsToServer()
  })

  //***************************************************************************************************** */

  //************************************** ListPlatformBookWindow *********************************************** */

  ipcMain.handle('GetListPlatform', () => {
    return Platform.findAll()
  })

  ipcMain.handle('AddPlatForm', (_, data) => {
    const { isTrialAccount, activeSportsBook, platform } = data

    const isPlatform = SportsBook.findOne({ platform: platform.name }) as SportsBookType
    if (isPlatform) {
      return 1
    }

    SettingPerMatchLimit.create({
      id: uuidv4(),
      namePlatform: platform.name,
      ...DEFAULT_TEAM_NAME_LIMIT
    })

    SportsBook.create({
      id: uuidv4(),
      name: activeSportsBook,
      platform: platform.name,
      url: platform.url,
      suggestedClient: String(getSuggestedClient()),
      ...DEFAULT_SPORTS_BOOK_CONFIG,
      betFixedAmountValue: isTrialAccount ? '50' : '10'
    })
    updateSportsBookPairStatus()
    const dataSportsBook = handleGetDataSportsBook(activeSportsBook)
    mainWindow.webContents.send('DataSportsBook', dataSportsBook)

    return 0
  })

  //************************************************************************************* */
  //************************************** AccountListWindow *********************************************** */

  ipcMain.handle('GetListAccountByPlatform', async (_, platform) => {
    try {
      const [sportBook, platformData] = await Promise.all([
        SportsBook.findOne({ platform }) as SportsBookType,
        Platform.findOne({ name: platform }) as PlatformType
      ])

      if (!sportBook || !platformData) {
        throw new Error('Invalid platform or data not found.')
      }

      const accounts = Account.findAll({ platformName: platform }) as AccountType[]
      const listAccount = accounts ?? []
      listAccount.sort((a, b) => a.orderID - b.orderID)

      return {
        listAccount,
        platform: platformData,
        switchSettings: {
          isSwitchBySuccessCount: sportBook.isSwitchBySuccessCount,
          isSwitchByCredit: sportBook.isSwitchByCredit,
          minSuccessCount: sportBook.minSuccessCount,
          maxSuccessCount: sportBook.maxSuccessCount,
          maxCredit: sportBook.maxCredit
        },
        randomDelayLoginSettings: {
          isRandomDelayLogin: sportBook.isRandomDelayLogin,
          minDelayLogin: sportBook.minDelayLogin,
          maxDelayLogin: sportBook.maxDelayLogin
        }
      }
    } catch (error) {
      console.error('GetListAccountByPlatform error:', error)
      return { error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.on(
    'SaveAccountListWindow',
    (_, { platform, listAccount, switchSettings, randomDelayLoginSettings }) => {
      if (!platform) return

      updateDataListAccount(
        platform,
        listAccount,
        mainWindow,
        activeSportsBook,
        switchSettings,
        randomDelayLoginSettings
      )
    }
  )

  //************************************************************************************* */

  //************************************** PlatformPairWindow *********************************************** */

  ipcMain.on('PlatformPairWindow', async (_, { dataPlatformPair }) => {
    await SaveSportBookCombination(dataPlatformPair, mainWindow, activeSportsBook)

    await sendUserSettingsToServer()
  })

  ipcMain.handle('GetSportBook1SportBook2', () => {
    return GetSportBook1SportBook2()
  })

  ipcMain.handle('GetListPlatformPair', () => {
    return GetListPlatformPair()
  })

  //************************************************************************************* */

  //************************************** mainWindow *********************************************** */
  ipcMain.on('UpdateSportsBookProviders', (_, { activeSportsBook }) => {
    clearTable('SportsBookProviders')
    SportsBookProviders.create({ id: uuidv4(), idSportsBook: activeSportsBook })
  })

  ipcMain.on('LoginAll', (_, { activeSportsBook }) => {
    handleLoginAll(mainWindow, activeSportsBook)
  })

  ipcMain.on('LogoutAll', (_, { activeSportsBook }) => {
    handleLogoutAll(mainWindow, activeSportsBook)
  })

  ipcMain.handle('GetScheduledLoginLogout', (_, { activeSportsBook }) => {
    const sportsBook = SportsBook.findAll({ name: activeSportsBook }) as SportsBookType[]
    const validPlatforms = sportsBook.map((sb) => sb.platform)

    const listScheduledLoginLogout = ScheduledLoginLogout.findAll() as ScheduledLoginLogoutType[]

    const result = listScheduledLoginLogout
      .filter((item) => validPlatforms.includes(item.platformName))
      .map((item) => ({
        ...item,
        loginSetting: JSON.parse(item.loginSetting),
        logoutSetting: JSON.parse(item.logoutSetting)
      })) as ScheduledLoginLogoutParseType[]

    return result || []
  })

  ipcMain.on('DataScheduledLoginLogout', async (_, data) => {
    const parsedData = data.map((item: ScheduledLoginLogoutParseType) => ({
      ...item,
      loginSetting: JSON.stringify(item.loginSetting),
      logoutSetting: JSON.stringify(item.logoutSetting)
    }))

    parsedData.forEach((item: ScheduledLoginLogoutType) => {
      ScheduledLoginLogout.update(
        { id: item.id },
        {
          ...item,
          loginSetting: item.loginSetting,
          logoutSetting: item.logoutSetting
        }
      )
    })
  })

  ipcMain.handle('LeaguePointRandomizer', () => {
    return LeaguePointRandomizer.findAll() as LeaguePointRandomizerType[]
  })

  ipcMain.on('SaveLeaguePointRandomizer', async (_, data) => {
    clearTable('LeaguePointRandomizer')
    LeaguePointRandomizer.insertMany(data)

    await sendUserSettingsToServer()
  })

  ipcMain.handle('GetUrl', (_, platform) => {
    return PlatformUrl.findAll({ platformName: platform })
  })

  ipcMain.handle('ActivePlatformShowOdds', (_, { platform }) => {
    clearTable('ActivePlatformShowOdds')
    ActivePlatformShowOdds.create({ id: uuidv4(), platformName: platform })

    const tableName = TABLE_NAME_BY_PLATFORM[platform]
    const rawData = createModel(tableName, dataCrawlByPlatformSchema).findAll() as DataCrawlType[]

    return processShowOdds(rawData, platform)
  })

  ipcMain.on('InActivePlatformShowOdds', () => {
    clearTable('ActivePlatformShowOdds')
  })

  ipcMain.handle('GetAccountShowOdds', (_, { platform }) => {
    const setting = Setting.findAll()[0] as SettingSchemaType
    const isBetByOtherAcc = setting.isBetByOtherAcc == 1
    const orderID = isBetByOtherAcc ? 2 : 1

    return Account.findAll({
      platformName: platform,
      status: STATUS_ACCOUNT.LOGOUT,
      statusDelete: 0,
      orderID
    })
  })

  ipcMain.handle('GetTicketShowOdd', async (_, data) => {
    return await handleGetTicketShowOdd(data)
  })

  ipcMain.handle('PlaceBetShowOdds', async (_, data) => {
    return await handlePlaceTicketShowOdd(data, mainWindow)
  })

  ipcMain.on('Update_LockURL', (_, { platformName, lockURL, sportsBookId }) => {
    SportsBook.update({ name: sportsBookId, platform: platformName }, { lockURL })

    const dataSportsBook = handleGetDataSportsBook(sportsBookId)
    mainWindow.webContents.send('DataSportsBook', dataSportsBook)
  })

  ipcMain.on('UpdateUrlPlatform', (_, { platformName, selectedUrl, sportsBookId }) => {
    SportsBook.update({ name: sportsBookId, platform: platformName }, { url: selectedUrl })
    const accounts = Account.updateMany(
      { platformName },
      { ...DEFAULT_ACCOUNT_STATUS, loginURL: selectedUrl }
    )

    if (accounts.length > 0) {
      for (const acc of accounts) {
        mainWindow.webContents.send('DataUpdateAccount', acc)
      }
    }

    const dataSportsBook = handleGetDataSportsBook(sportsBookId)
    mainWindow.webContents.send('DataSportsBook', dataSportsBook)
  })

  ipcMain.handle('GetListSportBook', () => {
    return SportsBook.findAll()
  })

  ipcMain.on('SelectSportsBook', (_, sportsBook) => {
    activeSportsBook = sportsBook
  })

  ipcMain.handle('GetDataSportsBook', (_, activeId) => {
    return handleGetDataSportsBook(activeId)
  })

  ipcMain.handle('GetDataSportBookByPlatform', (_, platform) => {
    return SportsBook.findOne({ platform }) as SportsBookType
  })

  ipcMain.on('SaveBetFixedAmountValue', (_, data: SaveBetFixedAmountValueType) => {
    SportsBook.update({ platform: data.platform }, { ...data.data })

    if (data.data.isMatchLimitAllAccount && data.update) {
      Account.updateRecordsByCondition(
        { platformName: data.platform },
        {
          limitMethod: data.data.limitMethod,
          limitType: data.data.limitType,
          totalAmount: data.data.totalAmount,
          totalCount: data.data.totalCount
        }
      )
      const listAccount = Account.findAll({ platformName: data.platform }) as AccountType[]
      if (listAccount.length > 0) {
        for (const acc of listAccount) {
          PerMatchLimit.deleteMany({ idAccount: acc.id })
        }
      }
    }

    const dataSportsBook = handleGetDataSportsBook(data.activeSportsBook)
    mainWindow.webContents.send('DataSportsBook', dataSportsBook)
  })

  ipcMain.on('UpdateDelaySec_Platform', (_, data) => {
    const { activeId, platform, dataUpdate } = data
    SportsBook.update({ name: activeId, platform }, { ...dataUpdate })
  })

  ipcMain.on('DeletePlatform', (_, data) => {
    const { activeId, namePlatform } = data
    handleDeletePlatForm(mainWindow, namePlatform, activeId)
  })

  ipcMain.handle('DataAccount', (_, accountId) => {
    return Account.findById(accountId)
  })

  ipcMain.handle('CheckUserNameAccount', (_, data) => {
    const { username, platform } = data
    const checkAccount = Account.findOne({ loginID: username, platformName: platform })
    return !!checkAccount
  })

  ipcMain.on('Data_AccountLoginForm', (_, data) => {
    const { activeId, account } = data
    updateDataAccount(activeId, account, mainWindow)
  })

  ipcMain.on('UpdateAccount', (_, data) => {
    const validFields = ['checkBoxBet', 'checkBoxRefresh', 'checkBoxAutoLogin', 'checkBoxLockURL']
    if (!validFields.includes(data.field)) return

    if (data.field === 'checkBoxRefresh') {
      if (data.value === 1) {
        const setting = Setting.findAll() as SettingSchemaType[]
        Account.update(
          { id: data.accountId },
          { typeCrawl: setting[0].gameType, [data.field]: data.value }
        )
      } else {
        Account.update({ id: data.accountId }, { [data.field]: data.value })
      }
    } else {
      Account.update({ id: data.accountId }, { [data.field]: data.value })
    }
  })

  ipcMain.handle('GetDelayLoginCountdown', () => getDelayLoginSnapshot())

  ipcMain.on('CancelDelayLogin', (_, { accountId }: { accountId: string }) => {
    abortDelayLogin(accountId)
  })

  ipcMain.on('LoginNowDelayLogin', (_, { accountId }: { accountId: string }) => {
    loginNowDelayLogin(accountId)
  })

  ipcMain.on('LoginAccount', (_, account) => {
    handleLoginAccount(account, mainWindow)
  })

  ipcMain.on('LogoutAccount', (_, account) => {
    handleLogoutAccount(account, mainWindow)
  })

  ipcMain.on('Ps3838SubmitOtp', (_, { accountId, otp }: { accountId: string; otp: string }) => {
    submitOtpToLoginWorker(accountId, otp)
  })

  ipcMain.on('Ps3838CancelOtp', (_, { accountId }: { accountId: string }) => {
    cancelOtpForLoginWorker(accountId)
  })

  ipcMain.on('Ps3838CancelRateLimit', (_, { accountId }: { accountId: string }) => {
    cancelRateLimitForLoginWorker(accountId)
  })

  ipcMain.handle('PerMatchLimitSetting', () => {
    const settings = Setting.findAll() as SettingSchemaType[]
    const perMatchLimitSetting = SettingPerMatchLimit.findAll() as SettingPerMatchLimitType[]
    return {
      enable: settings[0].enablePerMatchLimitSetting,
      data: perMatchLimitSetting
    }
  })

  ipcMain.handle('PerMatchLimitDetailPlatform', (_, platform) => {
    return PerMatchDetail.findAll({ platform })
  })

  ipcMain.handle('SettingViewTable', (_, { tab }) => {
    return SettingTableView.findOne({ tab }) as SettingTableViewType
  })

  ipcMain.on(
    'UpdateSettingViewTable',
    (
      _,
      {
        tab,
        data
      }: { tab: string; data: { contraStrategy: string; clear: number; scroll: number } }
    ) => {
      SettingTableView.update({ tab }, data)
      const otherTab = tab === 'BetList' ? 'ContraList' : tab === 'ContraList' ? 'BetList' : null
      if (otherTab)
        SettingTableView.update({ tab: otherTab }, { contraStrategy: data.contraStrategy })
    }
  )

  ipcMain.handle('GetBetListResult', () => {
    const data = BetListResult.findAll() as BetListDBType[]
    return data
      .sort((a, b) => b.id - a.id)
      .flatMap((item: BetListDBType) => JSON.parse(item.dataPair))
  })

  ipcMain.handle('GetWaitingList', () => {
    const data = WaitingList.findAll() as WaitingSuccessContraDBType[]
    return data.flatMap((item: WaitingSuccessContraDBType) => JSON.parse(item.dataPair))
  })

  ipcMain.handle('GetContraList', () => {
    const data = ContraList.findAll() as WaitingSuccessContraDBType[]
    return data
      .sort((a, b) => b.id - a.id)
      .flatMap((item: WaitingSuccessContraDBType) => JSON.parse(item.dataPair))
  })

  ipcMain.handle('GetSuccessList', () => {
    const data = SuccessList.findAll() as WaitingSuccessContraDBType[]
    return data
      .sort((a, b) => b.id - a.id)
      .flatMap((item: WaitingSuccessContraDBType) => JSON.parse(item.dataPair))
  })

  ipcMain.handle('GetSuccessListShowOdd', () => {
    const data = SuccessListShowOdd.findAll() as WaitingSuccessContraDBType[]
    return data
      .sort((a, b) => b.id - a.id)
      .flatMap((item: WaitingSuccessContraDBType) => JSON.parse(item.dataPair))
  })

  ipcMain.handle('GetFailedBetList', () => {
    const data = FailedBetList.findAll() as BetListDBType[]
    return data
      .sort((a, b) => b.id - a.id)
      .flatMap((item: BetListDBType) => JSON.parse(item.dataPair))
  })

  ipcMain.on('Data_ProxyServerSetting_Platform', (_, data) => {
    const { platformName, formData } = data

    Account.update(
      { platformName },
      {
        proxyIP: formData.ipAddress || null,
        proxyPort: formData.port,
        proxyUsername: formData.username || null,
        proxyPassword: formData.password || null
      }
    )
  })

  //************************************************************************************* */

  //************************************************************************************* */

  ipcMain.handle('GetDataSettingLeagueFilter', () => {
    return SettingLeagueFilter.findAll()[0]
  })

  ipcMain.handle('GetDataBlockLeague', () => {
    return BlockLeague.findAll()
  })

  ipcMain.handle('GetDataAllowLeague', () => {
    return AllowLeague.findAll()
  })

  ipcMain.handle('GetDataLeague', () => {
    const data = NameLeague.findAll() as NameLeagueType[]
    const result: { id: number; league: string }[] = Object.values(
      data
        .filter(
          (item) =>
            item.league &&
            item.league.trim() !== '' &&
            item.league !== null &&
            !item.league.includes('Corners')
        )
        .reduce<Record<string, { id: number; league: string }>>((acc, item) => {
          acc[item.league] = { id: item.id, league: item.league.trim() }
          return acc
        }, {})
    ).sort((a, b) => a.league.localeCompare(b.league))

    return result
  })

  let filterTypeRoot = SettingLeagueFilter.findAll()[0].filterType as string
  ipcMain.on(
    'DataLeagueFilter',
    async (
      _,
      {
        filterType,
        blockMajorLeague,
        allowMajorLeague,
        listAllowLeagueTable,
        listBlockLeagueTable
      }: {
        filterType: string
        blockMajorLeague: number
        allowMajorLeague: number
        listAllowLeagueTable: { id: number | string; league: string }[]
        listBlockLeagueTable: { id: number | string; league: string }[]
      }
    ) => {
      SettingLeagueFilter.update({}, { filterType, blockMajorLeague, allowMajorLeague })
      const newBlockLeagues = listBlockLeagueTable.map(({ league }) => ({ id: uuidv4(), league }))
      const newAllowLeagues = listAllowLeagueTable.map(({ league }) => ({ id: uuidv4(), league }))

      await Promise.all([clearTable('BlockLeague'), clearTable('AllowLeague')])
      await Promise.all([
        BlockLeague.insertMany(newBlockLeagues),
        AllowLeague.insertMany(newAllowLeagues)
      ])
      if (filterTypeRoot !== filterType) {
        filterTypeRoot = filterType
        clearTable('DataBet')
      }

      await sendUserSettingsToServer()
    }
  )

  //************************************************************************************* */

  ipcMain.handle('ChangePassword', async (_, { currentPassword, newPassword }) => {
    try {
      const newAccessToken = await refreshAccessToken(mainWindow)

      const response = await fetch(`${import.meta.env.VITE_URL}/user/users/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newAccessToken}`
        },
        body: JSON.stringify({
          oldPassword: currentPassword,
          newPassword
        })
      })

      const data = (await response.json()) as { message?: string; statusCode?: number }

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to change password')
      }

      await systemLogToFile('User password changed successfully', 'Program')
      return { success: true, message: 'Password changed successfully' }
    } catch (error) {
      await systemLogToFile(
        `ChangePassword error: ${error instanceof Error ? error.message : String(error)}`,
        'Error'
      )

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to change password'
      }
    }
  })

  //************************************** ConfirmLogoutWindow *********************************************** */

  ipcMain.on('CloseAppByToken', async () => {
    mainWindow.hide()
    const date = new Date()
      .toISOString()
      .replace(/[-T:Z]/g, '')
      .slice(0, 14)

    const betList = BetListResult.findAll() as BetListDBType[]
    if (betList.length > 0) {
      const flattenedDataBetList = betList.flatMap((item) => JSON.parse(item.dataPair))
      handleListReportFile(flattenedDataBetList, 'BetListReport', date)
    }

    const successList = SuccessList.findAll() as WaitingSuccessContraDBType[]
    if (successList.length > 0) {
      const flattenedDataSuccessList = successList.flatMap((item) => JSON.parse(item.dataPair))
      handleListReportFile(flattenedDataSuccessList, 'SuccessListReport', date)
    }

    await sendUserSettingsToServer()

    app.quit()
  })

  ipcMain.on('setExpiredDate', async (_event, expiredDate) => {
    mainWindow.setTitle(
      `${import.meta.env.VITE_APP_DISPLAY_NAME} [Internal] v${app.getVersion()}         User: ${account.username}/ Expiry Date: ${expiredDate}`
    )
  })

  ipcMain.on('QuitApp', async () => {
    const date = new Date()
      .toISOString()
      .replace(/[-T:Z]/g, '')
      .slice(0, 14)

    const betList = BetListResult.findAll() as BetListDBType[]
    if (betList.length > 0) {
      const flattenedDataBetList = betList.flatMap((item) => JSON.parse(item.dataPair))
      handleListReportFile(flattenedDataBetList, 'BetListReport', date)
    }

    const successList = SuccessList.findAll() as WaitingSuccessContraDBType[]
    if (successList.length > 0) {
      const flattenedDataSuccessList = successList.flatMap((item) => JSON.parse(item.dataPair))
      handleListReportFile(flattenedDataSuccessList, 'SuccessListReport', date)
    }

    await sendUserSettingsToServer()

    app.quit()
  })

  return mainWindow
}
