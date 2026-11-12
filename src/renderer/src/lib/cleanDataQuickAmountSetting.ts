export const cleanDataQuickAmountSetting = (arrData) => {
  return arrData.map(({ check, ...rest }) => {
    const sanitizeBetAmount = (value) => {
      if (value.length >= 2 && value.startsWith('0') && !value.startsWith('0.')) {
        value = value.replace(/^0+/, '')
        if (value === '') value = '0'
      }

      if (value === '0.') {
        value = '0'
      }

      const num = parseInt(value, 10)

      if (isNaN(num) || num < 0) {
        value = '100'
      } else if (num > 9999999) {
        value = '9999999'
      } else {
        value = num.toString()
      }

      return value
    }

    const account1 = { ...rest.account1 }
    const account2 = { ...rest.account2 }

    account1.betAmount = sanitizeBetAmount(account1.betAmount)
    account2.betAmount = sanitizeBetAmount(account2.betAmount)

    return {
      ...rest,
      account1,
      account2
    }
  })
}
