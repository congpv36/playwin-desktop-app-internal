export const updateTableAccount = (a, b) => {
  return a.map((item) => {
    if (item.id === b.id) {
      return {
        ...item,
        account1: {
          ...item.account1,
          ...(b.account1 || {})
        },
        account2: {
          ...item.account2,
          ...(b.account2 || {})
        }
      }
    }
    return item
  })
}
