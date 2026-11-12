import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle } from 'lucide-react'

import InputRangePlatform from '@renderer/components/ProgramSetting/BetSetting/InputRangePlatform'
import { Button } from '@renderer/components/ui/button'
import { BetSettingContext } from '@renderer/context/BetSettingContext'

export default function BetSetting() {
  const context = useContext(BetSettingContext)
  if (!context) return null

  const { t } = useTranslation(['main', 'layout'])

  const { listRangePlatform, setListRangePlatform } = context.RangePlatform
  const { otherSetting } = context.OtherSetting
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null)

  const reset = () => {
    setListRangePlatform((prev) =>
      prev.map((item) => ({
        ...item,
        valueRange: 0
      }))
    )
  }

  const save = () => {
    window.electron.ipcRenderer.send('DataBetSetting', {
      rangePlatforms: listRangePlatform,
      otherSetting
    })

    setShowSaveSuccess(true)
    setMessageSuccess(t('save_successful', { ns: 'layout' }))
    setTimeout(() => {
      setShowSaveSuccess(false)
    }, 1500)
  }

  const handleCancel = () => {
    window.history.back()
  }

  return (
    <div className="bg-layout-color flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-auto min-h-0 px-4 py-2 custom-scrollbar">
        <div className="min-w-[800px]">
          <h1 className="text-sm font-semibold mb-2 border-b pb-2 border-border-default whitespace-nowrap">
            {t('priority_manager')}
          </h1>
          <div className="flex-1 pb-5 border-border-default overflow-hidden">
            <InputRangePlatform />
          </div>
        </div>
      </div>

      <div className="h-[53px] flex justify-end space-x-2 py-3 px-5 flex-shrink-0 border-t border-border-default">
        <Button
          variant="bordered-white"
          className=" flex-shrink-0 border-border-default hover:border-gray-600  bg-white"
          onClick={reset}
        >
          {t('reset_all_changes', { ns: 'layout' })}
        </Button>
        <Button
          variant="bordered-white"
          className="border-red whitespace-nowrap flex-shrink-0 border-border-default hover:border-gray-600 w-32  bg-white"
          onClick={handleCancel}
        >
          {t('cancel', { ns: 'layout' })}
        </Button>

        <Button
          onClick={save}
          className="whitespace-nowrap flex-shrink-0 border-border-default hover:border-gray-600 hover:text-white w-32"
        >
          {t('save', { ns: 'layout' })}
        </Button>
      </div>

      {showSaveSuccess && (
        <div className="fixed top-[5%] right-[2%] bg-green-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center z-50 animate-pulse">
          <CheckCircle className="w-5 h-5 mr-2" />
          <span>{messageSuccess}</span>
        </div>
      )}
    </div>
  )
}
