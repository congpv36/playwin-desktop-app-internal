export const handleUpdateQuickAmount = (array) => {
  return array.map((item) => {
    const newItem = {}

    for (const key in item) {
      if (key.includes('_BetAmount')) {
        let value = +item[key]

        if (typeof value !== 'number' || isNaN(value)) {
          value = 0
        } else if (value >= 9999999) {
          value = 9999999
        }

        newItem[key] = value + ''
      } else {
        newItem[key] = item[key]
      }
    }

    return newItem
  })
}
