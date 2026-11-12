import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import CheckboxField from '@renderer/components/SportsBook/CheckboxField'

import { PlatformUrlType } from '@shared/common/types'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const OptionsUrl = ({ sportsBook }) => {
  const { id: sportsBookId } = useParams()

  const { t } = useTranslation(['main', 'layout'])

  const [urls, setUrls] = useState<PlatformUrlType[]>([])
  const [value, setValue] = useState<string | undefined>(undefined)
  const [selectedUrl, setSelectedUrl] = useState<PlatformUrlType | null>(null)
  const [lockUrl, setLockUrl] = useState<number | undefined>(undefined)

  const handleCheckboxChange = useCallback(() => {
    setLockUrl((prev) => {
      const newValue = prev === 1 ? 0 : 1

      window.electron.ipcRenderer.send('Update_LockURL', {
        platformName: sportsBook.platform,
        lockURL: newValue,
        sportsBookId
      })

      return newValue
    })
  }, [])

  useEffect(() => {
    const getUrl = async () => {
      const urls = await window.electron.ipcRenderer.invoke('GetUrl', sportsBook.platform)
      setUrls(urls)
    }

    getUrl()
  }, [sportsBook.platform])

  useEffect(() => {
    setValue(sportsBook.url)
    setLockUrl(sportsBook.lockURL)
  }, [sportsBook])

  useEffect(() => {
    if (selectedUrl) {
      window.electron.ipcRenderer.send('UpdateUrlPlatform', {
        platformName: sportsBook.platform,
        selectedUrl: selectedUrl.url,
        sportsBookId
      })
    }
  }, [selectedUrl, sportsBookId])

  return (
    <div className="flex">
      <Select
        value={value}
        onValueChange={(val) => {
          const selected = urls.find((u) => u.url === val) ?? null

          setValue(val)
          setSelectedUrl(selected)
        }}
      >
        <SelectTrigger className="min-w-60 max-w-60 min-h-[25px] max-h-[25px] pl-[4px] pr-[4px] text-xs border-border-default bg-white ">
          <span className="block truncate ">
            <SelectValue placeholder={String(sportsBook.url)} className="" />
          </span>
        </SelectTrigger>

        <SelectContent className="max-h-60 overflow-y-auto border-border-default">
          <SelectGroup className="bg-white ">
            {urls.map((url) => (
              <SelectItem key={url.id} value={url.url} className="py-[1px] text-[12px]">
                {url.url}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <CheckboxField
        key="checkbox_lockUrl"
        id={`${sportsBook.platform}_checkbox_LockURL`}
        label={t('lock_Url')}
        checked={lockUrl === 1}
        className="ml-2 text-xs font-semibold pr-1"
        onChange={handleCheckboxChange}
      />
    </div>
  )
}

export default OptionsUrl
