export const validateOddsTableAccount = (arrCheck) => {
  return arrCheck.map((item) => {
    function validateOdd(odd, defaultValue) {
      if (odd === '-0' || odd === '0.') {
        return '0'
      }

      const parsedOdd = parseFloat(odd).toString()
      if (parsedOdd === '0.0' || parsedOdd === '0.00' || parsedOdd === '0.000') {
        return '0'
      }

      if (
        isNaN(Number(parsedOdd)) ||
        Number(parsedOdd) < -1 ||
        Number(parsedOdd) > 1 ||
        parsedOdd.split('.').length > 2 ||
        parsedOdd.split('.')[1]?.length > 2
      ) {
        return defaultValue
      }

      return parsedOdd
    }

    return {
      id: item.id,
      account1: {
        ...item.account1,
        oddFrom: validateOdd(item.account1.oddFrom, '0.01'),
        oddTo: validateOdd(item.account1.oddTo, '-0.01')
      },
      account2: {
        ...item.account2,
        oddFrom: validateOdd(item.account2.oddFrom, '0.01'),
        oddTo: validateOdd(item.account2.oddTo, '-0.01')
      }
    }
  })
}
