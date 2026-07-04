import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider } from '@/context/AuthContext'
import { DataProvider } from '@/context/DataContext'
import { ToastProvider } from '@/context/ToastContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <HashRouter>
              <App />
            </HashRouter>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)
