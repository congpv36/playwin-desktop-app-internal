import { useTranslation } from 'react-i18next'

import ListEventContraList from '@renderer/components/ContraList/ListEventContraList'

function ContraList() {
  const { t } = useTranslation('layout')

  return (
    <div className="h-[99%] mt-[10px] mx-[12px] flex flex-col">
      <div className="font-bold mb-[16px]">{t('contra_list')}</div>
      <div className="flex-1 overflow-x-auto custom-scrollbar mb-3">
        <div className="h-full">
          <ListEventContraList />
        </div>
      </div>
    </div>
  )
}

export default ContraList
