/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_KEY: string
  readonly VITE_BUILD_TARGET: string
  readonly VITE_APP_DISPLAY_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
