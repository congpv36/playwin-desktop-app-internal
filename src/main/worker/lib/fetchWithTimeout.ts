import fetch, { RequestInit, Response } from 'node-fetch'

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 15000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}
