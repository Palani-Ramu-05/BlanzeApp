import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { VaultDropState, VaultFile, UploadProgress } from '../dto/types/vaultdrop.types'
import {
  fetchFiles as fetchFilesService,
  uploadFile as uploadFileService,
  deleteFile as deleteFileService,
  downloadFile as downloadFileService,
  validateFile,
} from '../services/vaultdrop.service'
import toast from 'react-hot-toast'

const initialState: VaultDropState = {
  files: [],
  loading: false,
  uploading: false,
  uploadProgress: [],
  error: null,
  deleteTarget: null,
  deleting: false,
}

// ── Thunks ──────────────────────────────────────────────────

export const loadFiles = createAsyncThunk(
  'vaultdrop/loadFiles',
  async (userId: string, { rejectWithValue }) => {
    try {
      return await fetchFilesService(userId)
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message)
    }
  },
)

export const uploadFiles = createAsyncThunk(
  'vaultdrop/uploadFiles',
  async ({ files, userId }: { files: File[]; userId: string }, { dispatch, rejectWithValue }) => {
    const results: VaultFile[] = []
    const errors: string[] = []

    for (const file of files) {
      const validation = validateFile(file)
      if (!validation.valid) {
        errors.push(validation.message)
        dispatch(
          vaultDropSlice.actions.setProgress({
            fileName: file.name,
            progress: 0,
            status: 'error',
            error: validation.message,
          }),
        )
        continue
      }

      dispatch(
        vaultDropSlice.actions.setProgress({ fileName: file.name, progress: 0, status: 'uploading' }),
      )

      try {
        const uploaded = await uploadFileService(file, userId, (pct) => {
          dispatch(
            vaultDropSlice.actions.setProgress({
              fileName: file.name,
              progress: pct,
              status: 'uploading',
            }),
          )
        })
        results.push(uploaded)
        dispatch(
          vaultDropSlice.actions.setProgress({ fileName: file.name, progress: 100, status: 'success' }),
        )
        toast.success(`"${file.name}" uploaded successfully`)
      } catch (err: unknown) {
        const msg = (err as Error).message
        errors.push(`${file.name}: ${msg}`)
        dispatch(
          vaultDropSlice.actions.setProgress({
            fileName: file.name,
            progress: 0,
            status: 'error',
            error: msg,
          }),
        )
        toast.error(`Failed to upload "${file.name}"`)
      }
    }

    if (errors.length > 0 && results.length === 0) {
      return rejectWithValue(errors.join('\n'))
    }
    return results
  },
)

export const deleteFile = createAsyncThunk(
  'vaultdrop/deleteFile',
  async (file: VaultFile, { rejectWithValue }) => {
    try {
      await deleteFileService(file)
      return file.id
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message)
    }
  },
)

export const downloadFile = createAsyncThunk(
  'vaultdrop/downloadFile',
  async (file: VaultFile, { rejectWithValue }) => {
    try {
      await downloadFileService(file)
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message)
    }
  },
)

// ── Slice ────────────────────────────────────────────────────

const vaultDropSlice = createSlice({
  name: 'vaultdrop',
  initialState,
  reducers: {
    setProgress(state, action: PayloadAction<UploadProgress>) {
      const idx = state.uploadProgress.findIndex((p) => p.fileName === action.payload.fileName)
      if (idx >= 0) {
        state.uploadProgress[idx] = action.payload
      } else {
        state.uploadProgress.push(action.payload)
      }
    },
    clearProgress(state) {
      state.uploadProgress = state.uploadProgress.filter((p) => p.status === 'uploading')
    },
    setDeleteTarget(state, action: PayloadAction<VaultFile | null>) {
      state.deleteTarget = action.payload
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadFiles.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadFiles.fulfilled, (state, action) => {
        state.loading = false
        state.files = action.payload
      })
      .addCase(loadFiles.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    builder
      .addCase(uploadFiles.pending, (state) => {
        state.uploading = true
      })
      .addCase(uploadFiles.fulfilled, (state, action) => {
        state.uploading = false
        if (action.payload) {
          state.files = [...action.payload, ...state.files]
        }
      })
      .addCase(uploadFiles.rejected, (state) => {
        state.uploading = false
      })

    builder
      .addCase(deleteFile.pending, (state) => {
        state.deleting = true
      })
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.deleting = false
        state.files = state.files.filter((f) => f.id !== action.payload)
        state.deleteTarget = null
        toast.success('File deleted successfully')
      })
      .addCase(deleteFile.rejected, (state, action) => {
        state.deleting = false
        toast.error((action.payload as string) || 'Delete failed')
      })

    builder
      .addCase(downloadFile.rejected, (_state, action) => {
        toast.error((action.payload as string) || 'Download failed')
      })
  },
})

export const { setProgress, clearProgress, setDeleteTarget, clearError } = vaultDropSlice.actions
export default vaultDropSlice.reducer
