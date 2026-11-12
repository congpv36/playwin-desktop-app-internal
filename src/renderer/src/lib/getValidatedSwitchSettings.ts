export const getValidatedSwitchSettings = (settings: {
  isSwitchBySuccessCount: number
  isSwitchByCredit: number
  minSuccessCount: string
  maxSuccessCount: string
  maxCredit: string
}) => {
  const minSuccessCount = settings.minSuccessCount?.trim() || '5'
  const maxSuccessCount = settings.maxSuccessCount?.trim() || '10'
  const maxCredit = settings.maxCredit?.trim() || '50'
  return {
    ...settings,
    minSuccessCount,
    maxSuccessCount,
    maxCredit
  }
}

export const getValidatedRandomDelayLoginSettings = (settings: {
  isRandomDelayLogin: number
  minDelayLogin: string
  maxDelayLogin: string
}) => {
  const min = Math.max(0, Number(settings.minDelayLogin?.trim() || '1') || 0)
  const max = Math.max(min, Number(settings.maxDelayLogin?.trim() || '10') || 0)
  return {
    isRandomDelayLogin: Number(settings.isRandomDelayLogin) ? 1 : 0,
    minDelayLogin: String(min),
    maxDelayLogin: String(max)
  }
}
