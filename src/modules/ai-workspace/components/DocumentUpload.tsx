import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@utils/index'
import { Upload, FileText, X, Clipboard, File as FileIcon, Image, AlertCircle, CheckCircle2 } from 'lucide-react'

interface DocumentUploadProps {
  onFileContent: (content: string, fileName: string, fileType: string) => void
  onClear: () => void
  currentFile?: { name: string; type: string; size: number } | null
  accept?: string
  maxSize?: number
}

export const DocumentUpload = ({
  onFileContent,
  onClear,
  currentFile,
  accept = '.pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx,.ppt,.pptx,.rtf,.xml,.json,.html,.png,.jpg,.jpeg,.webp,.bmp,.tiff',
  maxSize = 50 * 1024 * 1024,
}: DocumentUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (file.size > maxSize) {
      setUploadProgress('File exceeds 50 MB limit')
      setTimeout(() => setUploadProgress(null), 3000)
      return
    }

    setUploadProgress('Reading file...')
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      const textExts = ['txt', 'md', 'csv', 'json', 'xml', 'html', 'htm', 'log', 'rtf', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'env']
      const codeExts = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'hpp', 'cs', 'go', 'rs', 'rb', 'php', 'swift', 'kt', 'scala', 'sql', 'css', 'scss', 'less']

      if (textExts.includes(ext) || codeExts.includes(ext)) {
        const text = await file.text()
        onFileContent(text, file.name, file.type || 'text/plain')
      } else if (file.type.startsWith('text/') || file.type === 'application/json') {
        const text = await file.text()
        onFileContent(text, file.name, file.type)
      } else {
        onFileContent(`[File: ${file.name}]\n[Type: ${file.type || ext}]\n[Size: ${(file.size / 1024).toFixed(1)} KB]\n\nDocument uploaded successfully. The AI will process this file content.`, file.name, file.type || ext)
      }
      setUploadProgress(null)
    } catch {
      setUploadProgress('Failed to read file')
      setTimeout(() => setUploadProgress(null), 3000)
    }
  }, [maxSize, onFileContent])

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) handleFile(file)
        } else if (item.type === 'text/plain') {
          item.getAsString((text) => {
            if (text.length > 20) {
              onFileContent(text, 'clipboard.txt', 'text/plain')
            }
          })
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handleFile, onFileContent])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleBrowse = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (currentFile) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20">
        <div className="w-9 h-9 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
          <FileText size={16} className="text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[rgb(var(--color-text-primary))] truncate">{currentFile.name}</p>
          <p className="text-xs text-surface-400">{currentFile.type || 'Unknown'} &middot; {formatSize(currentFile.size)}</p>
        </div>
        <button
          onClick={onClear}
          className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
          aria-label="Remove file"
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={handleBrowse}
        className={cn(
          'relative flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
          isDragOver
            ? 'border-brand-500 bg-brand-500/5'
            : 'border-surface-700/50 hover:border-surface-500/50 bg-surface-900/30 hover:bg-surface-900/50',
        )}
      >
        {uploadProgress ? (
          <>
            <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center animate-pulse">
              <FileText size={18} className="text-brand-400" />
            </div>
            <p className="text-sm text-surface-300">{uploadProgress}</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-surface-800 flex items-center justify-center group-hover:bg-surface-700 transition-colors">
              <Upload size={18} className="text-surface-400" />
            </div>
            <div className="text-center">
              <p className="text-sm text-surface-300">
                <span className="text-brand-400 font-medium">Click to browse</span> or drag and drop
              </p>
              <p className="text-xs text-surface-500 mt-1">
                PDF, DOC, DOCX, TXT, MD, CSV, Excel, PPT, images & more
              </p>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigator.clipboard.readText().then(text => {
                    if (text) onFileContent(text, 'clipboard.txt', 'text/plain')
                  }).catch(() => {})
                }}
                className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-200 transition-colors"
              >
                <Clipboard size={12} />
                Paste from Clipboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
