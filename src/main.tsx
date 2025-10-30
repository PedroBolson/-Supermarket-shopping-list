import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { initializeAppCheckIfEnabled } from './config/appcheck'

initializeAppCheckIfEnabled()

registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('Aplicativo pronto para uso offline')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
