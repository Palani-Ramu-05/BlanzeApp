import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Trash2, Copy, Check, ChevronUp, ChevronDown, ChevronsUpDown, DownloadCloud, Minus } from 'lucide-react'
import { useState } from 'react'
import { formatBytes, formatDate } from '@utils/index'
import type { VaultFile, SortBy, SortOrder } from '../dto/types/vaultdrop.types'
import { getFileIcon, getFileColor } from './FileIconHelper'
import { cn } from '@utils/index'

interface FileTableProps {
  files: VaultFile[]
  selectedFileIds: string[]
  sortBy: SortBy
  sortOrder: SortOrder
  onDownload: (file: VaultFile) => void
  onDelete: (file: VaultFile) => void
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
  onClearSelection: () => void
  onBulkDelete: () => void
  onBulkDownload: () => void
  onSortChange: (by: SortBy) => void
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

function SortIcon({ col, sortBy, sortOrder }: { col: SortBy; sortBy: SortBy; sortOrder: SortOrder }) {
  if (sortBy !== col) return <ChevronsUpDown size={11} className="text-surface-600 group-hover:text-surface-400 transition-colors" />
  if (sortOrder === 'asc') return <ChevronUp size={11} className="text-brand-400" />
  return <ChevronDown size={11} className="text-brand-400" />
}

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: ignore
    }
  }, [url])

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleCopy}
      className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
        copied
          ? 'text-green-400 bg-green-500/10'
          : 'text-surface-400 hover:text-sky-400 hover:bg-sky-500/10',
      )}
      title={copied ? 'Copied!' : 'Copy URL'}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </motion.button>
  )
}

export const FileTable = ({
  files,
  selectedFileIds,
  sortBy,
  sortOrder,
  onDownload,
  onDelete,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  onBulkDownload,
  onSortChange,
}: FileTableProps) => {
  const allSelected = files.length > 0 && files.every((f) => selectedFileIds.includes(f.id))
  const someSelected = files.some((f) => selectedFileIds.includes(f.id))
  const selectedCount = files.filter((f) => selectedFileIds.includes(f.id)).length

  // Keyboard shortcut: Escape clears selection, Delete key triggers bulk delete
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return
      if (e.key === 'Escape' && selectedCount > 0) onClearSelection()
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedCount > 0) {
        e.preventDefault()
        onBulkDelete()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedCount, onClearSelection, onBulkDelete])

  const handleHeaderCheckbox = () => {
    if (allSelected) onClearSelection()
    else onSelectAll()
  }

  return (
    <div className="rounded-xl border border-surface-700/60 overflow-hidden">
      {/* Bulk action bar */}
      <AnimatePresence>
        {someSelected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-600/10 border-b border-brand-600/25">
              <span className="text-xs font-semibold text-brand-300 flex-1">
                {selectedCount} file{selectedCount !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={onBulkDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-300 bg-sky-500/10 border border-sky-500/20 rounded-lg hover:bg-sky-500/20 transition-colors"
              >
                <DownloadCloud size={13} />
                Download All
              </button>
              <button
                onClick={onBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <Trash2 size={13} />
                Delete Selected
              </button>
              <button
                onClick={onClearSelection}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-surface-400 hover:text-white transition-colors rounded-lg hover:bg-surface-800"
                title="Clear selection (Esc)"
              >
                <Minus size={12} />
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table header */}
      <div className="grid grid-cols-[auto_auto_1fr_auto_auto_auto] gap-3 items-center px-4 py-2.5 bg-surface-800/60 border-b border-surface-700/40">
        {/* Select all checkbox */}
        <button
          onClick={handleHeaderCheckbox}
          className={cn(
            'w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0',
            allSelected
              ? 'bg-brand-600 border-brand-500'
              : someSelected
                ? 'bg-brand-600/40 border-brand-500/60'
                : 'bg-transparent border-surface-600 hover:border-brand-500',
          )}
          title={allSelected ? 'Deselect all' : 'Select all'}
        >
          {allSelected && <Check size={10} className="text-white" />}
          {!allSelected && someSelected && <Minus size={10} className="text-brand-300" />}
        </button>

        <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider w-8">Type</span>

        {/* Sortable: Name */}
        <button
          onClick={() => onSortChange('name')}
          className="group flex items-center gap-1 text-[10px] font-bold text-surface-500 uppercase tracking-wider hover:text-surface-300 transition-colors"
        >
          Name
          <SortIcon col="name" sortBy={sortBy} sortOrder={sortOrder} />
        </button>

        {/* Sortable: Size */}
        <button
          onClick={() => onSortChange('size')}
          className="group flex items-center gap-1 text-[10px] font-bold text-surface-500 uppercase tracking-wider hidden sm:flex hover:text-surface-300 transition-colors w-24 justify-end"
        >
          Size
          <SortIcon col="size" sortBy={sortBy} sortOrder={sortOrder} />
        </button>

        {/* Sortable: Date */}
        <button
          onClick={() => onSortChange('date')}
          className="group flex items-center gap-1 text-[10px] font-bold text-surface-500 uppercase tracking-wider hidden md:flex hover:text-surface-300 transition-colors w-32 justify-end"
        >
          Uploaded
          <SortIcon col="date" sortBy={sortBy} sortOrder={sortOrder} />
        </button>

        <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider w-24 text-right">Actions</span>
      </div>

      {/* Rows */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="divide-y divide-surface-800/60"
      >
        {files.map((file) => {
          const isSelected = selectedFileIds.includes(file.id)
          return (
            <motion.div
              key={file.id}
              variants={rowVariants}
              className={cn(
                'group grid grid-cols-[auto_auto_1fr_auto_auto_auto] gap-3 items-center px-4 py-3 transition-colors',
                isSelected
                  ? 'bg-brand-600/8 hover:bg-brand-600/12'
                  : 'hover:bg-surface-800/40',
              )}
            >
              {/* Checkbox */}
              <button
                onClick={() => onToggleSelect(file.id)}
                className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0',
                  isSelected
                    ? 'bg-brand-600 border-brand-500'
                    : 'bg-transparent border-surface-600 group-hover:border-surface-500 hover:border-brand-500',
                )}
              >
                {isSelected && <Check size={10} className="text-white" />}
              </button>

              {/* Icon */}
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  getFileColor(file.mime_type),
                )}
              >
                {getFileIcon(file.mime_type, 16)}
              </div>

              {/* Name */}
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{file.file_name}</p>
                <p className="text-[10px] text-surface-500 mt-0.5 sm:hidden">
                  {formatBytes(file.file_size)} · {formatDate(file.created_at)}
                </p>
              </div>

              {/* Size */}
              <span className="text-xs text-surface-400 hidden sm:block w-24 text-right tabular-nums">
                {formatBytes(file.file_size)}
              </span>

              {/* Date */}
              <span className="text-xs text-surface-400 hidden md:block w-32 text-right">
                {formatDate(file.created_at)}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-0.5 w-24 justify-end">
                <CopyButton url={file.file_url} />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDownload(file)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                  title="Download"
                >
                  <Download size={14} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDelete(file)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </motion.button>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
