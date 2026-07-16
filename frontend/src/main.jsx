// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './app/App'
import { ImageRegionProvider } from './context/ImageRegionContext'
import './styles/globals.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ImageRegionProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ImageRegionProvider>
  </StrictMode>
)
