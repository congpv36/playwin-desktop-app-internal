export function isTooLowToBet(value: string, odd: number): boolean {
  const absThreshold = Math.abs(parseFloat(value))

  return odd > -absThreshold && odd < absThreshold
}

export function isTooHighToBet(value: string, odd: number): boolean {
  const absThreshold = Math.abs(parseFloat(value))

  return odd > -absThreshold && odd < 0
}
