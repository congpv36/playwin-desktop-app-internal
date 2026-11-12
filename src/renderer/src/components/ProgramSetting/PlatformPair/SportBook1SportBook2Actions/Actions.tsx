import React from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@renderer/components/ui/button'

const Actions = ({
  addPlatformPair,
  removePlatformPair,
  addAllPlatformPair,
  removeAllPlatformPair
}) => {
  const { t } = useTranslation(['main', 'layout'])
  return (
    <div className="flex gap-2 mb-4 items-center justify-between rounded-lg">
      <div className="flex gap-2">
        <Button onClick={addPlatformPair}>{t('add_combination')} </Button>

        <Button
          onClick={addAllPlatformPair}
          variant="bordered-white"
          className="whitespace-nowrap border-[1px] border-border-default hover:border-gray-600 bg-white "
        >
          {t('add_all_combinations_btn')}
        </Button>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={removeAllPlatformPair}
          variant="bordered-white"
          className="text-red-500 border-red-300 whitespace-nowrap hover:border-red-color hover:text-red-color bg-white"
        >
          {t('remove_all_combinations')}
        </Button>
        <Button
          onClick={removePlatformPair}
          className="whitespace-nowrap bg-red-500 hover:bg-red-color"
        >
          {t('remove_combination')}
        </Button>
      </div>
    </div>
  )
}

export default React.memo(Actions)
