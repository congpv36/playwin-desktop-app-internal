export function getRandomValue(betAmount_Standard: number, randomBetAmountValue: number) {
  return Math.round((betAmount_Standard * randomBetAmountValue) / 100)
}
