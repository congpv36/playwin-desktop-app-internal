import { SportBookCombination } from '@db/model'
import { SportBookCombinationDBType } from '@db/schema/sportBookCombination'

import { PlatformPairType } from '@shared/common/types'

export function GetListPlatformPair(): PlatformPairType[] {
  const listSortBookCombination = SportBookCombination.findAll() as SportBookCombinationDBType[]
  if (!listSortBookCombination.length) {
    return []
  }

  const listPlatformPair = listSortBookCombination.map((item) => {
    return {
      id: item.id,
      isValid: item.isValid,
      key: item.key,
      sportBook1: item.sportBook1 ? JSON.parse(String(item.sportBook1)) : {},
      sportBook2: item.sportBook2 ? JSON.parse(String(item.sportBook2)) : {}
    }
  }) as PlatformPairType[]

  return listPlatformPair
}
