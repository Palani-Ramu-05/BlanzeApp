import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@modules/auth/store/authSlice'
import fetchlabReducer from '@modules/fetchlab/store/fetchlabSlice'
import vaultdropReducer from '@modules/vaultdrop/store/vaultdropSlice'
import taskboardReducer from '@modules/taskboard/store/taskboardSlice'
import notesReducer from '@modules/notes/store/notesSlice'
import webScraperReducer from '@modules/web-scraper/store/webscraperSlice'
import fileStudioReducer from '@modules/file-studio/store/fileStudioSlice'
import { aiWorkspaceReducer } from '@modules/ai-workspace/store/aiWorkspaceSlice'
import apiMockServerReducer from '@modules/api-mock-server/store/apiMockServerSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    fetchlab: fetchlabReducer,
    vaultdrop: vaultdropReducer,
    taskboard: taskboardReducer,
    notes: notesReducer,
    webScraper: webScraperReducer,
    fileStudio: fileStudioReducer,
    aiWorkspace: aiWorkspaceReducer,
    apiMockServer: apiMockServerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'fetchlab/sendRequest/fulfilled',
          'fileStudio/setResult',
          'fileStudio/addMultipleFile',
        ],
        ignoredPaths: [
          'fetchlab.currentRequest.formFiles',
          'fileStudio.result.blob',
          'fileStudio.multipleFiles',
        ],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
