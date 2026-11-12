import { BrowserWindow } from 'electron'

export function createPopupImage(announcementType: string, content: string, imageUrl?: string) {
  const popupWindow = new BrowserWindow({
    modal: true,
    width: announcementType === 'image' ? 670 : 380,
    height: announcementType === 'image' ? 950 : 180,
    show: true,
    resizable: false,
    autoHideMenuBar: true,
    center: true,
    title: 'Announcement',
    alwaysOnTop: true,
    icon: 'build/icon.png',
    webPreferences: {
      contextIsolation: true,
      sandbox: false
    }
  })

  let htmlContent = ''

  if (announcementType === 'image') {
    htmlContent = `
      <html>
        <head>
          <title>Announcement</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
            img {width: 100%; height: 100vh; }
          </style>
        </head>
        <body>
          <img src="${imageUrl}" alt="Popup Image" />
        </body>
      </html>
    `
  } else {
    htmlContent = `
      <html>
        <head>
          <title>Announcement</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #0C0E12; }
            .content { padding: 20px; font-size: 18px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="content">${content}</div>
        </body>
      </html>
    `
  }

  popupWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

  return popupWindow
}
