import { motion } from 'framer-motion'
import { Download, Trash2 } from 'lucide-react'
import { formatBytes, formatDate } from '@utils/index'
import type { VaultFile } from '../dto/types/vaultdrop.types'
import { getFileIcon, getFileColor } from './FileIconHelper'
import { cn } from '@utils/index'

interface FileTableProps {
  files: VaultFile[]
  onDownload: (file: VaultFile) => void
  onDelete: (file: VaultFile) => void
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export const FileTable = ({ files, onDownload, onDelete }: FileTableProps) => {
  return (
    <div className="rounded-xl border border-surface-700/60 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center px-4 py-2.5 bg-surface-800/60 border-b border-surface-700/40">
        <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider w-8">Type</span>
        <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Name</span>
        <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider hidden sm:block w-24 text-right">Size</span>
        <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider hidden md:block w-32 text-right">Uploaded</span>
        <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider w-20 text-right">Actions</span>
      </div>

      {/* Rows */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="divide-y divide-surface-800/60"
      >
        {files.map((file) => (
          <motion.div
            key={file.id}
            variants={rowVariants}
            className="group grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center px-4 py-3 hover:bg-surface-800/40 transition-colors"
          >
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
            <div className="flex items-center gap-1 w-20 justify-end">
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
        ))}
      </motion.div>
    </div>
  )
}
