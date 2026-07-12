import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { FileDetails } from '../dto/common'
import { UploadStatus } from '../dto/common'

interface ResultState {
  blob: Blob | null
  filename: string | null
  mimeType: string | null
  previewUrl: string | null
}

interface FileStudioState {
  activeTool: string | null
  uploadStatus: UploadStatus
  result: ResultState
  errorMessage: string | null
  errorCode: string | null
  multipleFiles: File[]
}

const initialResult: ResultState = {
  blob: null,
  filename: null,
  mimeType: null,
  previewUrl: null,
}

const initialState: FileStudioState = {
  activeTool: null,
  uploadStatus: UploadStatus.Idle,
  result: { ...initialResult },
  errorMessage: null,
  errorCode: null,
  multipleFiles: [],
}

const fileStudioSlice = createSlice({
  name: 'fileStudio',
  initialState,
  reducers: {
    setActiveTool(state, action: PayloadAction<string>) {
      if (state.activeTool && state.activeTool !== action.payload) {
        state.uploadStatus = UploadStatus.Idle
        state.result = { ...initialResult }
        state.errorMessage = null
        state.errorCode = null
        state.multipleFiles = []
      }
      state.activeTool = action.payload
    },

    setUploadStatus(state, action: PayloadAction<UploadStatus>) {
      state.uploadStatus = action.payload
    },

    setResult(state, action: PayloadAction<ResultState>) {
      state.result = action.payload
    },

    setError(state, action: PayloadAction<{ code: string; message: string }>) {
      state.uploadStatus = UploadStatus.Error
      state.errorCode = action.payload.code
      state.errorMessage = action.payload.message
    },

    clearError(state) {
      state.errorMessage = null
      state.errorCode = null
      if (state.uploadStatus === UploadStatus.Error) {
        state.uploadStatus = UploadStatus.Idle
      }
    },

    addMultipleFile(state, action: PayloadAction<File>) {
      state.multipleFiles.push(action.payload)
    },

    removeMultipleFile(state, action: PayloadAction<number>) {
      state.multipleFiles.splice(action.payload, 1)
    },

    clearMultipleFiles(state) {
      state.multipleFiles = []
    },

    resetAll(state) {
      Object.assign(state, initialState)
    },
  },
})

export const {
  setActiveTool,
  setUploadStatus,
  setResult,
  setError,
  clearError,
  addMultipleFile,
  removeMultipleFile,
  clearMultipleFiles,
  resetAll,
} = fileStudioSlice.actions

export default fileStudioSlice.reducer
