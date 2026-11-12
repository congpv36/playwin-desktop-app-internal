import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle } from 'lucide-react'

import AddLeague from '@renderer/components/LeaguePointRandomizer/AddLeague'
import Main from '@renderer/components/LeaguePointRandomizer/Main'
import { Button } from '@renderer/components/ui/button'
import { LeaguePointRandomizerContext } from '@renderer/context/LeaguePointRandomizerContext'

export default function LeaguePointRandomizer() {
  const { t } = useTranslation('layout')
  const context = useContext(LeaguePointRandomizerContext)
  if (!context) return null

  const { listSelectedLeague, setListSelectedLeague } = context

  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null)

  const reset = () => {
    setListSelectedLeague([])
    setMessageSuccess(t('all_changes_reset'))
    setShowSaveSuccess(true)
    setTimeout(() => setShowSaveSuccess(false), 2000)
  }

  const save = () => {
    setMessageSuccess(t('save_successfully'))
    setShowSaveSuccess(true)
    setTimeout(() => setShowSaveSuccess(false), 2000)
    window.electron.ipcRenderer.send('SaveLeaguePointRandomizer', listSelectedLeague)
  }

  const handleCancel = () => {
    window.history.back()
  }
  return (
    <>
      <div className="bg-layout-color flex flex-col overflow-auto custom-scrollbar">
        <div className="min-w-[800px]">
          <div className="flex justify-between items-center mx-[12px] overflow-hidden">
            <h1 className="font-bold mb-[16px]">{t('point_randomizer')}</h1>

            <div className="flex justify-end space-x-2 py-2 pr-5 flex-shrink-0">
              <Button
                variant="bordered-white"
                className="bg-white whitespace-nowrap  border-border-default hover:border-gray-600"
                onClick={reset}
              >
                {t('reset_all_changes')}
              </Button>
              <Button
                variant="bordered-white"
                className="border-border-default bg-white hover:border-gray-600  px-3 py-1.5 w-32"
                onClick={handleCancel}
              >
                {t('cancel')}
              </Button>

              <Button onClick={save} className="whitespace-nowrap w-32">
                {t('save')}
              </Button>
            </div>
          </div>
          <div className="flex gap-3 mx-3">
            <div className="w-3/5 min-w-[260px] border border-border-default flex-shrink-0 bg-white">
              <Main />
            </div>
            <div className="w-2/5 border-b-[#22262F]">
              <AddLeague />
            </div>
          </div>
        </div>
      </div>
      {showSaveSuccess && (
        <div className="fixed top-[5%] right-[2%] bg-green-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center z-50 animate-pulse">
          <CheckCircle className="w-5 h-5 mr-2" />
          <span>{messageSuccess}</span>
        </div>
      )}
    </>
  )
}
