import { RouterProvider } from 'react-router-dom'
import { useEffect } from 'react'
import { router } from '@routes/routes'
import { useAppDispatch } from '@core/hooks/useStore'
import { restoreSession, clearSession } from '@modules/auth/store/authSlice'
import { supabase } from '@core/config/supabaseClient'
import { loadFetchLabFromSupabase } from '@modules/fetchlab/store/fetchlabSlice'
import { fetchTasksFromSupabase } from '@modules/taskboard/store/taskboardSlice'
import { fetchNotesFromSupabase } from '@modules/notes/store/notesSlice'

function AppInner() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Restore session once on mount
    dispatch(restoreSession())

    // Listen for auth state changes (login from another tab, token expiry, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        dispatch(clearSession())
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        // Load all user data from Supabase after login / session restore
        dispatch(loadFetchLabFromSupabase())
        dispatch(fetchTasksFromSupabase())
        dispatch(fetchNotesFromSupabase())
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
