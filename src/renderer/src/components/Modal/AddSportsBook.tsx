import { Fragment, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { AlertDialog, AlertDialogContent } from '@renderer/components/ui/alert-dialog'
import BookOpenBorder from '@renderer/icons/book-open-border'
import InformationCircle from '@renderer/icons/information-circle'
import SearchLg from '@renderer/icons/search-lg'

import { isAllowedPlatform } from '@shared/common/constants'
import { PlatformType } from '@shared/common/types'

export default function AddSportsBookModal({ openAddSportsBook, setOpenAddSportsBook }) {
  const { t: tMain } = useTranslation('main')
  const { t: tLayout } = useTranslation('layout')

  const profile = localStorage.getItem('profile')
  const isTrialAccount = profile ? JSON.parse(profile)?.isTrialAccount : false

  const { id: activeId } = useParams()

  const [searchTerm, setSearchTerm] = useState('')
  const [notification, setNotification] = useState<boolean>(false)
  const [listPlatForm, setListPlatForm] = useState<PlatformType[]>([])
  const [platForm, setPlatForm] = useState<PlatformType>()

  useEffect(() => {
    const fetchData = async () => {
      const data = await window.electron.ipcRenderer.invoke('GetListPlatform')
      setListPlatForm(data.filter((item) => isAllowedPlatform(item.name)))
    }

    fetchData()

    return () => {
      window.electron.ipcRenderer.removeAllListeners('GetListPlatform')
    }
  }, [])

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const filteredData = useMemo(
    () =>
      listPlatForm.filter((item) => {
        const cleanedUrl = item.url.replace(/^https?:\/\//, '').toLowerCase()
        return cleanedUrl.includes(searchTerm.toLowerCase())
      }),
    [listPlatForm, searchTerm]
  )

  const addInfoWeb = async (platform: PlatformType) => {
    const checkPlatform = await window.electron.ipcRenderer.invoke('AddPlatForm', {
      isTrialAccount,
      activeSportsBook: activeId,
      platform
    })
    if (checkPlatform === 1) {
      setNotification(true)
      setPlatForm(platform)
    }
  }

  return (
    <Fragment>
      <AlertDialog open={openAddSportsBook} onOpenChange={setOpenAddSportsBook}>
        <AlertDialogContent className="p-0 rounded-[12px] h-4/6 w-6/12 min-w-[310px] min-h-[300px] border-border-default bg-white flex flex-col gap-0">
          <header>
            <div className="flex p-[18px]">
              <BookOpenBorder />
              <div className="ml-[16px] flex flex-col">
                <div className="flex justify-between">
                  <p className="text-lg font-semibold">{tMain('add_sports_book')}</p>
                  <button
                    className="absolute top-[6px] right-[6px] font-normal block w-9 h-9 leading-none  hover:bg-gray-200 hover:rounded-full"
                    onClick={() => setOpenAddSportsBook(false)}
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm">{tMain('note_add_sports_book')}</p>
              </div>
            </div>
            <div className="bg-hover-default h-[45px] flex items-center justify-end px-[24px]">
              <div className="relative">
                <span className="absolute top-[9px] left-[12px]">
                  <SearchLg />
                </span>
                <input
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder={tMain('search')}
                  className="h-[35px] w-[280px] bg-white border border-border-default rounded-[8px] pl-9 pr-3 placeholder-gray-400"
                />
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-scroll">
            <table className="w-full">
              <thead>
                <tr className="text-sm">
                  <th className="border-b border-border-default text-start font-semibold py-[8px] pl-[24px]">
                    {tMain('platform')}
                  </th>
                  <th className="border-b border-border-default text-start font-semibold py-[8px] pl-[24px]">
                    {tMain('url')}
                  </th>
                  <th className="border-b border-border-default text-start py-[8px] pl-[24px]" />
                </tr>
              </thead>
              <tbody>
                {filteredData.map((platform) => (
                  <tr key={platform.id} className="hover:bg-hover-default ">
                    <td className="border-b border-border-default text-start transition duration-300  text-sm font-medium py-[8px] pl-[24px]">
                      {platform.name}
                    </td>
                    <td className="border-b border-border-default text-start transition duration-300 text-sm font-normal">
                      {platform.url}
                    </td>
                    <td
                      className="border-b border-border-default text-center transition duration-300 text-sm font-semibold hover:underline decoration-blue-color cursor-pointer"
                      onClick={() => {
                        addInfoWeb(platform)
                      }}
                    >
                      {tMain('add')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </main>
          <footer className="flex gap-[12px] justify-end px-[24px] py-[16px]">
            <button
              className={`bg-brand-color text-white text-sm border-none block w-[80px] h-[40px] font-semibold  hover:bg-opacity-90 rounded-[8px]`}
              onClick={() => setOpenAddSportsBook(false)}
            >
              {tMain('exit')}
            </button>
          </footer>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={notification} onOpenChange={setNotification}>
        <AlertDialogContent className="gap-0 p-0 w-72 h-[150px]">
          <header className="flex-1 p-2 text-sm font-medium">
            <span>{tLayout('message')}</span>
            <button
              className="absolute top-[2px] right-[2px] font-normal block w-9 h-9 leading-none  hover:bg-gray-200 hover:rounded-full"
              onClick={() => setNotification(false)}
            >
              ✕
            </button>
          </header>
          <main className="flex-1 flex justify-center items-center pb-2">
            <InformationCircle className="text-brand-color size-8 mr-1" />
            <span className="text-sm ">
              {platForm?.name} {tLayout('already_added')}
            </span>
          </main>
          <footer className="rounded-b-lg items-center flex justify-end pr-4 pb-2">
            <button
              className="bg-brand-color h-[30px] w-[100px] font-semibold text-xs rounded-[6px] border-none hover:bg-opacity-90 text-white"
              onClick={() => setNotification(false)}
            >
              {tLayout('ok')}
            </button>
          </footer>
        </AlertDialogContent>
      </AlertDialog>
    </Fragment>
  )
}
