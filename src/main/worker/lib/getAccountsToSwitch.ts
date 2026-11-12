import { SwitchAccountType } from '@shared/common/types'

import { checkAccountStatus } from '@/worker/lib/checkAccountStatus'

export function getAccountsToSwitch(
  ...statuses: ReturnType<typeof checkAccountStatus>[]
): SwitchAccountType[] {
  return statuses
    .filter((status) => !status.statusPass && status.account)
    .map((status) => ({
      ...(status.account as SwitchAccountType),
      delayLoginSec: 'delayLoginSec' in status ? (status.delayLoginSec ?? 0) : 0
    }))
}
