import { MessagePort } from 'worker_threads'

import { AccountType } from '@shared/common/types'

import { logAndNotify, logAndTriggerRelogin } from '@/worker/lib/exitAccountWithLog'
import { logTime } from '@/worker/lib/logTime'
import { getBalanceFishBet88 } from '@/worker/platform/FishBet88/actions/getBalance'

type IsActiveFn = (accountId: string) => boolean

// Relogin means asking the user for a captcha again, so transient network errors are
// tolerated a few times before giving up on the session.
const MAX_CONSECUTIVE_NETWORK_ERRORS = 3
const networkErrorCount = new Map<string, number>()

/**
 * Polls GetBalance with the saved AccessToken (the website does the same every 10s),
 * which refreshes the balance and keeps the session alive. Triggers relogin only when the
 * server says the token is no longer valid, or the network keeps failing.
 * Returns false when the session can't be used (balance failed or relogin triggered).
 */
export const keepAliveFishBet88 = async (
  port: MessagePort,
  account: AccountType,
  isActiveFn: IsActiveFn
): Promise<boolean> => {
  const { ErrorCode, Message, credit } = await getBalanceFishBet88(account)

  if (ErrorCode === 0) {
    networkErrorCount.delete(account.id)
    return logAndNotify(port, account, `${logTime()} Ready to bet`, {
      fields: { credit },
      isActiveFn
    })
  }

  if (ErrorCode === -1) {
    const count = (networkErrorCount.get(account.id) ?? 0) + 1
    networkErrorCount.set(account.id, count)
    if (count < MAX_CONSECUTIVE_NETWORK_ERRORS) return false
  }

  networkErrorCount.delete(account.id)
  await logAndTriggerRelogin(port, account, `Get balance failed: ${Message}`, { isActiveFn })
  return false
}
