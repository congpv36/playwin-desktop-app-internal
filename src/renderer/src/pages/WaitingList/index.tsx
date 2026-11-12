import { useTranslation } from 'react-i18next'

import ListEventWaitingList from '@renderer/components/WaitingList/ListEventWaitingList'

function WaitingList() {
  const { t } = useTranslation('layout')

  return (
    <div className="h-[99%] mt-[10px] mx-[12px] flex flex-col">
      <div className="font-bold mb-[16px]">{t('waiting_list')}</div>
      <div className="flex-1 overflow-x-auto custom-scrollbar mb-3">
        <div className="h-full">
          <ListEventWaitingList />
        </div>
      </div>
    </div>
  )
}

export default WaitingList
