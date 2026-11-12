import { CONVERT_HDP } from '@shared/common/constants'

export function convertHdpPoint(hdpPoint: number): string {
  const positive = Math.abs(hdpPoint)
  const mapped = CONVERT_HDP[positive.toString() as keyof typeof CONVERT_HDP]
  if (mapped) return mapped

  const base = Math.floor(positive)
  const fraction = +(positive - base).toFixed(2)

  if (fraction === 0.25) return `${base}-${base + 0.5}`
  if (fraction === 0.75) return `${base + 0.5}-${base + 1}`

  return positive.toString()
}
