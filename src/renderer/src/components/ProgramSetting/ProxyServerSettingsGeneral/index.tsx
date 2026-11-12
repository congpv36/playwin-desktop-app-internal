import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle } from 'lucide-react'

import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'

import { SettingType } from '@shared/common/types'
export default function ProxyServerSettingsGeneral() {
  const { t } = useTranslation(['main', 'layout'])
  const [focusedInput, setFocusedInput] = useState<string | null>('ipAddress')
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    ipAddress: '',
    port: '0',
    username: '',
    password: ''
  })

  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const setting = (await window.electron.ipcRenderer.invoke('GetDataSetting')) as SettingType

      setFormData({
        ipAddress: setting.ipAddress,
        port: setting.port,
        username: setting.username,
        password: setting.password
      })
    }

    fetchData()

    return () => {
      window.electron.ipcRenderer.removeAllListeners('GetDataSetting')
    }
  }, [])

  const handleOk = () => {
    window.electron.ipcRenderer.send('UpdateDataProxyServerSettingsGeneral', formData)

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
        <div className="min-w-[600px]">
          <div className=" flex-shrink-0 text-sm font-semibold whitespace-nowrap pb-2 border-b border-border-default">
            {t('proxy_server_settings_label')}
          </div>

          <div className="overflow-hidden text-sm">
            <div className="flex flex-col">
              <div className="flex border-b pt-6 pb-1 border-b-border-default overflow-hidden">
                <div className="min-w-[100px] flex-shrink-0 whitespace-nowrap w-[300px] ">
                  {t('ip_address')}
                </div>
                <div className="flex justify-center">
                  <div className="w-[400px] flex-shrink-0">
                    <Input
                      ref={firstInputRef}
                      value={formData.ipAddress}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, ipAddress: e.target.value }))
                      }
                      onFocus={() => setFocusedInput('ipAddress')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex border-b pt-6 pb-1 border-b-border-default overflow-hidden">
                <div className="min-w-[100px] flex-shrink-0 whitespace-nowrap  w-[300px]">
                  {t('port')}
                </div>
                <div className="flex justify-center">
                  <div className="w-[400px] flex-shrink-0">
                    <Input
                      value={formData.port}
                      onChange={(e) => setFormData((prev) => ({ ...prev, port: e.target.value }))}
                      onFocus={() => setFocusedInput('port')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex border-b pt-6 pb-1 border-b-border-default overflow-hidden">
                <div className="min-w-[100px] flex-shrink-0 whitespace-nowrap  w-[300px]">
                  {t('username')}
                </div>
                <div className=" flex justify-center">
                  <div className="w-[400px] flex-shrink-0">
                    <Input
                      value={formData.username}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, username: e.target.value }))
                      }
                      onFocus={() => setFocusedInput('username')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex border-b pt-6 pb-1 border-b-border-default overflow-hidden">
                <div className="min-w-[100px] flex-shrink-0 whitespace-nowrap  w-[300px]">
                  {t('password')}
                </div>
                <div className=" flex justify-center">
                  <div className="w-[400px] flex-shrink-0">
                    <Input
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, password: e.target.value }))
                      }
                      onFocus={() => setFocusedInput('password')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed footer */}
      <div className="h-[53px] flex justify-end space-x-2 py-3 px-5 overflow-hidden flex-shrink-0 border-t border-border-default bg-layout-color">
        <Button
          variant="bordered-white"
          className=" border-border-default bg-white  hover:border-gray-600 px-3 py-1.5 w-32"
          onClick={handleCancel}
        >
          {t('cancel', { ns: 'layout' })}
        </Button>
        <Button onClick={handleOk} className="whitespace-nowrap flex-shrink-0 w-32">
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
