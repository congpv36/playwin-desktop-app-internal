import { v4 as uuidv4 } from 'uuid'

import { generatePlatformData } from '@renderer/lib/generatePlatformData'

import { PlatformType } from '@shared/common/types'

export function generateAddAllPlatformPair(listPlatform: PlatformType[]) {
  return listPlatform.flatMap((sportBook1, index) =>
    listPlatform.slice(index).map((sportBook2) => {
      const sportBook1Data = generatePlatformData(sportBook1)
      const sportBook2Data = generatePlatformData(sportBook2)
      const isValid = sportBook1Data.name === sportBook2Data.name ? 0 : 1
      const key = `${sportBook1Data.name}_${sportBook2Data.name}`

      return {
        id: uuidv4() as string,
        isValid,
        key,
        sportBook1: sportBook1Data,
        sportBook2: sportBook2Data
      }
    })
  )
}
