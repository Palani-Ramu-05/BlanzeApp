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
  deleting: false,
  selectedFileIds: [],
  pendingDeletion: [],
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

// Commits the actual deletion of the provided files to Supabase
export const commitPendingDeletion = createAsyncThunk(
  'vaultdrop/commitPendingDeletion',
  async (files: VaultFile[], { rejectWithValue }) => {
    if (!files.length) return []
    const errors: string[] = []
    for (const file of files) {
      try {
        await deleteFileService(file)
      } catch (err: unknown) {
        errors.push(`${file.file_name}: ${(err as Error).message}`)
      }
    }
    if (errors.length > 0) {
      return rejectWithValue({ errors: errors.join('\n'), files })
    }
    return files.map((f) => f.id)
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
    clearError(state) {
      state.error = null
    },

    // ── Selection ──
    toggleSelectFile(state, action: PayloadAction<string>) {
      const id = action.payload
      const idx = state.selectedFileIds.indexOf(id)
      if (idx >= 0) {
        state.selectedFileIds.splice(idx, 1)
      } else {
        state.selectedFileIds.push(id)
      }
    },
    selectAllFiles(state) {
      state.selectedFileIds = state.files.map((f) => f.id)
    },
    clearSelection(state) {
      state.selectedFileIds = []
    },

    // ── Soft delete / undo ──
    // Immediately hides files from UI; actual Supabase delete happens via commitPendingDeletion after 5s
    softDeleteFiles(state, action: PayloadAction<VaultFile[]>) {
      const ids = new Set(action.payload.map((f) => f.id))
      // Merge new files into pendingDeletion (avoid duplicates)
      const existingPendingIds = new Set(state.pendingDeletion.map((f) => f.id))
      const newPending = action.payload.filter((f) => !existingPendingIds.has(f.id))
      state.pendingDeletion = [...state.pendingDeletion, ...newPending]
      state.files = state.files.filter((f) => !ids.has(f.id))
      state.selectedFileIds = state.selectedFileIds.filter((id) => !ids.has(id))
    },
    // Restores all pending files back to the list
    restorePendingFiles(state) {
      const existingIds = new Set(state.files.map((f) => f.id))
      const toRestore = state.pendingDeletion.filter((f) => !existingIds.has(f.id))
      // Re-insert in original date order
      state.files = [...toRestore, ...state.files].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      state.pendingDeletion = []
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
        state.pendingDeletion = []
        state.selectedFileIds = []
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
      .addCase(commitPendingDeletion.pending, (state) => {
        state.deleting = true
      })
      .addCase(commitPendingDeletion.fulfilled, (state) => {
        state.deleting = false
        state.pendingDeletion = []
      })
      .addCase(commitPendingDeletion.rejected, (state, action) => {
        state.deleting = false
        // Restore files that failed to delete
        const payload = action.payload as { errors: string; files: VaultFile[] } | undefined
        if (payload?.files) {
          const existingIds = new Set(state.files.map((f) => f.id))
          const toRestore = payload.files.filter((f) => !existingIds.has(f.id))
          state.files = [...toRestore, ...state.files]
        }
        state.pendingDeletion = []
        toast.error('Some files could not be deleted. They have been restored.')
      })

    builder.addCase(downloadFile.rejected, (_state, action) => {
      toast.error((action.payload as string) || 'Download failed')
    })
  },
})

export const {
  setProgress,
  clearProgress,
  clearError,
  toggleSelectFile,
  selectAllFiles,
  clearSelection,
  softDeleteFiles,
  restorePendingFiles,
} = vaultDropSlice.actions

export default vaultDropSlice.reducer
