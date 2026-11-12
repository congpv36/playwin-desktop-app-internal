import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { AlertDialog, AlertDialogContent } from '@renderer/components/ui/alert-dialog'
import { DropdownMenuItem } from '@renderer/components/ui/dropdown-menu'
import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { SwitchCustom } from '@renderer/components/ui/switch'

import { LIMIT_METHOD, LIMIT_TYPE } from '@shared/common/constants'
import { SportsBookType } from '@shared/common/types'

export default function BetSetting({ sportsBook }: { sportsBook: SportsBookType }) {
  const { id: activeId } = useParams()
  const { t } = useTranslation(['main', 'layout'])
  const profile = localStorage.getItem('profile')
  const isTrialAccount = profile ? JSON.parse(profile)?.isTrialAccount : false

  const [openModalSetting, setOpenModalSetting] = useState(false)

  const [betAmountSetting, setBetAmountSetting] = useState('')
  const [betFixedAmountValue, setBetFixedAmountValue] = useState('')

  const [isSwitchOn, setIsSwitchOn] = useState(Boolean(sportsBook.isMatchLimitAllAccount))
  const [limitMethod, setLimitMethod] = useState<string>(sportsBook.limitMethod)
  const [limitType, setLimitType] = useState<string>(sportsBook.limitType)
  const [formData, setFormData] = useState({
    totalAmount: sportsBook.totalAmount,
    totalCount: sportsBook.totalCount
  })

  // === Lưu giá trị ban đầu ===
  const initialDataRef = useRef({
    isMatchLimitAllAccount: sportsBook.isMatchLimitAllAccount,
    limitMethod: sportsBook.limitMethod,
    limitType: sportsBook.limitType,
    totalAmount: sportsBook.totalAmount,
    totalCount: sportsBook.totalCount
  })

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const validateFormData = (data) => {
    const cleanValue = (value, defaultValue) => {
      if (value === undefined || value === null) return defaultValue
      const strValue = String(value).trim()

      if (!/^\d+$/.test(strValue)) {
        return defaultValue
      }

      const noLeadingZeros = strValue.replace(/^0+/, '')

      if (noLeadingZeros === '') {
        return defaultValue
      }

      return noLeadingZeros
    }

    return {
      totalAmount: cleanValue(data.totalAmount, '5000'),
      totalCount: cleanValue(data.totalCount, '2')
    }
  }

  const validatedData = validateFormData(formData)

  useEffect(() => {
    const fetchData = async () => {
      const data = (await window.electron.ipcRenderer.invoke(
        'GetDataSportBookByPlatform',
        sportsBook.platform
      )) as SportsBookType
      setBetAmountSetting(data.betAmountSetting)
      setBetFixedAmountValue(data.betFixedAmountValue)
    }
    fetchData()

    return () => {
      window.electron.ipcRenderer.removeAllListeners('GetDataSportBookByPlatform')
    }
  }, [])

  const handleSave = () => {
    const numericValue = Number(betFixedAmountValue)

    if (!isNaN(numericValue)) {
      const cleanedValue = String(numericValue)

      const update = !(
        initialDataRef.current.isMatchLimitAllAccount === Number(isSwitchOn) &&
        initialDataRef.current.limitMethod === limitMethod &&
        initialDataRef.current.limitType === limitType &&
        initialDataRef.current.totalAmount === validatedData.totalAmount &&
        initialDataRef.current.totalCount === validatedData.totalCount
      )

      window.electron.ipcRenderer.send('SaveBetFixedAmountValue', {
        activeSportsBook: activeId,
        platform: sportsBook.platform,
        data: {
          betAmountSetting,
          betFixedAmountValue: cleanedValue == '0' ? '10' : cleanedValue,
          isMatchLimitAllAccount: Number(isSwitchOn),
          limitMethod,
          limitType,
          totalAmount: validatedData.totalAmount,
          totalCount: validatedData.totalCount
        },
        update
      })
    }

    setOpenModalSetting(false)
  }

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault()
          setOpenModalSetting(true)
        }}
        className=" cursor-pointer focus:bg-hover-default focus:font-semibold px-[4px] py-[4px] rounded-[4px]"
        onClick={() => setOpenModalSetting(true)}
      >
        {t('general_bet_settings')}
      </DropdownMenuItem>
      <AlertDialog open={openModalSetting}>
        <AlertDialogContent className="p-0 rounded-[12px] w-[407px] h-[500px] bg-white flex flex-col gap-0">
          <header>
            <div className="flex p-[16px]">
              <div className="flex justify-between">
                <p className="text-xl font-semibold">{t('general_bet_settings')}</p>
                <button
                  className="absolute top-[6px] right-[6px] font-normal block w-9 h-9 leading-none  hover:bg-gray-200 hover:rounded-full"
                  onClick={() => setOpenModalSetting(false)}
                >
                  ✕
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-[24px] pt-3 flex flex-col">
            <div className="flex border-b border-border-default pb-3">
              <div className="font-medium w-[117px] leading-none">{t('bet_amount')}</div>
              <input
                className={`flex-1 bg-transparent border border-border-default rounded-lg py-[4px] pl-[14px] pr-[5px] focus:border-gray-500 
                          ${isTrialAccount ? 'cursor-not-allowed' : 'cursor-text'}`}
                type="number"
                id="quantity"
                min={'0'}
                pattern="[0-9]*"
                onKeyDown={(e) => {
                  if (['e', 'E', '+', ',', '-', '.'].includes(e.key)) {
                    e.preventDefault()
                  }
                  const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab']
                  if (!/^[0-9]$/.test(e.key) && !allowedKeys.includes(e.key)) {
                    e.preventDefault()
                  }
                }}
                name="quantity"
                step={1}
                disabled={isTrialAccount}
                value={betFixedAmountValue}
                onChange={(event) => {
                  const val = event.target.value
                  if (/^\d*$/.test(val)) {
                    setBetFixedAmountValue(val)
                  }
                }}
              />
            </div>
            <div className="flex-1 py-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-5">
                <p className="font-medium">{t('match_limit_all_accounts')}</p>
                <SwitchCustom checked={isSwitchOn} onCheckedChange={setIsSwitchOn} />
              </div>

              {/* Content */}
              <div className="flex flex-col h-full gap-7">
                {/* Limit Method */}
                <div>
                  <div className="text-sm font-semibold pb-2">{t('limit_method')}</div>
                  <RadioGroup
                    className="flex justify-center"
                    value={limitMethod || ''}
                    onValueChange={(value) => setLimitMethod(value)}
                    disabled={!isSwitchOn}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex">
                        <div className="flex w-[180px] items-center space-x-2">
                          <RadioGroupItem
                            value={LIMIT_METHOD.TEAM_NAME}
                            id={LIMIT_METHOD.TEAM_NAME}
                            disabled={!isSwitchOn}
                          />
                          <Label htmlFor={LIMIT_METHOD.TEAM_NAME} className="font-normal">
                            {t('team_name')}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={LIMIT_METHOD.TEAM_NAME_HANDICAP}
                            id={LIMIT_METHOD.TEAM_NAME_HANDICAP}
                            disabled={!isSwitchOn}
                          />
                          <Label htmlFor={LIMIT_METHOD.TEAM_NAME_HANDICAP} className="font-normal">
                            {t('team_name_handicap')}
                          </Label>
                        </div>
                      </div>

                      <div className="flex">
                        <div className="flex w-[180px] items-center space-x-2">
                          <RadioGroupItem
                            value={LIMIT_METHOD.NAME_BETTYPE_LIMIT}
                            id={LIMIT_METHOD.NAME_BETTYPE_LIMIT}
                            disabled={!isSwitchOn}
                          />
                          <Label htmlFor={LIMIT_METHOD.NAME_BETTYPE_LIMIT} className="font-normal">
                            {t('name_bettype_limit')}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={LIMIT_METHOD.NAME_TARGET_LIMIT}
                            id={LIMIT_METHOD.NAME_TARGET_LIMIT}
                            disabled={!isSwitchOn}
                          />
                          <Label htmlFor={LIMIT_METHOD.NAME_TARGET_LIMIT} className="font-normal">
                            {t('name_target_limit')}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Limit Type */}
                <div>
                  <div className="text-sm font-semibold pb-2">{t('limit_type')}</div>
                  <RadioGroup
                    className="flex"
                    value={limitType || ''}
                    onValueChange={(value) => setLimitType(value)}
                    disabled={!isSwitchOn}
                  >
                    <div className="flex flex-col gap-1">
                      {/* Total Amount */}
                      <div className="flex">
                        <div className="flex w-[180px] items-center space-x-2">
                          <RadioGroupItem
                            value={LIMIT_TYPE.TOTAL_AMOUNT}
                            id={LIMIT_TYPE.TOTAL_AMOUNT}
                            disabled={!isSwitchOn}
                          />
                          <Label htmlFor={LIMIT_TYPE.TOTAL_AMOUNT} className="font-normal">
                            {t('limit_by_total_amount')}
                          </Label>
                        </div>
                        <input
                          className={`outline-none w-[175px] bg-transparent border border-border-default rounded-lg py-[4px] pl-[14px] pr-[5px] focus:border-gray-500 ${
                            !isSwitchOn || limitType !== LIMIT_TYPE.TOTAL_AMOUNT
                              ? ''
                              : 'border-gray-500'
                          }`}
                          type="number"
                          id="InputLimitByTotalAmount"
                          value={formData.totalAmount}
                          onKeyDown={(e) => {
                            if (
                              !/[0-9]/.test(e.key) &&
                              e.key !== 'Backspace' &&
                              e.key !== 'Delete' &&
                              e.key !== 'ArrowLeft' &&
                              e.key !== 'ArrowRight'
                            ) {
                              e.preventDefault()
                            }
                          }}
                          onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                          disabled={!isSwitchOn || limitType !== LIMIT_TYPE.TOTAL_AMOUNT}
                          step={100}
                        />
                      </div>

                      {/* Total Count */}
                      <div className="flex">
                        <div className="flex w-[180px] items-center space-x-2">
                          <RadioGroupItem
                            value={LIMIT_TYPE.TOTAL_COUNT}
                            id={LIMIT_TYPE.TOTAL_COUNT}
                            disabled={!isSwitchOn}
                          />
                          <Label htmlFor={LIMIT_TYPE.TOTAL_COUNT} className="font-normal">
                            {t('limit_by_total_count')}
                          </Label>
                        </div>
                        <input
                          className={`outline-none w-[175px] bg-transparent border border-border-default rounded-lg py-[4px] pl-[14px] pr-[5px] focus:border-gray-500 ${
                            !isSwitchOn || limitType !== LIMIT_TYPE.TOTAL_COUNT
                              ? ''
                              : 'border-gray-500'
                          }`}
                          type="number"
                          id="InputLimitByTotalCount"
                          value={formData.totalCount}
                          onKeyDown={(e) => {
                            if (
                              !/[0-9]/.test(e.key) &&
                              e.key !== 'Backspace' &&
                              e.key !== 'Delete' &&
                              e.key !== 'ArrowLeft' &&
                              e.key !== 'ArrowRight'
                            ) {
                              e.preventDefault()
                            }
                          }}
                          onChange={(e) => handleInputChange('totalCount', e.target.value)}
                          disabled={!isSwitchOn || limitType !== LIMIT_TYPE.TOTAL_COUNT}
                        />
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </main>

          <footer className="flex gap-[12px] px-[24px] pb-[24px]">
            <button
              className="flex-1 outline-none border border-border-default hover:border-gray-700 block h-[40px] font-semibold rounded-[8px]"
              onClick={() => setOpenModalSetting(false)}
            >
              {t('cancel', { ns: 'layout' })}
            </button>
            <button
              className={`bg-brand-color text-white flex-1 border-none block h-[40px] font-semibold  hover:bg-opacity-90 rounded-[8px]`}
              onClick={handleSave}
            >
              {t('save', { ns: 'layout' })}
            </button>
          </footer>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
