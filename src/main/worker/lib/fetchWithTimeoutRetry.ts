import fetch, { RequestInit, Response } from 'node-fetch'

export async function fetchWithTimeoutRetry(
  url: string,
  options: RequestInit = {},
  retries: number = 3,
  timeout: number = 15000
): Promise<Response> {
  let lastError: unknown

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      return await fetch(url, { ...options, signal: controller.signal })
    } catch (error) {
      lastError = error

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  throw lastError
}

export async function fetchJsonWithTimeoutRetry<T>(
  url: string,
  options: RequestInit = {},
  retries: number = 3,
  timeout: number = 15000
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const res = await fetch(url, { ...options, signal: controller.signal })

      if (!res.ok) {
        throw new Error(`Request failed ${res.status}`)
      }

      return (await res.json()) as T
    } catch (error) {
      lastError = error

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  throw lastError
}
