export function ensureTrailingSlash(url: string) {
  return url.endsWith('/') ? url : `${url}/`
}
