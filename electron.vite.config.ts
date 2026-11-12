import { resolve } from 'path'

import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { loadEnv } from 'vite'

// Cong dev rieng (app chinh dung 5174) de co the chay dev song song 2 app
const devPort = Number(loadEnv('', process.cwd(), 'VITE_').VITE_DEV_PORT) || 5175

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@/utils': resolve('src/main/utils'),
        '@shared': resolve('src/shared'),
        '@/browserWindows': resolve('src/main/browserWindows'),
        '@/worker': resolve('src/main/worker'),
        '@config': resolve('src/config'),
        '@db': resolve('src/db')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    assetsInclude: 'src/renderer/assets/**',
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared'),
        '@/hooks': resolve('src/renderer/src/hooks'),
        '@/assets': resolve('src/renderer/src/assets'),
        '@/store': resolve('src/renderer/src/store'),
        '@/components': resolve('src/renderer/src/components'),
        '@/lib': resolve('src/renderer/src/lib')
      }
    },
    plugins: [react()],
    server: {
      port: devPort,
      strictPort: true,
      host: true
    },
    optimizeDeps: {
      exclude: [
        'node_modules/.cache',
        'chunk-MTDYGCFE.js',
        'chunk-KFEKTWHE.js',
        'chunk-T62427UU.js',
        'chunk-EB56G645.js',
        'chunk-CXVDXNMW.js',
        'chunk-NE2IJQC7.js',
        'chunk-3OL7OPAJ.js'
      ]
    }
  }
})
