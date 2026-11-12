import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import MultiSelectDay from '@renderer/components/SportsBook/MultiSelectDay'
import { Button } from '@renderer/components/ui/button'
import { Checkbox } from '@renderer/components/ui/checkbox'

import { LoginLogoutSetting, ScheduledLoginLogoutParseType } from '@shared/common/types'

export default function ScheduledLoginLogoutSetting({ onClose }: { onClose?: () => void }) {
  const { t } = useTranslation('main')
  const { t: tLayout } = useTranslation('layout')
  const { id: activeId } = useParams()
  const dialogRef = useRef<HTMLDivElement | null>(null)

  const [bookmakers, setBookmakers] = useState<ScheduledLoginLogoutParseType[]>([])

  useEffect(() => {
    window.electron.ipcRenderer
      .invoke('GetScheduledLoginLogout', { activeSportsBook: activeId })
      .then((data: ScheduledLoginLogoutParseType[]) => {
        const normalize = data.map((b) => ({
          ...b,
          loginSetting: {
            enabled: b.loginSetting?.enabled ?? 0,
            schedules: b.loginSetting?.schedules || []
          },
          logoutSetting: {
            enabled: b.logoutSetting?.enabled ?? 0,
            schedules: b.logoutSetting?.schedules || []
          }
        }))

        setBookmakers(normalize)
      })

    return () => window.electron.ipcRenderer.removeAllListeners('GetScheduledLoginLogout')
  }, [])

  const isSameSchedule = (login: LoginLogoutSetting, logout: LoginLogoutSetting) => {
    if (login.enabled !== 1 || logout.enabled !== 1) return false

    const logoutSet = new Set(logout.schedules.map((o) => `${o.day}-${o.time}`))

    return login.schedules.some((l) => logoutSet.has(`${l.day}-${l.time}`))
  }

  const hasError = (item: ScheduledLoginLogoutParseType) =>
    isSameSchedule(item.loginSetting, item.logoutSetting)

  const hasAnyError = bookmakers.some((b) => hasError(b))

  const toggleBookmaker = (id: string, checked: boolean) => {
    setBookmakers((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              checked: checked ? 1 : 0
            }
          : b
      )
    )
  }

  const toggleAllBookmakers = (checked: boolean) => {
    setBookmakers((prev) =>
      prev.map((b) => ({
        ...b,
        checked: checked ? 1 : 0
      }))
    )
  }

  const toggleAllLogin = (checked: boolean) => {
    setBookmakers((prev) =>
      prev.map((b) => ({
        ...b,
        loginSetting: {
          ...b.loginSetting,
          enabled: checked ? 1 : 0
        }
      }))
    )
  }

  const toggleAllLogout = (checked: boolean) => {
    setBookmakers((prev) =>
      prev.map((b) => ({
        ...b,
        logoutSetting: {
          ...b.logoutSetting,
          enabled: checked ? 1 : 0
        }
      }))
    )
  }

  const updateSetting = (
    id: string,
    type: 'loginSetting' | 'logoutSetting',
    field: keyof LoginLogoutSetting,
    value: LoginLogoutSetting[keyof LoginLogoutSetting] | boolean
  ) => {
    setBookmakers((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b

        return {
          ...b,
          [type]: {
            ...b[type],
            [field]: typeof value === 'boolean' ? (value ? 1 : 0) : value
          }
        }
      })
    )
  }

  const handleSave = () => {
    window.electron.ipcRenderer.send('DataScheduledLoginLogout', bookmakers)

    onClose?.()
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4 min-w-[820px]"
      onClick={() => onClose?.()}
    >
      <div ref={dialogRef} className="w-full max-w-[820px]" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white relative border border-border-default rounded-lg overflow-hidden shadow-2xl">
          {/* HEADER */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border-default">
            <h3 className=" font-semibold">{t('scheduled_automated_login_and_logout')}</h3>

            <button
              className="absolute top-[6px] right-[6px] font-normal block w-9 h-9 leading-none text-[#85888E] hover:bg-gray-200 hover:rounded-full"
              onClick={() => onClose?.()}
            >
              ✕
            </button>
          </div>

          {/* BODY */}
          <div className="p-4">
            <div className="max-h-[420px] overflow-y-auto border border-border-default rounded">
              <table className="w-full text-sm  border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="pl-2 text-left">
                      <Checkbox
                        onCheckedChange={(checked) => toggleAllBookmakers(Boolean(checked))}
                        checked={bookmakers.every((b) => Boolean(b.checked))}
                      />
                    </th>

                    <th className="text-left">{t('select_all')}</th>

                    <th className="p-2 text-left">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          onCheckedChange={(checked) => toggleAllLogin(Boolean(checked))}
                          checked={bookmakers.every((b) => Boolean(b.loginSetting.enabled))}
                        />
                        {t('login_setting')}
                      </div>
                    </th>

                    <th className="p-2 text-left">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          onCheckedChange={(checked) => toggleAllLogout(Boolean(checked))}
                          checked={bookmakers.every((b) => Boolean(b.logoutSetting.enabled))}
                        />
                        {t('logout_setting')}
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {bookmakers.map((item) => {
                    const error = hasError(item)

                    return (
                      <tr
                        key={item.id}
                        className={`border-t border-border-default ${error ? 'bg-red-900/20' : ''}`}
                      >
                        {/* CHECK */}
                        <td className="p-2">
                          <Checkbox
                            checked={Boolean(item.checked)}
                            onCheckedChange={(checked) =>
                              toggleBookmaker(item.id, Boolean(checked))
                            }
                          />
                        </td>

                        {/* NAME */}
                        <td className="p-2">
                          <div className="flex flex-col">
                            {item.platformName}

                            {error && (
                              <span className="text-red-color text-xs mt-1">
                                {t('login_logout_same_time_error')}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* LOGIN */}
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={Boolean(item.loginSetting.enabled)}
                              onCheckedChange={(checked) =>
                                updateSetting(item.id, 'loginSetting', 'enabled', checked === true)
                              }
                            />

                            <MultiSelectDay
                              value={item.loginSetting.schedules}
                              onChange={(val) =>
                                updateSetting(item.id, 'loginSetting', 'schedules', val)
                              }
                            />
                          </div>
                        </td>

                        {/* LOGOUT */}
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={Boolean(item.logoutSetting.enabled)}
                              onCheckedChange={(checked) =>
                                updateSetting(item.id, 'logoutSetting', 'enabled', checked === true)
                              }
                            />

                            <MultiSelectDay
                              value={item.logoutSetting.schedules}
                              onChange={(val) =>
                                updateSetting(item.id, 'logoutSetting', 'schedules', val)
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-border-default ">
              <Button
                onClick={() => onClose?.()}
                className="w-32 bg-transparent border border-border-default hover:bg-transparent hover:border-gray-400 !text-text-default"
              >
                {tLayout('cancel')}
              </Button>

              <Button disabled={hasAnyError} onClick={handleSave} className="w-32">
                {tLayout('save')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
