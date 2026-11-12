import { useEffect, useMemo, useState } from 'react'

import InformationCircle from '@renderer/icons/information-circle'

import { PlatformType } from '@shared/common/types'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

export default function ListPlatform() {
  const [searchTerm, setSearchTerm] = useState('')
  const [notification, setNotification] = useState<boolean>(false)
  const [listPlatForm, setListPlatForm] = useState<PlatformType[]>([])
  const [platForm, setPlatForm] = useState<PlatformType>()

  useEffect(() => {
    const fetchData = async () => {
      const data = await window.electron.ipcRenderer.invoke('GetListPlatform')
      setListPlatForm(data)
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
    const checkPlatform = await window.electron.ipcRenderer.invoke('AddPlatForm', platform)
    if (checkPlatform === 1) {
      setNotification(true)
      setPlatForm(platform)
    }
  }

  return (
    <div className="bg h-full">
      <div className="h-full py-1 flex flex-col gap-1">
        <div className="flex items-center ">
          <p className="mx-1.5">URL to search</p>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search URL"
            className="h-7 w-1/2 bg-white border border-gray-400 focus-visible:ring-blue-500 focus:outline-none pl-2"
          />
        </div>
        <div className="flex-1 border border-zinc-500 bg-white">
          <table className="w-full">
            <thead>
              <tr>
                <th className="border border-gray-500 text-start pl-2 ">URL</th>
                <th className="border border-gray-500 text-start pl-2 ">Platform</th>
                <th className="border border-gray-500 text-start pl-2 ">Add</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((platform) => (
                <tr key={platform.id}>
                  <td className="border border-gray-500 text-start pl-1.5 hover:bg-blue-500 hover:text-white transition duration-300">
                    {platform.url}
                  </td>
                  <td className="border border-gray-500 text-start pl-1.5 hover:bg-blue-500 hover:text-white transition duration-300">
                    {platform.name}
                  </td>
                  <td
                    className={`border border-gray-500 text-start pl-1.5 underline transition duration-300 text-blue-color cursor-pointer hover:bg-blue-500 hover:text-white
                    `}
                    title={platform.name === 'Sbobet' ? 'Không áp dụng cho Sbobet' : ''}
                    onClick={() => {
                      addInfoWeb(platform)
                    }}
                  >
                    Add
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={notification} onOpenChange={setNotification}>
        <AlertDialogContent className="gap-0 p-0 w-64 h-[150px]  border-gray-400 shadow-[0px_4px_16px_rgba(17,17,26,0.1),_0px_8px_24px_rgba(17,17,26,0.1),_0px_16px_56px_rgba(17,17,26,0.1)]">
          <AlertDialogHeader className="flex-1">
            <AlertDialogTitle className=" flex justify-between p-2 bg-blue-50 text-sm rounded-t-lg  ">
              Message
            </AlertDialogTitle>
            <AlertDialogDescription className="flex-1 flex justify-center items-center py-2">
              <InformationCircle className="text-blue-500 size-12 mr-1" />
              <span className="text-black text-sm font-medium">
                {platForm?.name} already added!
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="rounded-b-lg bg-gray-100 items-center flex justify-end pr-4">
            <button
              className="h-6 w-20 bg-white text-black font-semibold rounded border border-blue-400 hover:bg-blue-50 "
              onClick={() => setNotification(false)}
            >
              OK
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
