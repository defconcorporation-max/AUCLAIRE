import './i18n'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { AppProviders } from './context/AppProviders.tsx'
import { AuthProvider } from './context/AuthContext.tsx'

// Intercept Supabase Auth recovery tokens BEFORE React Router erases them
if (window.location.hash.includes('type=recovery') && !window.location.pathname.includes('/login')) {
    const hash = window.location.hash;
    window.location.replace('/login?mode=update-password' + hash);
}

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
