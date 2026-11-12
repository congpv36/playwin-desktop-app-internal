/* eslint-disable no-constant-condition */
import { setTimeout } from 'timers/promises'
import { parentPort } from 'worker_threads'

import { Account, Setting } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'

import { AccountType } from '@shared/common/types'
import { STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

import { isAccountActive_AccountOrder2 } from '@/worker/lib/checkAccount'
import { systemLogToFile } from '@/worker/lib/systemLogToFile'
import { keepAliveFishBet88 } from '@/worker/platform/FishBet88/actions/keepAlive'
import { PLATFORM } from '@/worker/platform/platform.config'

const port = parentPort
if (!port) throw new Error('IllegalState')

const KEEP_ALIVE_INTERVAL_MS = 10_000

port.on('message', async (action: string) => {
  if (action == 'Start') {
    try {
      await handleCrawlData()
    } catch (error) {
      await systemLogToFile(
        `Error Handle Crawl Data Account Order2 FishBet88: ${JSON.stringify(error)}`,
        'Error'
      )
    }
  }
})

const handleCrawlData = async () => {
  while (true) {
    const setting = Setting.findAll()[0] as SettingSchemaType
    if (setting.isBetByOtherAcc == 0) process.exit(0)

    const account = Account.findOne({
      platformName: PLATFORM.FISHBET88,
      status: STATUS_ACCOUNT.LOGOUT,
      statusLogin: STATUS_LOGIN.SUCCESS,
      orderID: 2
    }) as AccountType

    if (!account) {
      await setTimeout(2000)
      continue
    }

    await keepAliveFishBet88(port, account, isAccountActive_AccountOrder2)
    await setTimeout(KEEP_ALIVE_INTERVAL_MS)
  }
}
