import React, { Fragment, useState } from 'react'

import { ConfirmLogOut } from '@renderer/components/Modal/ConfirmLogOut'

const AppTopBar: React.FC = () => {
  const [openConfirmLogOut, setOpenConfirmLogOut] = useState(false)
  const handleMinimize = () => window.electron.ipcRenderer.send('window-control', 'minimize')
  const handleMaximize = () => window.electron.ipcRenderer.send('window-control', 'maximize')

  const handleClose = () => {
    setOpenConfirmLogOut(true)
  }

  return (
    <Fragment>
      <div
        className="absolute top-0 right-0 w-full h-[32px] flex items-center py-[2px] pr-[1px] justify-end  select-none"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div
          className="flex items-center gap-2"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            className="w-8 h-8 flex items-center justify-center hover:bg-hover-default rounded"
            onClick={handleMinimize}
          >
            <span className="text-xs">–</span>
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center hover:bg-hover-default rounded"
            onClick={handleMaximize}
          >
            ☐
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center hover:bg-red-600  hover:text-white rounded"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>
      </div>
      <ConfirmLogOut
        openConfirmLogOut={openConfirmLogOut}
        setOpenConfirmLogOut={setOpenConfirmLogOut}
      />
    </Fragment>
  )
}

export default AppTopBar
