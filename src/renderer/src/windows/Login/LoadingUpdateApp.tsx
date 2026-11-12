import { useEffect, useState } from 'react'

const LoadingUpdateApp = () => {
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    window.electron.ipcRenderer.on('update-download-progress', (_, percent) => {
      setProgress(percent)
    })
    window.electron.ipcRenderer.on('update-downloaded', () => {
      setProgress(100)
      setIsComplete(true)
    })

    return () => {
      window.electron.ipcRenderer.removeAllListeners('update-download-progress')
    }
  }, [])

  return (
    <div className="fixed inset-0 h-full w-full bg-layout-color bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-gray-800 bg-opacity-60 h-full w-full shadow-2xl flex flex-col items-center justify-center">
        <p className="text-base font-semibold text-white mb-4 flex flex-col items-center text-center h-6 leading-none">
          {isComplete == false ? (
            <span>Downloading update... </span>
          ) : (
            <span>Update downloaded. App will restart shortly!</span>
          )}
        </p>

        <div className="w-2/3 h-6 bg-gray-700 overflow-hidden">
          <div
            className="bg-brand-color h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-xl font-bold text-white mt-1">{`${progress}%`}</p>
      </div>
    </div>
  )
}

export default LoadingUpdateApp
