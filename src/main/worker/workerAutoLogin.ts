import { parentPort } from 'worker_threads'

import { Account } from '@db/model'

import { AccountType } from '@shared/common/types'
import { STATUS_ACCOUNT } from '@shared/main/constants'

const port = parentPort
if (!port) throw new Error('IllegalState')

//180 = 3 phut x 60

const numberDelay = 180

setInterval(() => {
  const listAccount = Account.findAll({
    status: STATUS_ACCOUNT.EXIT,
    checkBoxAutoLogin: 1,
    statusDelete: 0
  }) as AccountType[]

  if (listAccount.length) {
    port.postMessage(listAccount)
  }
}, numberDelay * 1000)
