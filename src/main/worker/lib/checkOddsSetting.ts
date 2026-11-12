import { Setting } from '@db/model'
import { SettingSchemaType } from '@db/schema/setting'

import { isTooHighToBet, isTooLowToBet } from '@/worker/lib/isInAbsoluteRange'

export function checkOddsSetting(odd1: number, odd2: number, profit: number) {
  const [setting] = Setting.findAll() as SettingSchemaType[]

  const defaultResponse = {
    ErrorCode: 0,
    Data: {
      infoOdd1: 'New Match',
      infoOdd2: 'New Match'
    }
  }

  if (
    !setting?.oddsLessThan &&
    !setting?.oddsMoreThan &&
    !setting?.gameCommissionMoreThan &&
    !setting?.gameCommissionLessThan
  )
    return defaultResponse

  //1.Check Don't Bet when odds <
  if (setting?.oddsLessThan) {
    const { oddsLessThanValue } = setting
    const checkOdd1 = isTooLowToBet(oddsLessThanValue, odd1)
    const checkOdd2 = isTooLowToBet(oddsLessThanValue, odd2)

    if (checkOdd1 || checkOdd2) {
      return {
        ErrorCode: 1,
        Data: {
          infoOdd1: checkOdd1
            ? `Ticket Failed: Odds [${odd1}] < Limit Setting General [${oddsLessThanValue}]`
            : 'Get Ticket Failed: Stop Ticketing',
          infoOdd2: checkOdd2
            ? `Ticket Failed: Odds [${odd2}] < Limit Setting General [${oddsLessThanValue}]`
            : 'Get Ticket Failed: Stop Ticketing'
        }
      }
    }
  }

  //2.Check Don't Bet when odds >
  if (setting?.oddsMoreThan) {
    const { oddsMoreThanValue } = setting
    const checkOdd1 = isTooHighToBet(oddsMoreThanValue, odd1)
    const checkOdd2 = isTooHighToBet(oddsMoreThanValue, odd2)
    if (checkOdd1 || checkOdd2) {
      return {
        ErrorCode: 1,
        Data: {
          infoOdd1: checkOdd1
            ? `Ticket Failed: Odds [${odd1}] > Limit Setting General [${oddsMoreThanValue}]`
            : 'Ticket Failed: Stop Ticketing',
          infoOdd2: checkOdd2
            ? `Ticket Failed: Odds [${odd2}] > Limit Setting General [${oddsMoreThanValue}]`
            : 'Ticket Failed: Stop Ticketing'
        }
      }
    }
  }

  //3.Check Don't Bet when Game Commission >
  if (setting?.gameCommissionMoreThan) {
    const { gameCommissionMoreThanValue } = setting
    const checkGameCommission = isTooHighToBet(gameCommissionMoreThanValue, profit)

    if (checkGameCommission) {
      return {
        ErrorCode: 1,
        Data: {
          infoOdd1: `Ticket Failed: Commission [${profit}] > Limit [${gameCommissionMoreThanValue}]`,
          infoOdd2: `Ticket Failed: Commission [${profit}] > Limit [${gameCommissionMoreThanValue}]`
        }
      }
    }
  }

  //4.Check Don't Bet when Game Commission <
  if (setting?.gameCommissionLessThan) {
    const { gameCommissionLessThanValue } = setting
    const checkGameCommission = isTooLowToBet(gameCommissionLessThanValue, profit)

    if (checkGameCommission) {
      return {
        ErrorCode: 1,
        Data: {
          infoOdd1: `Ticket Failed: Commission [${profit}] < Limit [${gameCommissionLessThanValue}]`,
          infoOdd2: `Ticket Failed: Commission [${profit}] < Limit [${gameCommissionLessThanValue}]`
        }
      }
    }
  }

  return defaultResponse
}
