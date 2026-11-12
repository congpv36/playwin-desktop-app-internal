export const cleanDataQuickAmountRounderSetting = (arr, dataUpdate) => {
  return arr.map((item) => {
    const updatedItem = {
      ...item,
      account1: item.check
        ? {
            ...item.account1,
            amountRounderSetting: { ...dataUpdate.account1.amountRounderSetting }
          }
        : item.account1,
      account2: item.check
        ? {
            ...item.account2,
            amountRounderSetting: { ...dataUpdate.account2.amountRounderSetting }
          }
        : item.account2
    }

    const { check, ...rest } = updatedItem
    return rest
  })
}
