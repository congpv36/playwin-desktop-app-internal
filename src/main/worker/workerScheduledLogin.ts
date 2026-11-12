import { parentPort } from 'worker_threads'

import { ScheduledLoginLogoutType } from '@db/schema/scheduledLoginLogout'
import { SettingSchemaType } from '@db/schema/setting'

import { AccountType, ScheduledLoginLogoutParseType } from '@shared/common/types'
import { STATUS_ACCOUNT } from '@shared/main/constants'

import { Account, ScheduledLoginLogout, Setting } from './../../db/model/index'

import { GetCurrentDateTime, getCurrentDateTime } from '@/worker/lib/getCurrentDateTime'
import { parseSetting } from '@/worker/lib/parseSettingScheduledLoginLogout'

const port = parentPort
if (!port) throw new Error('IllegalState')

let lastMinute: string | null = null

function getMatchedSchedules(
  schedules: ScheduledLoginLogoutParseType[],
  dateTime: GetCurrentDateTime
) {
  return schedules.filter((item) => {
    if (item.loginSetting.enabled !== 1) return false

    return item.loginSetting.schedules.some(
      (s) => s.day === dateTime.dayOfWeek && s.time === dateTime.currentTime
    )
  })
}

function getValidAccounts(platformName: string): AccountType[] {
  const setting = Setting.findAll()[0] as SettingSchemaType
  const isBetByOtherAcc = setting.isBetByOtherAcc

  const allowedOrderIds = isBetByOtherAcc === 1 ? [1, 2] : [1]

  const accounts = Account.findAll({
    status: STATUS_ACCOUNT.LOGIN,
    platformName,
    statusDelete: 0
  }) as AccountType[]

  return accounts.filter(
    (acc) => acc.loginID && acc.password && allowedOrderIds.includes(acc.orderID)
  )
}

function startScheduler() {
  setInterval(() => {
    const now = new Date()

    if (now.getSeconds() !== 0) return

    const dateTime = getCurrentDateTime() as GetCurrentDateTime

    if (lastMinute === dateTime.currentTime) return
    lastMinute = dateTime.currentTime

    const schedules = ScheduledLoginLogout.findAll({
      checked: 1
    }) as ScheduledLoginLogoutType[]

    if (!schedules.length) return

    const parsedSchedules = parseSetting(schedules)

    const matchedSchedules = getMatchedSchedules(parsedSchedules, dateTime)

    if (!matchedSchedules.length) return

    for (const schedule of matchedSchedules) {
      const accounts = getValidAccounts(schedule.platformName)

      if (accounts.length && port) {
        port.postMessage(accounts)
      }
    }
  }, 1000)
}

startScheduler()
