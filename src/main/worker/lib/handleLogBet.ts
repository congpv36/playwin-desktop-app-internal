import { accountLogToFile } from '@/worker/lib/accountLogToFile'

export async function handleBetError(platformName: string, loginID: string, errorMessage?: string) {
  const message = `Error: ${errorMessage ?? 'Unknown Error'}`
  await accountLogToFile(
    platformName,
    loginID,
    `Status BET_PLACEMENT: FAIL (${message})`,
    'BetList'
  )
  return { ErrorCode: 1, Info: message, receiptID: '' }
}

export async function handleBetSuccess(
  platformName: string,
  loginID: string,
  wagerId: number | string
) {
  await accountLogToFile(platformName, loginID, `Status BET_PLACEMENT: SUCCESS`, 'BetList')
  return { ErrorCode: 0, Info: 'Bet Success', receiptID: String(wagerId) }
}
