import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CloudUpload, RefreshCw, HardDrive, Files, Upload, Search, X, RotateCcw, Trash2 } from 'lucide-react'
import { useVaultDrop } from '../hooks/useVaultDrop'
import { DropZone } from '../components/DropZone'
import { FileTable } from '../components/FileTable'
import { UploadProgressPanel } from '../components/UploadProgressPanel'
import { VaultDropEmptyState, VaultDropSkeleton } from '../components/VaultDropStates'
import { usePageTitle } from '@core/hooks/usePageTitle'
import { formatBytes } from '@utils/index'
import type { SortBy, SortOrder } from '../dto/types/vaultdrop.types'

export const VaultDropPage = () => {
  usePageTitle('VaultDrop')
  const {
    files,
    loading,
    uploading,
    uploadProgress,
    pendingDeletion,
    selectedFileIds,
    handleLoad,
    handleUpload,
    handleDelete,
    handleUndo,
    handleBulkDelete,
    handleDownload,
    handleBulkDownload,
    handleToggleSelect,
    handleSelectAll,
    handleClearSelection,
    handleClearProgress,
  } = useVaultDrop()

  // Local UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [undoCountdown, setUndoCountdown] = useState(5)

  useEffect(() => {
    handleLoad()
  }, [handleLoad])

  // Undo countdown: resets whenever a new batch of files enters pending deletion
  useEffect(() => {
    if (pendingDeletion.length === 0) {
      setUndoCountdown(5)
      return
    }
    setUndoCountdown(5)
    const interval = setInterval(() => {
      setUndoCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [pendingDeletion.length])

  const handleSortChange = (by: SortBy) => {
    if (sortBy === by) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(by)
      setSortOrder(by === 'date' ? 'desc' : 'asc')
    }
  }

  // Filtered + sorted file list for display
  const displayFiles = useMemo(() => {
    let result = [...files]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((f) => f.file_name.toLowerCase().includes(q))
    }
    result.sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name') cmp = a.file_name.localeCompare(b.file_name)
      else if (sortBy === 'size') cmp = a.file_size - b.file_size
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return sortOrder === 'asc' ? cmp : -cmp
    })
    return result
  }, [files, searchQuery, sortBy, sortOrder])

  const totalSize = files.reduce((sum, f) => sum + f.file_size, 0)
  const hasFiles = files.length > 0 || loading

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

        {/* Upload banner */}
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
          {hasFiles && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center justify-between flex-1">
                <h2 className="text-sm font-bold text-white">Your Files</h2>
                {!loading && (
                  <p className="text-xs text-surface-400 sm:hidden">
                    {displayFiles.length}{searchQuery ? ` of ${files.length}` : ''} item{files.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Search */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search files…"
                    className="pl-8 pr-8 py-1.5 text-xs bg-surface-800/60 border border-surface-700/40 rounded-lg text-white placeholder-surface-500 focus:outline-none focus:border-brand-500/60 w-48 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                {!loading && (
                  <p className="text-xs text-surface-400 hidden sm:block whitespace-nowrap">
                    {displayFiles.length}{searchQuery ? ` of ${files.length}` : ''} item{files.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <VaultDropSkeleton />
          ) : files.length === 0 ? (
            <VaultDropEmptyState />
          ) : displayFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Search size={32} className="text-surface-600 mb-3" />
              <p className="text-sm font-semibold text-surface-400">No files match "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                Clear search
              </button>
            </div>
          ) : (
            <FileTable
              files={displayFiles}
              selectedFileIds={selectedFileIds}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onDownload={handleDownload}
              onDelete={handleDelete}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onBulkDelete={handleBulkDelete}
              onBulkDownload={handleBulkDownload}
              onSortChange={handleSortChange}
            />
          )}
        </div>
      </motion.div>

      {/* Undo delete snackbar */}
      <AnimatePresence>
        {pendingDeletion.length > 0 && (
          <motion.div
            key="undo-snackbar"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm mx-auto px-4"
          >
            <div className="relative overflow-hidden rounded-xl bg-surface-800 border border-surface-600/60 shadow-2xl shadow-black/40">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={14} className="text-red-400" />
                </div>
                <p className="flex-1 text-sm text-white font-medium">
                  {pendingDeletion.length} file{pendingDeletion.length !== 1 ? 's' : ''} deleted
                </p>
                <span className="text-xs text-surface-500 tabular-nums w-4 text-center">{undoCountdown}</span>
                <button
                  onClick={handleUndo}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-300 bg-brand-600/15 border border-brand-500/30 rounded-lg hover:bg-brand-600/25 transition-colors"
                >
                  <RotateCcw size={12} />
                  Undo
                </button>
              </div>
              {/* Countdown progress bar */}
              <motion.div
                key={pendingDeletion.length}
                className="absolute bottom-0 left-0 h-[2px] bg-brand-500/60 rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
