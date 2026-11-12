export const findDuplicateLoginIDs = (array: { id: number; loginID: string }[]) => {
  const loginIDCounts: Record<string, number> = {}
  array.forEach((item) => {
    if (item.loginID) {
      loginIDCounts[item.loginID] = (loginIDCounts[item.loginID] || 0) + 1
    }
  })

  return Object.keys(loginIDCounts).filter((loginID) => loginIDCounts[loginID] > 1)
}
