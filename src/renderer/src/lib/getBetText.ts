export function getBetText(betToType) {
  if (!betToType) return ''

  if (betToType.betAll === 1) {
    return 'Bet All'
  }

  const keys = Object.keys(betToType)
    .filter((key) => key.startsWith('hdp_') && betToType[key] === 1)
    .slice(0, 7)
    .map((key) => key.replace('hdp_', '').replace('_', '.'))

  const text = keys.join(',')
  return text.length > 8 ? text.slice(0, 8) : text
}
