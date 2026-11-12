import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '@renderer/i18n/i18n'
import { CheckCircle } from 'lucide-react'

import { Button } from '@renderer/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import UnionFlag from '@renderer/icons/union-flag'
import ViFlag from '@renderer/icons/vi-flag'
import ZhFlag from '@renderer/icons/zh-flag'

import { DEFAULT_LANGUAGE, LanguageType } from '@shared/common/constants'
import { SettingType } from '@shared/common/types'

export default function Language() {
  const { t } = useTranslation('layout')

  const languages = [
    {
      value: 'en',
      label: t('english'),
      flag: <UnionFlag />
    },
    {
      value: 'zh',
      label: t('chinese'),
      flag: <ZhFlag />
    },
    {
      value: 'vi',
      label: t('vietnamese'),
      flag: <ViFlag />
    }
  ]

  const [language, setLanguage] = useState<LanguageType>(DEFAULT_LANGUAGE)

  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const setting = (await window.electron.ipcRenderer.invoke('GetDataSetting')) as SettingType

      setLanguage(setting.language as LanguageType)
    }

    fetchData()

    return () => {
      window.electron.ipcRenderer.removeAllListeners('GetDataSetting')
    }
  }, [])

  const handleOk = async () => {
    await i18n.changeLanguage(language)

    setShowSaveSuccess(true)
    setMessageSuccess(t('save_successful'))

    window.electron.ipcRenderer.send('SaveSettingLanguage', { language })

    setTimeout(() => {
      setShowSaveSuccess(false)
    }, 1500)
  }

  const handleCancel = () => {
    window.history.back()
  }

  return (
    <div className="bg-layout-color text-sm flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-auto min-h-0 px-4 py-2 custom-scrollbar">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-1 overflow-hidden">
            <div className="flex pl-0 pb-2 border-b border-border-default ">
              <div className="text-sm font-semibold  w-[300px]">{t('select_language')}</div>

              <div className="w-[200px] flex-shrink-0">
                <Select
                  value={language}
                  onValueChange={(value: LanguageType) => setLanguage(value)}
                >
                  <SelectTrigger className="w-full bg-white border-border-default">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value} className="py-1 text-sm">
                        <div className="flex items-center gap-2">
                          {lang.flag}
                          {lang.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[53px] flex justify-end space-x-2 py-3 px-5 overflow-hidden flex-shrink-0 border-t border-border-default bg-layout-color">
        <Button
          variant="bordered-white"
          className="border-border-default bg-white hover:border-gray-600 px-3 py-1.5 w-32"
          onClick={handleCancel}
        >
          {t('cancel')}
        </Button>
        <Button onClick={handleOk} className="whitespace-nowrap flex-shrink-0 w-32">
          {t('save')}
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
