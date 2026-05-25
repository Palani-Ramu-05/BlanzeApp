import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthState, AuthUser, SignInDto, SignUpDto } from '../dto/types/auth.types'
import { authService } from '../services/auth.service'
import toast from 'react-hot-toast'

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  initializing: true,
  error: null,
}

// ── Async thunks ─────────────────────────────────────────────

export const restoreSession = createAsyncThunk('auth/restoreSession', async (_, { rejectWithValue }) => {
  try {
    return await authService.getSession()
  } catch {
    return rejectWithValue(null)
  }
})

export const signIn = createAsyncThunk('auth/signIn', async (dto: SignInDto, { rejectWithValue }) => {
  try {
    return await authService.signIn(dto)
  } catch (err: unknown) {
    return rejectWithValue((err as Error).message || 'Sign in failed')
  }
})

export const signUp = createAsyncThunk('auth/signUp', async (dto: SignUpDto, { rejectWithValue }) => {
  try {
    return await authService.signUp(dto)
  } catch (err: unknown) {
    return rejectWithValue((err as Error).message || 'Sign up failed')
  }
})

export const signOutThunk = createAsyncThunk('auth/signOut', async (_, { rejectWithValue }) => {
  try {
    await authService.signOut()
  } catch (err: unknown) {
    return rejectWithValue((err as Error).message)
  }
})

// ── Slice ────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthUser; token: string }>) {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      state.error = null
    },
    clearSession(state) {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.error = null
      state.initializing = false
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // restore session
    builder
      .addCase(restoreSession.pending, (state) => {
        state.initializing = true
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.initializing = false
        if (action.payload) {
          state.user = action.payload.user
          state.token = action.payload.token
          state.isAuthenticated = true
        }
      })
      .addCase(restoreSession.rejected, (state) => {
        state.initializing = false
      })

    // sign in
    builder
      .addCase(signIn.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        toast.success(`Welcome back, ${action.payload.user.name}!`)
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // sign up
    builder
      .addCase(signUp.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.emailConfirmationRequired) {
          // don't authenticate — user must confirm email
        } else {
          state.user = action.payload.user
          state.token = action.payload.token
          state.isAuthenticated = true
          toast.success(`Welcome, ${action.payload.user.name}!`)
        }
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // sign out
    builder
      .addCase(signOutThunk.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.error = null
        toast.success('Signed out successfully')
      })
  },
})

export const { setCredentials, clearSession, clearError } = authSlice.actions
// Keep 'logout' as an alias for clearSession for backward compatibility in SideNav
export const logout = clearSession
export default authSlice.reducer
