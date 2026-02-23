import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            fontFamily: 'DM Mono, monospace',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#5cfc8e', secondary: 'var(--bg)' } },
          error: { iconTheme: { primary: '#fc5c5c', secondary: 'var(--bg)' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
