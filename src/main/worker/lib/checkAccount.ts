import { Account } from '@db/model'

import { STATUS_ACCOUNT, STATUS_LOGIN } from '@shared/main/constants'

export const isAccountActive = (accountId: string) => {
  const account = Account.findOne({
    id: accountId,
    status: STATUS_ACCOUNT.LOGOUT,
    statusLogin: STATUS_LOGIN.SUCCESS,
    orderID: 1
  })
  return !!account
}

export const isAccountActive_AccountOrder2 = (accountId: string) => {
  const account = Account.findOne({
    id: accountId,
    status: STATUS_ACCOUNT.LOGOUT,
    statusLogin: STATUS_LOGIN.SUCCESS,
    orderID: 2
  })
  return !!account
}
