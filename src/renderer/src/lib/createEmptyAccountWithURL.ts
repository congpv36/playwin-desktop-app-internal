import { v4 as uuidv4 } from 'uuid'

import { PlatformType } from '@shared/common/types'
import { EMPTY_ACCOUNT } from '@shared/renderer/constants'

export const createEmptyAccountWithURL = (platform?: PlatformType) => {
  return {
    ...EMPTY_ACCOUNT,
    id: uuidv4(),
    loginURL: platform?.url || '',
    platformName: platform?.name || ''
  }
}
