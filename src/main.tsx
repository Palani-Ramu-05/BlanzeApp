import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { store } from '@core/store/redux/index'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1c2128',
            color: '#e6edf3',
            border: '1px solid #30363d',
            borderRadius: '10px',
            fontSize: '13px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#3fb950', secondary: '#1c2128' },
          },
          error: {
            iconTheme: { primary: '#f85149', secondary: '#1c2128' },
          },
        }}
      />
    </Provider>
  </StrictMode>,
)
