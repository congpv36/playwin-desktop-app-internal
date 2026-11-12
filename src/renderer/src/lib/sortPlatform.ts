import { AccountType } from '@shared/common/types'

export const sortPlatform = (account1: AccountType, account2: AccountType) => {
  const platform1 = account1.platformName
  const platform2 = account2.platformName

  const sortedPlatforms = [platform1, platform2].sort()

  return `${sortedPlatforms[0]}_${sortedPlatforms[1]}`
}
