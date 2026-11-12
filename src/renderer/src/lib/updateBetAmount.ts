export function updateBetAmount(dataUpdate: { platform: string; betAmount: string }[]) {
  return dataUpdate.map((item) => {
    const parsed = parseInt(item.betAmount, 10)

    if (isNaN(parsed) || parsed < 0) {
      return { ...item, betAmount: '100' }
    }

    if (parsed > 9999999) {
      return { ...item, betAmount: '9999999' }
    }

    return { ...item, betAmount: parsed.toString() }
  })
}
