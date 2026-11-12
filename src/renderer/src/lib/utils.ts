import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const validateBettingFields = (formValue, untilValue, min = 0, max = 45, disable) => {
  let form = Number(formValue)
  let until = Number(untilValue)

  if (!formValue) {
    form = min
  }

  if (!untilValue) {
    until = max
  }

  if (!disable) {
    return [min, max]
  }

  if (isNaN(form) || form < min || form > max) {
    form = min
  }

  if (isNaN(until) || until < min || until > max) {
    until = max
  }

  if (form >= until) {
    form = min
  }
  return [form, until]
}
