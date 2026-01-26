
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { AppProviders } from './context/AppProviders.tsx'
import { AuthProvider } from './context/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>,
)
