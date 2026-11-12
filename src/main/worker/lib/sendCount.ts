import Model from '@db/model'
import { BrowserWindow } from 'electron'

export const sendCount = async (channel: string, model: Model, mainWindow: BrowserWindow) => {
  if (!mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, model.count())
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}
