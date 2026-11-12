import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'

import ListEventSuccessList from '@renderer/components/SuccessList/ListEventSuccessList'

type SuccessListTab = 'default' | 'showOdds'

function SuccessList() {
  const { t } = useTranslation('layout')
  const [activeTab, setActiveTab] = useState<SuccessListTab>('default')

  return (
    <div className="h-[99%] mt-[10px] mx-[12px] flex flex-col">
      <div className="font-bold">{t('success_list')}</div>
      <div className="border border-border-default bg-border-default text-[#717680]  rounded-[6px] mt-[16px] mb-[10px] px-[3px] flex gap-[3px] h-[36px] items-center ">
        <button
          type="button"
          onClick={() => setActiveTab('default')}
          className={clsx(
            'px-[8px] h-[28px] text-sm flex justify-center items-center rounded-[6px] cursor-pointer shadow-2xl leading-none text-text-default',
            activeTab === 'default' ? 'bg-white font-semibold' : 'hover:bg-white'
          )}
          style={{ minWidth: '106px' }}
        >
          {t('account_pair')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('showOdds')}
          className={clsx(
            'px-[8px] h-[28px] text-sm flex justify-center items-center rounded-[6px] cursor-pointer shadow-2xl leading-none text-text-default',
            activeTab === 'showOdds' ? 'bg-white font-semibold' : 'hover:bg-white'
          )}
          style={{ minWidth: '106px' }}
        >
          {t('show_odds')}
        </button>
      </div>

      <div className="flex-1 overflow-x-auto custom-scrollbar mb-3">
        <div className="h-full">
          <ListEventSuccessList isShowOdd={activeTab === 'showOdds'} />
        </div>
      </div>
    </div>
  )
}

export default SuccessList
