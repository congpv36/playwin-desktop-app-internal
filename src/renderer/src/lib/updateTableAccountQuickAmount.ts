export function updateTableAccountQuickAmount(dataRoot, update) {
  return dataRoot.map((item) => {
    if (item.id === update.id) {
      return {
        ...item,
        ...update,
        account1: {
          ...item.account1,
          ...(update.account1 || {})
        },
        account2: {
          ...item.account2,
          ...(update.account2 || {})
        }
      }
    }
    return item
  })
}
