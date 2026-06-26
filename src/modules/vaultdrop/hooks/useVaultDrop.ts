import { useCallback, useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import {
  loadFiles,
  uploadFiles,
  downloadFile,
  commitPendingDeletion,
  softDeleteFiles,
  restorePendingFiles,
  toggleSelectFile,
  selectAllFiles,
  clearSelection,
  clearProgress,
} from '../store/vaultdropSlice'
import type { VaultFile } from '../dto/types/vaultdrop.types'
import { downloadFile as downloadFileService } from '../services/vaultdrop.service'

const UNDO_WINDOW_MS = 5000

export const useVaultDrop = () => {
  const dispatch = useAppDispatch()
  const vaultdrop = useAppSelector((s) => s.vaultdrop)
  const user = useAppSelector((s) => s.auth.user)

  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Keep a live ref to the latest pendingDeletion so the timer callback always sees fresh data
  const pendingDeletionRef = useRef<VaultFile[]>(vaultdrop.pendingDeletion)
  useEffect(() => {
    pendingDeletionRef.current = vaultdrop.pendingDeletion
  }, [vaultdrop.pendingDeletion])

  // On unmount: commit any pending deletions immediately (user navigated away)
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
      if (pendingDeletionRef.current.length > 0) {
        dispatch(commitPendingDeletion(pendingDeletionRef.current))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLoad = useCallback(() => {
    if (user?.id) dispatch(loadFiles(user.id))
  }, [dispatch, user?.id])

  const handleUpload = useCallback(
    (files: File[]) => {
      if (!user?.id) return
      dispatch(uploadFiles({ files, userId: user.id }))
    },
    [dispatch, user?.id],
  )

  // Soft-deletes files: removes from UI instantly, schedules real delete after 5s
  const handleSoftDelete = useCallback(
    (files: VaultFile[]) => {
      if (!files.length) return
      // Clear existing timer so each new delete extends the window
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
      dispatch(softDeleteFiles(files))

      undoTimerRef.current = setTimeout(() => {
        undoTimerRef.current = null
        dispatch(commitPendingDeletion(pendingDeletionRef.current))
      }, UNDO_WINDOW_MS)
    },
    [dispatch],
  )

  // Cancels the pending deletion and restores files to the list
  const handleUndo = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }
    dispatch(restorePendingFiles())
  }, [dispatch])

  const handleDelete = useCallback(
    (file: VaultFile) => handleSoftDelete([file]),
    [handleSoftDelete],
  )

  const handleBulkDelete = useCallback(() => {
    const selected = vaultdrop.files.filter((f) => vaultdrop.selectedFileIds.includes(f.id))
    if (selected.length) handleSoftDelete(selected)
  }, [vaultdrop.files, vaultdrop.selectedFileIds, handleSoftDelete])

  const handleDownload = useCallback(
    (file: VaultFile) => dispatch(downloadFile(file)),
    [dispatch],
  )

  const handleBulkDownload = useCallback(async () => {
    const selected = vaultdrop.files.filter((f) => vaultdrop.selectedFileIds.includes(f.id))
    for (const file of selected) {
      await downloadFileService(file)
    }
  }, [vaultdrop.files, vaultdrop.selectedFileIds])

  const handleToggleSelect = useCallback(
    (id: string) => dispatch(toggleSelectFile(id)),
    [dispatch],
  )

  const handleSelectAll = useCallback(
    () => dispatch(selectAllFiles()),
    [dispatch],
  )

  const handleClearSelection = useCallback(
    () => dispatch(clearSelection()),
    [dispatch],
  )

  const handleClearProgress = useCallback(() => dispatch(clearProgress()), [dispatch])

  return {
    ...vaultdrop,
    handleLoad,
    handleUpload,
    handleDelete,
    handleSoftDelete,
    handleUndo,
    handleBulkDelete,
    handleDownload,
    handleBulkDownload,
    handleToggleSelect,
    handleSelectAll,
    handleClearSelection,
    handleClearProgress,
  }
}
