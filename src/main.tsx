import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { store } from '@core/store/redux/index'
import { ThemeProvider } from '@core/contexts/ThemeContext'
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ThemeProvider>
          <App />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'rgb(var(--surface-800))',
                color: 'rgb(var(--color-text-primary))',
                border: '1px solid rgb(var(--surface-600))',
                borderRadius: '10px',
                fontSize: '13px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: { primary: '#3fb950', secondary: 'rgb(var(--surface-800))' },
              },
              error: {
                iconTheme: { primary: '#f85149', secondary: 'rgb(var(--surface-800))' },
              },
            }}
          />
        </ThemeProvider>
      </Provider>
    </QueryClientProvider>
  </StrictMode>,
)
