import { useState, useRef, useCallback, useEffect, type DragEvent } from 'react'
import { motion } from 'framer-motion'
import { Upload, File, X, Clipboard } from 'lucide-react'
import { cn } from '@utils/index'
import toast from 'react-hot-toast'

interface FileDropzoneProps {
  onFile: (file: File) => void
  accept?: string
  maxSize?: number
  currentFile?: File | null
  onClear?: () => void
  multiple?: boolean
  onFiles?: (files: File[]) => void
}

export const FileDropzone = ({
  onFile,
  accept,
  currentFile,
  onClear,
  onFiles,
  multiple: allowMultiple,
}: FileDropzoneProps) => {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file) {
            toast.success('File pasted from clipboard')
            onFile(file)
            return
          }
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [onFile])

  const handleDrag = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    },
    [],
  )

  const handleDragIn = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragOut = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        if (allowMultiple && onFiles) {
          onFiles(files)
        } else {
          onFile(files[0])
        }
      }
    },
    [onFile, onFiles, allowMultiple],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        if (allowMultiple && onFiles) {
          onFiles(files)
        } else {
          onFile(files[0])
        }
      }
      e.target.value = ''
    },
    [onFile, onFiles, allowMultiple],
  )

  if (currentFile) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative flex items-center gap-4 p-4 rounded-xl bg-surface-800/50 border border-surface-700/60 group"
      >
        <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
          <File size={18} className="text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-surface-100 truncate">{currentFile.name}</p>
          <p className="text-xs text-surface-400">
            {(currentFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            aria-label="Remove file"
          >
            <X size={14} />
          </button>
        )}
      </motion.div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
      }}
      aria-label="Upload file"
      className={cn(
        'relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
        dragOver
          ? 'border-brand-400 bg-brand-500/8 scale-[1.01]'
          : 'border-surface-600 hover:border-surface-500 bg-surface-800/30 hover:bg-surface-800/50',
      )}
      onClick={() => inputRef.current?.click()}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <motion.div
        animate={dragOver ? { y: -4, scale: 1.05 } : { y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center">
          <Upload size={22} className="text-brand-400" />
        </div>
      </motion.div>
      <div className="text-center">
        <p className="text-sm font-semibold text-surface-100">
          {dragOver ? 'Drop file here' : 'Drop file here or click to browse'}
        </p>
        <p className="text-xs text-surface-400 mt-1">
          {accept ? `Supports ${accept.replace(/\./g, '').toUpperCase()}` : 'All formats supported'}
        </p>
        <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-surface-500">
          <Clipboard size={10} />
          <span>Or paste from clipboard</span>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        aria-hidden="true"
        multiple={allowMultiple}
      />
    </div>
  )
}
