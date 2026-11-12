import { BrowserWindow } from 'electron'
import { io, Socket } from 'socket.io-client'

import {
  AutoMappingUpdatedData,
  handleAutoMappingUpdated
} from '@/browserWindows/service/handleAutoMappingUpdated'

let socket: Socket
let reconnectAttempts = 0
let reconnectInterval: NodeJS.Timeout | null = null
let connectErrorRetryCount = 0
let connectErrorRetryInterval: NodeJS.Timeout | null = null
const MAX_CONNECT_ERROR_RETRY_MINUTES = 5
const RETRY_INTERVAL_MS = 5000

export function initSocket(token: string, lang: string = 'en', win: BrowserWindow): Socket {
  socket = io(import.meta.env.VITE_URL_SOCKET, {
    withCredentials: true,
    auth: { token, lang },
    transports: ['websocket'],
    reconnection: false
  })

  socket.on('connect', () => {
    console.log('Connected to socket server.')
    reconnectAttempts = 0
    if (reconnectInterval) {
      clearInterval(reconnectInterval)
      reconnectInterval = null
    }
    // reset connect_error retry
    connectErrorRetryCount = 0
    if (connectErrorRetryInterval) {
      clearInterval(connectErrorRetryInterval)
      connectErrorRetryInterval = null
    }
  })

  socket.on('pong', (data) => {
    console.log('Socket.on ~ data:', data)
  })

  socket.on('disconnect', (reason) => {
    console.warn('Disconnected. Reason:', reason)

    if (!reconnectInterval) {
      reconnectInterval = setInterval(() => {
        if (reconnectAttempts < 5) {
          reconnectAttempts++
          console.log(`Reconnecting attempt ${reconnectAttempts}/5...`)
          socket.connect()
        } else {
          clearInterval(reconnectInterval!)
          reconnectInterval = null
          win.webContents.send('LoggedOutByServer', reason)
        }
      }, 60000)
    }
  })

  socket.on('connect_error', (_err) => {
    // Retry connect every 5 seconds, stop after 3 minutes
    if (!connectErrorRetryInterval) {
      connectErrorRetryCount = 0
      connectErrorRetryInterval = setInterval(() => {
        connectErrorRetryCount++
        const maxTries = Math.floor(
          (MAX_CONNECT_ERROR_RETRY_MINUTES * 60 * 1000) / RETRY_INTERVAL_MS
        )
        if (connectErrorRetryCount > maxTries) {
          clearInterval(connectErrorRetryInterval!)
          connectErrorRetryInterval = null

          win.webContents.send('LoggedOutByServer', {
            message: 'Could not reconnect after 3 minutes.'
          })
          return
        }
        console.log(`🔄 connect_error retry attempt ${connectErrorRetryCount}/${maxTries}`)
        socket.connect()
      }, RETRY_INTERVAL_MS)
    }
  })

  socket.on('force_logout', (data) => {
    console.log('Socket.onforce_logout ~ data:', data)
    win.webContents.send('LoggedOutByServer', data)
  })

  socket.on('auto_mapping_updated', (data: AutoMappingUpdatedData) => {
    handleAutoMappingUpdated(data)
  })

  socket.on('error', (data) => {
    if (data.statusCode === 401) {
      if (data.action === 'logout') {
        data.message = 'Session expired. Please login again.'
        win.webContents.send('LoggedOutByServer', data)
      } else if (data.action === 'refresh_token') {
        win.webContents.send('onRefreshToken')
      }
    }
  })
  socket.on('sync_expired_date', (data) => {
    win.webContents.send('synExpiredDateByServer', data)
  })
  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function pingSocket() {
  if (socket && socket.connected) {
    socket.emit('ping')
    console.log('Ping sent!')
  }
}
