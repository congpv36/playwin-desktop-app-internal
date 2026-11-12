import ReactDOM from 'react-dom/client'

import { CountProvider } from '@renderer/context/CountContext'
import { SidebarProvider } from '@renderer/context/SidebarContext'

import App from './App'

import './assets/index.css'

import './i18n/i18n'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <SidebarProvider>
    <CountProvider>
      <App />
    </CountProvider>
  </SidebarProvider>
)
