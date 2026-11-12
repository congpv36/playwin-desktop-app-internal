import { Platform } from '@db/model'

import { PlatformType } from '@shared/common/types'

export function GetSportBook1SportBook2() {
  const listPlatform = Platform.findAll() as PlatformType[]

  listPlatform.sort((platform1, platform2) => {
    return platform1.name.localeCompare(platform2.name)
  })

  return listPlatform
}
