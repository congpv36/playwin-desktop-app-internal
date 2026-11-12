import { AuthToken } from '@db/model'
import { AuthTokenType } from '@db/schema/authTokens'
import { BrowserWindow } from 'electron'

import { initSocket } from '@/browserWindows/service/socket'

export const refreshAccessToken = async (mainWindow?: BrowserWindow) => {
  const authToken = AuthToken.findAll()[0] as AuthTokenType

  const response = await fetch(`${import.meta.env.VITE_URL}/user/auth/refresh_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: authToken.refreshToken })
  })

  if (!response.ok) {
    throw new Error('Refresh token failed')
  }

  const jsonData = (await response.json()) as {
    data: { accessToken: string; refreshToken: string }
  }

  const newAccessToken = jsonData.data.accessToken
  const newRefreshToken = jsonData.data.refreshToken

  AuthToken.update(
    { id: authToken.id },
    { accessToken: newAccessToken, refreshToken: newRefreshToken }
  )

  if (mainWindow) {
    initSocket(newAccessToken, 'en', mainWindow)
  }

  return newAccessToken
}
