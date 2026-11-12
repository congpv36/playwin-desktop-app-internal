import { useTranslation } from 'react-i18next'

import ListEventBetList from '@renderer/components/BetList/ListEventBetList'
import ListEventFailedBetList from '@renderer/components/BetList/ListEventFailedBetList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'

function BetList() {
  const { t } = useTranslation('layout')

  return (
    <div className="h-[99%] mt-[10px] mx-[12px] flex flex-col">
      <Tabs defaultValue="BetList" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full flex justify-start border border-border-default bg-border-default text-text-default font-semibold rounded-[6px] mt-[16px] mb-[10px] px-[3px] gap-[3px] h-[36px] ">
          <TabsTrigger value="BetList" className="hover:bg-white">
            {t('bet_list')}
          </TabsTrigger>
          <TabsTrigger value="FailedBetList" className="hover:bg-white">
            {t('failed_bet_list')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="BetList" className="flex-1 overflow-x-auto custom-scrollbar mb-3 mt-0">
          <div className="h-full">
            <ListEventBetList />
          </div>
        </TabsContent>
        <TabsContent
          value="FailedBetList"
          className="flex-1 overflow-x-auto custom-scrollbar mb-3 mt-0"
        >
          <div className="h-full">
            <ListEventFailedBetList />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default BetList
