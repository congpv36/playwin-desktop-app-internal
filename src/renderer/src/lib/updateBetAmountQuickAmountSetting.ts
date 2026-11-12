export function updateListCombination(
  dataRoot,
  dataUpdate: { platform: string; betAmount: string }[]
) {
  const platformMap = new Map(dataUpdate.map((item) => [item.platform, item.betAmount]))

  return dataRoot.map((item) => {
    if (!item.check) return item

    const account1Platform = item.account1.platform
    const account2Platform = item.account2.platform

    return {
      ...item,
      account1: {
        ...item.account1,
        betAmount: platformMap.get(account1Platform) || item.account1.betAmount
      },
      account2: {
        ...item.account2,
        betAmount: platformMap.get(account2Platform) || item.account2.betAmount
      }
    }
  })
}
