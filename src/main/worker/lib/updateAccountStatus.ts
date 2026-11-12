import { MessagePort } from 'worker_threads'

import { Account } from '@db/model'

import { AccountType } from '@shared/common/types'

import { accountLogToFile } from '@/worker/lib/accountLogToFile'

type UpdateAccountStatusOptions = {
  statusLogin?: string
  status?: string
}

/**
 * Cập nhật textLog (và statusLogin/status nếu có) lên DB, báo cho renderer,
 * đồng thời ghi log ra file. Dùng chung cho mọi platform để log login-flow
 * luôn đồng bộ cả ở UI lẫn file log.
 */
export async function updateAccountStatus(
  port: MessagePort,
  account: AccountType,
  textLog: string,
  options?: UpdateAccountStatusOptions
) {
  port.postMessage({
    type: 'DataUpdateAccount',
    data: Account.update(
      { id: account.id },
      {
        textLog,
        ...(options?.statusLogin && { statusLogin: options.statusLogin }),
        ...(options?.status && { status: options.status })
      }
    )
  })

  await accountLogToFile(
    account.platformName,
    account.loginID,
    `Login Status: ${textLog}`,
    'Program'
  )
}
