import { useState, useCallback, type DragEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CloudUpload, FolderOpen, AlertCircle } from 'lucide-react'
import { cn } from '@utils/index'
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from '../dto/types/vaultdrop.types'

interface DropZoneProps {
  onFiles: (files: File[]) => void
  disabled?: boolean
}

export const DropZone = ({ onFiles, disabled }: DropZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragError, setDragError] = useState<string | null>(null)

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    setDragError(null)
  }, [])

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || disabled) return
      const files = Array.from(fileList)
      const oversized = files.find((f) => f.size > MAX_FILE_SIZE)
      if (oversized) {
        setDragError(`"${oversized.name}" exceeds the 5 MB limit.`)
        setTimeout(() => setDragError(null), 3000)
        return
      }
      setDragError(null)
      onFiles(files)
    },
    [disabled, onFiles],
  )

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOver(false)
      processFiles(e.dataTransfer.files)
    },
    [processFiles],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files)
      e.target.value = ''
    },
    [processFiles],
  )

  return (
    <div className="relative">
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={
          isDragOver
            ? { scale: 1.01, borderColor: 'rgb(124 58 237 / 0.8)' }
            : { scale: 1, borderColor: 'rgb(55 65 81 / 0.6)' }
        }
        transition={{ duration: 0.15 }}
        className={cn(
          'relative rounded-2xl border-2 border-dashed transition-colors overflow-hidden cursor-pointer group',
          isDragOver
            ? 'bg-brand-600/10 border-brand-500/60'
            : 'bg-surface-900/50 border-surface-700/60 hover:border-brand-600/50 hover:bg-brand-600/5',
          disabled && 'opacity-50 pointer-events-none',
        )}
      >
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgb(124 58 237) 1px, transparent 1px), linear-gradient(90deg, rgb(124 58 237) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        <label className="relative flex flex-col items-center justify-center gap-4 py-14 px-6 cursor-pointer">
          <input
            type="file"
            multiple
            accept={ALLOWED_EXTENSIONS.join(',')}
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileInput}
            disabled={disabled}
          />

          {/* Icon */}
          <motion.div
            animate={isDragOver ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {isDragOver ? (
                  <motion.div
                    key="drop"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <FolderOpen size={28} className="text-brand-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <CloudUpload size={28} className="text-brand-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-2xl bg-brand-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>

          {/* Text */}
          <div className="text-center space-y-1.5">
            <p className="text-sm font-semibold text-white">
              {isDragOver ? 'Drop files here' : 'Drag & drop files, or click to browse'}
            </p>
            <p className="text-xs text-surface-400">
              Images, GIFs, TXT, JSON, PDF, ZIP · Max 5 MB per file
            </p>
          </div>

          {/* Supported chips */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {['PNG', 'JPG', 'GIF', 'PDF', 'JSON', 'TXT', 'ZIP'].map((ext) => (
              <span
                key={ext}
                className="px-2 py-0.5 text-[10px] font-semibold text-surface-400 bg-surface-800 border border-surface-700/60 rounded-full"
              >
                {ext}
              </span>
            ))}
          </div>
        </label>

        {/* Drag overlay glow border */}
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-2xl pointer-events-none ring-2 ring-brand-500/60 ring-inset"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Drag error */}
      <AnimatePresence>
        {dragError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
          >
            <AlertCircle size={13} className="flex-shrink-0" />
            {dragError}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
