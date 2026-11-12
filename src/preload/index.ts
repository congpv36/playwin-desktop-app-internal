import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

if (!process.contextIsolated) {
  throw new Error('Context Isolation must be enabled in the BrowserWindow')
}

try {
  contextBridge.exposeInMainWorld('electron', {
    ...electronAPI,
    onForceLogout: (callback: (event, data) => void) => {
      ipcRenderer.on('LoggedOutByServer', callback)
    },
    onRefreshToken: (callback: (event, data) => void) => {
      ipcRenderer.on('onRefreshTokenByServer', callback)
    },
    syncExpiredDate: (callback: (event, data) => void) => {
      ipcRenderer.on('synExpiredDateByServer', callback)
    }
  })
} catch (error) {
  console.error('Failed to expose electron API in the main world:', error)
}
