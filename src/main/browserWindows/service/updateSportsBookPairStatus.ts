import { SportBookCombination, SportsBook } from '@db/model'
import { SportBookCombinationDBType } from '@db/schema/sportBookCombination'

import { SportsBookType } from '@shared/common/types'

export function updateSportsBookPairStatus() {
  const listSportBookCombination = SportBookCombination.findAll() as SportBookCombinationDBType[]

  const validItems = listSportBookCombination.filter((item) => item.isValid === 1)
  const uniqueKeys = [...new Set(validItems.flatMap((item) => item.key.split('_')))]
  const listSportsBook = SportsBook.findAll() as SportsBookType[]

  for (const sportsBook of listSportsBook) {
    const isPaired = uniqueKeys.includes(sportsBook.platform) ? 1 : 0
    SportsBook.update({ id: sportsBook.id }, { isPaired })
  }
}
