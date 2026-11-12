export const cleanDataQuickBetTargetSetting = (arr, dataUpdate, targetA, targetB) => {
  return arr.map((item) => {
    const updatedItem = {
      ...item,
      account1:
        item.check && targetA
          ? {
              ...item.account1,
              ...dataUpdate.account1
            }
          : item.account1,
      account2:
        item.check && targetB
          ? {
              ...item.account2,
              ...dataUpdate.account2
            }
          : item.account2
    }

    const { check, ...rest } = updatedItem
    return rest
  })
}
