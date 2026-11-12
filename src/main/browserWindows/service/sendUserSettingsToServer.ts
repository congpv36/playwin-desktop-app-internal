import { handleCollectUserSettingOnApp } from '@/browserWindows/service/collectUserSettingOnApp'
import { refreshAccessToken } from '@/browserWindows/service/refreshAccessToken'

export async function sendUserSettingsToServer() {
  try {
    const arraySaveBe = handleCollectUserSettingOnApp()
    const newAccessToken = await refreshAccessToken()

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${newAccessToken}`
    }

    const response = await fetch(`${import.meta.env.VITE_URL}/user/users/setting`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(arraySaveBe)
    })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      console.error('Update user setting error:', error.message)
    }
    throw error
  }
}
