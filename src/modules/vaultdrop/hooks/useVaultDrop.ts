import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import {
  loadFiles,
  uploadFiles,
  deleteFile,
  downloadFile,
  setDeleteTarget,
  clearProgress,
} from '../store/vaultdropSlice'
import type { VaultFile } from '../dto/types/vaultdrop.types'

export const useVaultDrop = () => {
  const dispatch = useAppDispatch()
  const vaultdrop = useAppSelector((s) => s.vaultdrop)
  const user = useAppSelector((s) => s.auth.user)

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

  const handleDelete = useCallback(
    (file: VaultFile) => dispatch(setDeleteTarget(file)),
    [dispatch],
  )

  const confirmDelete = useCallback(() => {
    if (vaultdrop.deleteTarget) dispatch(deleteFile(vaultdrop.deleteTarget))
  }, [dispatch, vaultdrop.deleteTarget])

  const cancelDelete = useCallback(() => dispatch(setDeleteTarget(null)), [dispatch])

  const handleDownload = useCallback(
    (file: VaultFile) => dispatch(downloadFile(file)),
    [dispatch],
  )

  const handleClearProgress = useCallback(() => dispatch(clearProgress()), [dispatch])

  return {
    ...vaultdrop,
    handleLoad,
    handleUpload,
    handleDelete,
    confirmDelete,
    cancelDelete,
    handleDownload,
    handleClearProgress,
  }
}
