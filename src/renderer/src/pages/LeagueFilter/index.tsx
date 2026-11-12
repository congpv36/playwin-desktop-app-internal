import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle } from 'lucide-react'

import BodyLeagueFilter from '@renderer/components/League/BodyLeagueFilter'
import FilterType from '@renderer/components/League/FilterType'
import FooterLeagueFilter from '@renderer/components/League/FooterLeagueFilter'
import ListLeague_Add from '@renderer/components/League/ListLeague_Add'
import { Button } from '@renderer/components/ui/button'
import { LeagueFilterContext } from '@renderer/context/LeagueFilterContext'

export default function LeagueFilter() {
  const { t } = useTranslation('layout')
  const context = useContext(LeagueFilterContext)
  if (!context) return null
  const { filterType } = context.filterType
  const { listBlockLeagueTable, listAllowLeagueTable } = context.tableData as {
    listBlockLeagueTable: { id: string | number; league: string }[]
    setListBlockLeagueTable: React.Dispatch<
      React.SetStateAction<{ id: string | number; league: string }[]>
    >
    listAllowLeagueTable: { id: string | number; league: string }[]
    setListAllowLeagueTable: React.Dispatch<
      React.SetStateAction<{ id: string | number; league: string }[]>
    >
  }
  const { blockMajorLeague, setBlockMajorLeague, allowMajorLeague, setAllowMajorLeague } =
    context.actionCheckBoxMajorLeague
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null)
  const reset = () => {
    context.filterType.setFilterType('Block')

    setBlockMajorLeague(0)
    setAllowMajorLeague(0)

    context.tableData.setListBlockLeagueTable([])
    context.tableData.setListAllowLeagueTable([])

    setShowSaveSuccess(true)
    setMessageSuccess(t('all_changes_reset'))
    setTimeout(() => {
      setShowSaveSuccess(false)
    }, 1500)
  }

  const save = () => {
    window.electron.ipcRenderer.send('DataLeagueFilter', {
      filterType,
      blockMajorLeague,
      allowMajorLeague,
      listAllowLeagueTable,
      listBlockLeagueTable
    })
    setShowSaveSuccess(true)
    setMessageSuccess(t('save_successful'))
    setTimeout(() => {
      setShowSaveSuccess(false)
    }, 1500)
  }
  const handleCancel = () => {
    window.history.back()
  }
  return (
    <>
      <div className="bg-layout-color flex flex-col overflow-auto custom-scrollbar">
        <div className="min-w-[800px]">
          <div className="flex justify-between items-center mx-[12px] overflow-hidden">
            <h1 className="font-bold mb-[16px]">{t('league_filter')}</h1>

            <div className="flex justify-end space-x-2 py-2 pr-5 flex-shrink-0">
              <Button
                variant="bordered-white"
                className=" whitespace-nowrap bg-white border-border-default hover:border-gray-600"
                onClick={reset}
              >
                {t('reset_all_changes')}
              </Button>
              <Button
                variant="bordered-white"
                className=" whitespace-nowrap bg-white border-border-default hover:border-gray-600 w-32"
                onClick={handleCancel}
              >
                {t('cancel')}
              </Button>

              <Button onClick={save} className="whitespace-nowrap w-32">
                {t('save')}
              </Button>
            </div>
          </div>

          <div className="flex mr-3">
            <div className="w-3/5 min-w-[260px] rounded-lg mx-3 border border-border-default flex-shrink-0">
              <div className="flex flex-col">
                <FilterType />
                <div className="flex flex-col">
                  <BodyLeagueFilter />
                </div>
              </div>
            </div>
            <div className="w-2/5 border-b-[#22262F] ">
              <ListLeague_Add />
            </div>
          </div>
          <FooterLeagueFilter />
        </div>

        {showSaveSuccess && (
          <div className="fixed top-[5%] right-[2%] bg-green-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center z-50 animate-pulse">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>{messageSuccess}</span>
          </div>
        )}
      </div>
    </>
  )
}
