import { join } from 'path'

import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow } from 'electron'

export function createInitAppWindow() {
  const initAppWindow = new BrowserWindow({
    frame: false,
    transparent: true,
    width: 440,
    height: 236,
    show: false,
    autoHideMenuBar: true,
    center: true,
    resizable: false,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    trafficLightPosition: { x: 15, y: 10 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    initAppWindow.loadURL(
      `${process.env['ELECTRON_RENDERER_URL']}/#/initApp?version=${encodeURIComponent(`v${app.getVersion()}`)}`
    )
  } else {
    initAppWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: `initApp?version=${encodeURIComponent(`v${app.getVersion()}`)}`
    })
  }
  initAppWindow.webContents.once('did-finish-load', () => {
    initAppWindow.show()
  })

  return initAppWindow
}
