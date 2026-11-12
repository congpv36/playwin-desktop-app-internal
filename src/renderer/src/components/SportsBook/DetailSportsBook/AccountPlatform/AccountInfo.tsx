import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { NotificationError } from '@renderer/components/NotificationPopup/NotificationError'
import CountryIpSelector from '@renderer/components/SportsBook/DetailSportsBook/AccountPlatform/CountryIpSelector'
import { AlertDialog, AlertDialogContent } from '@renderer/components/ui/alert-dialog'
import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { validateAndUpdateData } from '@renderer/lib/validateAndUpdateData'
import ExclamationTriangle from '@renderer/icons/exclamation-triangle'
import Eye from '@renderer/icons/eye'
import EyeSlash from '@renderer/icons/eye-slash'

import { LIMIT_METHOD, LIMIT_TYPE } from '@shared/common/constants'
import { AccountType } from '@shared/common/types'

interface AccountInfoProps {
  account: AccountType
  isMatchLimitAllAccount: number
}

function AccountInfo({ account, isMatchLimitAllAccount }: AccountInfoProps) {
  const { id: activeId } = useParams()
  const { t } = useTranslation(['main', 'layout'])
  const [openModalSetting, setOpenModalSetting] = useState(false)
  const [customIP, setCustomIP] = useState(account.customIP || '')

  const [formData, setFormData] = useState({
    loginID: '',
    password: '',
    secret: '',
    limitMethod: 'TeamName',
    limitType: 'TotalCount',
    totalAmount: '5000',
    totalCount: '2'
  })
  const [loginID, setUsername] = useState('')
  const [platform, setPlatform] = useState('')

  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    visible: false
  })

  const firstInputRef = useRef<HTMLInputElement>(null)

  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  useEffect(() => {
    if (!openModalSetting) return

    const fetchAccount = async () => {
      const data = (await window.electron.ipcRenderer.invoke(
        'DataAccount',
        account.id
      )) as AccountType
      setPlatform(data.platformName)
      setFormData({
        loginID: data.loginID || '',
        password: data.password || '',
        secret: data.secret || '',
        limitMethod: data.limitMethod,
        limitType: data.limitType,
        totalAmount: data.totalAmount,
        totalCount: data.totalCount
      })
      setUsername(data.loginID)
    }
    fetchAccount()
  }, [openModalSetting, account.id])

  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus()
    }
  }, [])

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    if (formData.loginID && formData.loginID !== loginID) {
      const isDuplicate = await window.electron.ipcRenderer.invoke('CheckUserNameAccount', {
        username: formData.loginID,
        platform
      })
      if (isDuplicate) {
        setAlertConfig({
          title: t('notification', { ns: 'layout' }),
          message: t('this_account_already_exists'),
          visible: true
        })
        return
      }
    }
    const validateFormData = validateAndUpdateData(formData)

    window.electron.ipcRenderer.send('Data_AccountLoginForm', {
      activeId,
      account: {
        id: account.id,
        customIP,
        ...validateFormData
      }
    })
    setOpenModalSetting(false)
  }

  return (
    <>
      <div
        className=" font-bold underline decoration-blue-color text-blue-color hover:decoration-blue-500 cursor-pointer truncate w-[140px]"
        onClick={() => setOpenModalSetting(true)}
      >
        {account.loginID}
      </div>
      <AlertDialog open={openModalSetting}>
        <AlertDialogContent className="p-0 rounded-[12px]  bg-white flex flex-col gap-0">
          <header className="flex p-[16px] border-b border-border-default">
            <div className="ml-[10px] flex flex-col">
              <div className="flex justify-between">
                <p className="text-lg font-semibold ">{t('account_information')}</p>
                <button
                  className="absolute top-[6px] right-[6px] font-normal block w-9 h-9 leading-none hover:bg-gray-200 hover:rounded-full"
                  onClick={() => setOpenModalSetting(false)}
                >
                  ✕
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 gap-[16px] px-[24px] text-sm">
            <div className="flex-1 py-[20px] flex">
              <div className="flex-1">
                <div className="flex mb-[8px]">
                  <p className="w-28 mb-[6px] leading-none">{t('username')}</p>
                  <input
                    className="flex-1 block bg-transparent border border-border-default rounded-lg py-[6px] px-[14px] focus-within:border-gray-500"
                    ref={firstInputRef}
                    type="text"
                    value={formData.loginID}
                    onChange={(e) => handleInputChange('loginID', e.target.value)}
                    spellCheck={false}
                    maxLength={20}
                  />
                </div>
                <div className="flex">
                  <p className="w-28 mb-[6px] leading-none">{t('password')}</p>
                  <div className="flex flex-1 bg-transparent border border-border-default rounded-lg py-[6px] px-[14px] focus-within:border-gray-500">
                    <input
                      type={isPasswordVisible ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="flex-1 outline-none bg-transparent"
                      spellCheck={false}
                      maxLength={20}
                    />
                    <button
                      type="button"
                      className="text-gray-400 w-4 mr-1"
                      onClick={() => setIsPasswordVisible((prev) => !prev)}
                    >
                      {isPasswordVisible ? <Eye /> : <EyeSlash />}
                    </button>
                  </div>
                </div>
                {account.platformName === 'Ps3838' && (
                  <div className="flex mt-[8px]">
                    <p className="w-28 mb-[6px] leading-none">{t('secret')}</p>
                    <input
                      className="flex-1 block bg-transparent border border-border-default rounded-lg py-[6px] px-[14px] focus-within:border-gray-500"
                      type="text"
                      value={formData.secret}
                      onChange={(e) => handleInputChange('secret', e.target.value)}
                      spellCheck={false}
                    />
                  </div>
                )}
              </div>
            </div>
            <CountryIpSelector account={account} setCustomIP={setCustomIP} />
            <div className="border-b border-border-default pt-2" />

            <div className="flex-1 py-[15px]">
              <div className="flex justify-between">
                <p className="font-bold pb-2">{t('per_match_limit')}</p>
                {isMatchLimitAllAccount == 1 && (
                  <p className="text-center font-semibold text-red-color">
                    {t('general_bet_settings_enabled')}
                  </p>
                )}
              </div>
              <div className="flex flex-col h-full gap-7">
                <div>
                  <div className="text-sm font-semibold pb-2">{t('limit_method')}</div>
                  <div>
                    <RadioGroup
                      className="flex justify-center"
                      value={formData.limitMethod}
                      onValueChange={(value) => handleInputChange('limitMethod', value)}
                      disabled={Boolean(isMatchLimitAllAccount)}
                    >
                      <div className="flex flex-col gap-5">
                        <div className="flex">
                          <div className="flex w-[180px] items-center space-x-2">
                            <RadioGroupItem
                              value={LIMIT_METHOD.TEAM_NAME}
                              id={LIMIT_METHOD.TEAM_NAME}
                            />
                            <Label htmlFor={LIMIT_METHOD.TEAM_NAME} className="font-normal">
                              {t('team_name')}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={LIMIT_METHOD.TEAM_NAME_HANDICAP}
                              id={LIMIT_METHOD.TEAM_NAME_HANDICAP}
                            />
                            <Label
                              htmlFor={LIMIT_METHOD.TEAM_NAME_HANDICAP}
                              className="font-normal"
                            >
                              {t('team_name_handicap')}
                            </Label>
                          </div>
                        </div>

                        <div className="flex">
                          <div className="flex w-[180px] items-center space-x-2">
                            <RadioGroupItem
                              value={LIMIT_METHOD.NAME_BETTYPE_LIMIT}
                              id={LIMIT_METHOD.NAME_BETTYPE_LIMIT}
                            />
                            <Label
                              htmlFor={LIMIT_METHOD.NAME_BETTYPE_LIMIT}
                              className="font-normal"
                            >
                              {t('name_bettype_limit')}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={LIMIT_METHOD.NAME_TARGET_LIMIT}
                              id={LIMIT_METHOD.NAME_TARGET_LIMIT}
                            />
                            <Label htmlFor={LIMIT_METHOD.NAME_TARGET_LIMIT} className="font-normal">
                              {t('name_target_limit')}
                            </Label>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold pb-1">{t('limit_type')}</div>
                  <div>
                    <RadioGroup
                      className="flex"
                      value={formData.limitType}
                      onValueChange={(value) => handleInputChange('limitType', value)}
                      disabled={Boolean(isMatchLimitAllAccount)}
                    >
                      <div className="flex flex-col gap-1">
                        {/* Total Amount */}
                        <div className="flex items-center">
                          <div className="flex w-[180px] items-center space-x-2">
                            <RadioGroupItem
                              value={LIMIT_TYPE.TOTAL_AMOUNT}
                              id={LIMIT_TYPE.TOTAL_AMOUNT}
                            />
                            <Label htmlFor={LIMIT_TYPE.TOTAL_AMOUNT} className="font-normal">
                              {t('limit_by_total_amount')}
                            </Label>
                          </div>

                          <input
                            className={`flex-1 bg-transparent border border-border-default rounded-lg py-[6px] pl-[14px] pr-[5px] focus:border-gray-500 ${
                              isMatchLimitAllAccount ||
                              formData.limitType !== LIMIT_TYPE.TOTAL_AMOUNT
                                ? ''
                                : 'border-gray-500'
                            }`}
                            type="number"
                            id="InputLimitByTotalAmount"
                            value={formData.totalAmount}
                            onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                            disabled={Boolean(
                              isMatchLimitAllAccount ||
                                formData.limitType !== LIMIT_TYPE.TOTAL_AMOUNT
                            )}
                            step={100}
                          />
                        </div>

                        {/* Total Count */}
                        <div className="flex items-center">
                          <div className="flex w-[180px] items-center space-x-2">
                            <RadioGroupItem
                              value={LIMIT_TYPE.TOTAL_COUNT}
                              id={LIMIT_TYPE.TOTAL_COUNT}
                            />
                            <Label htmlFor={LIMIT_TYPE.TOTAL_COUNT} className="font-normal">
                              {t('limit_by_total_count')}
                            </Label>
                          </div>

                          <input
                            className={`flex-1 bg-transparent border border-border-default rounded-lg py-[6px] pl-[14px] pr-[5px] focus:border-gray-500 ${
                              isMatchLimitAllAccount ||
                              formData.limitType !== LIMIT_TYPE.TOTAL_COUNT
                                ? ''
                                : 'border-gray-500'
                            }`}
                            type="number"
                            id="InputLimitByTotalCount"
                            value={formData.totalCount}
                            min={0}
                            onChange={(e) => handleInputChange('totalCount', e.target.value)}
                            disabled={Boolean(
                              isMatchLimitAllAccount ||
                                formData.limitType !== LIMIT_TYPE.TOTAL_COUNT
                            )}
                          />
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <footer className="flex gap-[16px]  p-[24px] ">
            <button
              className="flex-1 outline-none border border-border-default hover:border-gray-700 block h-[40px] font-semibold rounded-[8px]"
              onClick={() => setOpenModalSetting(false)}
            >
              {t('cancel', { ns: 'layout' })}
            </button>
            <button
              className="bg-brand-color text-white flex-1 border-none block h-[40px] font-semibold  hover:bg-opacity-90 rounded-[8px]"
              onClick={save}
            >
              {t('save', { ns: 'layout' })}
            </button>
          </footer>
        </AlertDialogContent>
      </AlertDialog>
      <NotificationError
        showAlertDialog={alertConfig.visible}
        setShowAlertDialog={(visible) => setAlertConfig((prev) => ({ ...prev, visible }))}
        title={alertConfig.title}
        messageError={alertConfig.message}
        ReactElement={<ExclamationTriangle className="text-[#FF8C00] mr-1 size-11" />}
      />
    </>
  )
}

export default AccountInfo
