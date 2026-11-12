import { useEffect, useState } from 'react'
import { TFunction } from 'i18next'

import { createEmptyAccountWithURL } from '@renderer/lib/createEmptyAccountWithURL'
import {
  getValidatedRandomDelayLoginSettings,
  getValidatedSwitchSettings
} from '@renderer/lib/getValidatedSwitchSettings'

import { AccountType, PlatformType, SportsBookType } from '@shared/common/types'

const isEmptyRow = (row?: AccountType) => !row?.loginID && !row?.password

export const useAccountRows = ({
  sportsBook,
  setOpenModalSetting,
  t
}: {
  sportsBook: SportsBookType
  setOpenModalSetting: (open: boolean) => void
  t: TFunction
}) => {
  const [data, setData] = useState<AccountType[]>([])
  const [platform, setDataPlatform] = useState<PlatformType>()
  const [switchSettings, setSwitchSettings] = useState({
    isSwitchBySuccessCount: 0,
    isSwitchByCredit: 0,
    minSuccessCount: '5',
    maxSuccessCount: '10',
    maxCredit: '50'
  })
  const [randomDelayLoginSettings, setRandomDelayLoginSettings] = useState({
    isRandomDelayLogin: 0,
    minDelayLogin: '1',
    maxDelayLogin: '10'
  })
  const [loginIDErrors, setLoginIDErrors] = useState<Record<number, string>>({})

  useEffect(() => {
    const fetch = async () => {
      const { listAccount, platform, switchSettings, randomDelayLoginSettings } =
        await window.electron.ipcRenderer.invoke('GetListAccountByPlatform', sportsBook.platform)

      setData([...listAccount, createEmptyAccountWithURL(platform)])
      setDataPlatform(platform)
      setSwitchSettings(switchSettings)
      setRandomDelayLoginSettings(randomDelayLoginSettings)
    }
    fetch()
  }, [])

  const checkDuplicateLoginID = (value: string, rowIndex: number) => {
    if (!value.trim()) return false
    return data.some((row, idx) => idx !== rowIndex && row.loginID === value)
  }

  const handleMoveUp = (index: number) => {
    setData((prev) => {
      if (index <= 0 || index >= prev.length) return prev
      if (index === prev.length - 1 && isEmptyRow(prev[index])) return prev

      const updated = [...prev]
      ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]

      const temp = updated[index].orderID
      updated[index].orderID = updated[index - 1].orderID
      updated[index - 1].orderID = temp

      return updated
    })
  }

  const handleMoveDown = (index: number) => {
    setData((prev) => {
      if (index >= prev.length - 1) return prev
      if (index + 1 === prev.length - 1 && isEmptyRow(prev[index + 1])) return prev

      const updated = [...prev]
      ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]

      const temp = updated[index].orderID
      updated[index].orderID = updated[index + 1].orderID
      updated[index + 1].orderID = temp

      return updated
    })
  }

  const handleMoveFinal = (index: number) => {
    setData((prev) => {
      if (index < 0 || index >= prev.length) return prev
      if (isEmptyRow(prev[index])) return prev

      const updated = [...prev]
      const [moved] = updated.splice(index, 1)

      const lastIndex = updated.length - 1
      const isLastEmptyRow = lastIndex >= 0 && isEmptyRow(updated[lastIndex])
      const insertIndex = isLastEmptyRow ? lastIndex : updated.length

      updated.splice(insertIndex, 0, moved)

      return updated.map((item, idx) => ({ ...item, orderID: idx + 1 }))
    })
  }

  const handleSaveAccountList = () => {
    const newErrors: Record<number, string> = {}
    data.forEach((row, index) => {
      if (checkDuplicateLoginID(row.loginID ?? '', index)) {
        newErrors[index] = t('this_account_already_exists')
      }
    })
    if (Object.keys(newErrors).length) {
      setLoginIDErrors(newErrors)
      return
    }

    const validScopes = ['OnlyLogin', 'Full', 'None']
    const listAccount = data
      .map((original) => {
        const trimmedOriginal = Object.fromEntries(
          Object.entries(original).map(([key, value]) =>
            typeof value === 'string' ? [key, value.trim()] : [key, value]
          )
        )

        if (!validScopes.includes(trimmedOriginal.proxyScope)) {
          trimmedOriginal.proxyScope = 'None'
        }
        return trimmedOriginal
      })
      .filter((item) => item.loginID && item.password)
      .map((item, index) => ({
        ...item,
        orderID: index + 1
      }))

    window.electron.ipcRenderer.send('SaveAccountListWindow', {
      platform: platform?.name,
      listAccount,
      switchSettings: getValidatedSwitchSettings(switchSettings),
      randomDelayLoginSettings: getValidatedRandomDelayLoginSettings(randomDelayLoginSettings)
    })
    setOpenModalSetting(false)
  }

  return {
    data,
    setData,
    platform,
    switchSettings,
    setSwitchSettings,
    randomDelayLoginSettings,
    setRandomDelayLoginSettings,
    loginIDErrors,
    setLoginIDErrors,
    checkDuplicateLoginID,
    handleMoveUp,
    handleMoveDown,
    handleMoveFinal,
    handleSaveAccountList
  }
}
