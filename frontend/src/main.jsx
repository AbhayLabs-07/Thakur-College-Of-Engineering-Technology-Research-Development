import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { authStorage } from './utils/storage'

// Purge any contaminated cross-tab localStorage credentials from earlier sessions
authStorage.purgeLegacySharedStorage();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
