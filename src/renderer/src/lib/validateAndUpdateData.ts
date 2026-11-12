export const validateAndUpdateData = (data) => {
  const validate = (value: string, min: number, max: number, defaultValue: number): string => {
    const num = Number(value)
    return isNaN(num) || num < min ? String(defaultValue) : num > max ? String(max) : String(num)
  }

  return {
    ...data,
    totalCount: validate(data.totalCount, 1, 9999, 2),
    totalAmount: validate(data.totalAmount, 1, 9999, 5000)
  }
}
