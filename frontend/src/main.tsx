import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// self-hosted font (bundled by Vite): no request to Google's servers, which is a GDPR problem in Germany
import '@fontsource-variable/plus-jakarta-sans'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
