import { RouterProvider } from 'react-router-dom'
import { useEffect } from 'react'
import { router } from '@routes/routes'
import { useAppDispatch } from '@core/hooks/useStore'
import { restoreSession, clearSession, setCredentials } from '@modules/auth/store/authSlice'
import { supabase } from '@core/config/supabaseClient'
import type { User } from '@supabase/supabase-js'

function mapSupabaseUser(sbUser: User) {
  return {
    id: sbUser.id,
    name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'User',
    email: sbUser.email || '',
    avatar: sbUser.user_metadata?.avatar_url,
    role: 'user' as const,
    createdAt: sbUser.created_at || new Date().toISOString(),
  }
}

function AppInner() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(restoreSession())

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        dispatch(clearSession())
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        dispatch(setCredentials({
          user: mapSupabaseUser(session.user),
          token: session.access_token,
        }))
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
