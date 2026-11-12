import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { NotificationError } from '@renderer/components/NotificationPopup/NotificationError'
import AccountPlatform from '@renderer/components/SportsBook/DetailSportsBook/AccountPlatform'
import DeylaySec from '@renderer/components/SportsBook/DetailSportsBook/DelaySec'
import DeletePlatform from '@renderer/components/SportsBook/DetailSportsBook/DeletePlatform'
import OptionsUrl from '@renderer/components/SportsBook/DetailSportsBook/OptionsUrl'
import QuickActionsPlatform from '@renderer/components/SportsBook/DetailSportsBook/QuickActions'
import ExclamationTriangle from '@renderer/icons/exclamation-triangle'

import { DataPlatformType } from '@shared/common/types'

interface DetailSportsBookProps {
  sportsBook: DataPlatformType
}

const DetailSportsBook: React.FC<DetailSportsBookProps> = ({ sportsBook }) => {
  const { t } = useTranslation(['main', 'layout'])

  const [showAlertError, setShowAlertError] = useState(false)

  return (
    <div className="min-w-[890px] shadow-md mb-[10px] border border-border-default rounded-[12px] bg-[#f5f5f5]">
      <div className="flex font-bold px-[7px] rounded-t-md items-center border-b border-border-default py-[3px]">
        <div className="h-full flex-1 flex items-center ">
          <span
            className={`mr-2 w-4 h-4 rounded-full ${sportsBook.isPaired ? 'bg-green-color' : 'bg-red-color'}`}
          />
          <p className="w-[83px] text-sm font-bold ">{sportsBook.platform}</p>
          <OptionsUrl sportsBook={sportsBook} />
        </div>
        <div className="mr-1">
          <DeylaySec sportsBook={sportsBook} />
        </div>
        <QuickActionsPlatform sportsBook={sportsBook} />
        <DeletePlatform sportsBook={sportsBook} />
      </div>
      <div className="h-7 flex text-xs font-semibold border-b border-border-default ">
        <div className="w-[100px] flex items-center border-r border-border-default ml-[15px]">
          {t('username')}
        </div>
        <div className=" w-[70px] flex items-center justify-center border-r border-border-default">
          {t('actions')}
        </div>
        <div className=" w-[60px] flex items-center justify-center border-r border-border-default">
          {t('currency')}
        </div>
        <div className=" w-[82px] flex items-center justify-center border-r border-border-default">
          {t('cash_balance')}
        </div>
        <div className=" w-[80px] flex items-center justify-center border-r border-border-default">
          {t('outstanding')}
        </div>
        <div className=" w-[80px] flex items-center justify-center border-r border-border-default">
          {t('bet_credit')}
        </div>
        <div className="ml-1 flex items-center justify-center leading-none ">
          {t('given_credit')}
        </div>
      </div>

      <div className=" py-1 h-[58px] bg-[#f5f5f5] rounded-b-[12px]">
        {sportsBook.accounts &&
          sportsBook.accounts.length > 0 &&
          sportsBook.accounts.map((account, index) => (
            <AccountPlatform
              key={account.id}
              account={account}
              index={index}
              isMatchLimitAllAccount={sportsBook.isMatchLimitAllAccount}
            />
          ))}
      </div>
      <NotificationError
        showAlertDialog={showAlertError}
        setShowAlertDialog={setShowAlertError}
        title={t('notification', { ns: 'layout' })}
        messageError={t('account_addition_limit_reached')}
        ReactElement={<ExclamationTriangle className="size-11 text-orange-color mr-1" />}
      />
    </div>
  )
}

export default React.memo(DetailSportsBook)
