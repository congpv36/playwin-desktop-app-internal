import { Account } from '@db/model'

import { AccountType } from '@shared/common/types'
import { STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

export const findActiveAccount = (id: string) =>
  Account.findOne({
    id,
    orderID: 1,
    status: STATUS_ACCOUNT.LOGOUT,
    statusLogin: STATUS_LOGIN.SUCCESS
  }) as AccountType
