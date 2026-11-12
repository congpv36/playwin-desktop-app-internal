import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI & {
      onForceLogout: (callback: (event, data) => void) => void
      onRefreshToken: (callback: (event, data) => void) => void
      syncExpiredDate: (callback: (event, data) => void) => void
    }
  }
}
