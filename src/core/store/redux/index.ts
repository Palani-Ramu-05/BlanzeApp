import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@modules/auth/store/authSlice'
import fetchlabReducer from '@modules/fetchlab/store/fetchlabSlice'
import vaultdropReducer from '@modules/vaultdrop/store/vaultdropSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    fetchlab: fetchlabReducer,
    vaultdrop: vaultdropReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['fetchlab/sendRequest/fulfilled'],
        ignoredPaths: ['fetchlab.currentRequest.formFiles'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
