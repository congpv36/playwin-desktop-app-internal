import { useEffect, useState } from 'react'

export default function InitApp() {
  const params = new URLSearchParams(window.location.hash.split('?')[1])
  const versionLatest = params.get('version')
  const currentYear = new Date().getFullYear()

  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 1 : 100))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    window.electron.ipcRenderer.on('init-app-done', () => {
      setProgress(100)
    })
    localStorage.setItem('version', versionLatest as string)
    return () => window.electron.ipcRenderer.removeAllListeners('init-app-done')
  }, [])

  return (
    <div className="h-full flex flex-col items-center border border-border-default bg-white">
      <div className="flex-1 pt-[64px] w-full px-[40px]">
        <div className="flex justify-center mb-[40px]">
          <img src="images/logo-app.png" alt="LogoLogin" className="cursor-pointer" />
        </div>
        <div className="flex flex-col items-center mt-8 w-full ">
          <div className="w-full h-2 bg-[#E9EAEB] rounded-full overflow-hidden mb-2">
            <div
              className="bg-brand-color h-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm ">Loading...</p>
        </div>
      </div>
      <div className="text-xs text-[#94979C] px-[16px] py-[4px]">
        Version {versionLatest} {import.meta.env.VITE_APP_DISPLAY_NAME} Internal © {currentYear}
      </div>
    </div>
  )
}
