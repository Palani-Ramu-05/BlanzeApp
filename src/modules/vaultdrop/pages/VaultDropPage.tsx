import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CloudUpload, RefreshCw, HardDrive, Files, Upload } from 'lucide-react'
import { useVaultDrop } from '../hooks/useVaultDrop'
import { DropZone } from '../components/DropZone'
import { FileTable } from '../components/FileTable'
import { UploadProgressPanel } from '../components/UploadProgressPanel'
import { DeleteConfirmModal } from '../components/DeleteConfirmModal'
import { VaultDropEmptyState, VaultDropSkeleton } from '../components/VaultDropStates'
import { usePageTitle } from '@core/hooks/usePageTitle'
import { formatBytes } from '@utils/index'
import { useAppSelector } from '@core/hooks/useStore'

export const VaultDropPage = () => {
  usePageTitle('VaultDrop')
  const user = useAppSelector((s) => s.auth.user)
  const {
    files,
    loading,
    uploading,
    uploadProgress,
    deleteTarget,
    deleting,
    handleLoad,
    handleUpload,
    handleDelete,
    confirmDelete,
    cancelDelete,
    handleDownload,
    handleClearProgress,
  } = useVaultDrop()

  useEffect(() => {
    handleLoad()
  }, [handleLoad])

  const totalSize = files.reduce((sum, f) => sum + f.file_size, 0)

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-5xl mx-auto p-6 space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center">
              <CloudUpload size={20} className="text-brand-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">VaultDrop</h1>
              <p className="text-xs text-surface-400">Lightweight cloud file storage</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-800/60 border border-surface-700/40 rounded-xl">
              <Files size={13} className="text-brand-400" />
              <span className="text-xs font-semibold text-white">{files.length}</span>
              <span className="text-xs text-surface-400">files</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-800/60 border border-surface-700/40 rounded-xl">
              <HardDrive size={13} className="text-brand-400" />
              <span className="text-xs font-semibold text-white">{formatBytes(totalSize)}</span>
              <span className="text-xs text-surface-400">used</span>
            </div>
            <button
              onClick={handleLoad}
              disabled={loading}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-surface-400 hover:text-white bg-surface-800/60 border border-surface-700/40 hover:border-brand-600/40 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Upload banner — shown while uploading */}
        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-brand-600/10 border border-brand-600/25"
            >
              <Upload size={14} className="text-brand-400 flex-shrink-0 animate-bounce" />
              <p className="text-xs text-brand-300 font-medium">Uploading files to Supabase Storage…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drop Zone */}
        <DropZone onFiles={handleUpload} disabled={uploading} />

        {/* Upload progress */}
        <AnimatePresence>
          {uploadProgress.length > 0 && (
            <UploadProgressPanel items={uploadProgress} onClear={handleClearProgress} />
          )}
        </AnimatePresence>

        {/* File list */}
        <div className="space-y-3">
          {files.length > 0 && (
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Your Files</h2>
              <p className="text-xs text-surface-400">{files.length} item{files.length > 1 ? 's' : ''}</p>
            </div>
          )}

          {loading ? (
            <VaultDropSkeleton />
          ) : files.length === 0 ? (
            <VaultDropEmptyState />
          ) : (
            <FileTable
              files={files}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          )}
        </div>
      </motion.div>

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        file={deleteTarget}
        open={!!deleteTarget}
        deleting={deleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  )
}
