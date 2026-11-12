import fetch from 'node-fetch'

export async function fetchWithRetry(
  url: string,
  options,
  retries: number = 3,
  timeout: number = 10000
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      try {
        const data = await response.json()
        return data
      } catch (jsonError) {
        throw new Error('Invalid JSON response')
      }
    } catch (error) {
      if (attempt === retries) {
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }
}
