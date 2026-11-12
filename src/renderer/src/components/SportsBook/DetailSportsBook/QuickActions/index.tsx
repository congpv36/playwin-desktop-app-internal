import { useTranslation } from 'react-i18next'

import AccountList from '@renderer/components/SportsBook/DetailSportsBook/QuickActions/AccountList'
import BetSetting from '@renderer/components/SportsBook/DetailSportsBook/QuickActions/BetSetting'
import ProxySetting from '@renderer/components/SportsBook/DetailSportsBook/QuickActions/ProxySetting'
import ChevronDown from '@renderer/icons/chevron-down'

import { DataPlatformType } from '@shared/common/types'

import ShowOdd from './ShowOdd'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

function QuickActionsPlatform({ sportsBook }: { sportsBook: DataPlatformType }) {
  const { t } = useTranslation(['main', 'layout'])
  return (
    <div className="flex items-center mr-[16px]">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={`hover:border-brand-color w-[130px]  border rounded-[8px] border-border-default hover:opacity-90`}
        >
          <div className="flex items-center justify-center gap-[4px] bg-white py-1 rounded-[8px] font-normal h-[29px] text-sm ">
            <p>{t('quick_actions')}</p>
            <ChevronDown className="size-2.5 w-4" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="ml-[-70px] w-[200px] border border-border-default bg-white rounded-lg p-[2px]">
          <BetSetting sportsBook={sportsBook} />
          <AccountList sportsBook={sportsBook} />
          <ProxySetting sportsBook={sportsBook} />
          <ShowOdd sportsBook={sportsBook} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default QuickActionsPlatform
