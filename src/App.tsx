import { RouterProvider } from 'react-router-dom'
import { useEffect } from 'react'
import { router } from '@routes/routes'
import { useAppDispatch } from '@core/hooks/useStore'
import { restoreSession, clearSession } from '@modules/auth/store/authSlice'
import { supabase } from '@core/config/supabaseClient'

function AppInner() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Restore session once on mount
    dispatch(restoreSession())

    // Listen for auth state changes (login from another tab, token expiry, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        dispatch(clearSession())
      }
    })

    return () => subscription.unsubscribe()
  }, [dispatch])

  return <RouterProvider router={router} />
}

function App() {
  return <AppInner />
}

export default App
