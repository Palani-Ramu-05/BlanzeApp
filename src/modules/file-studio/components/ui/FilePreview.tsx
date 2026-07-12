import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Image as ImageIcon, FileCode, File as FileIcon, Download } from 'lucide-react'
import { Button } from '@components/Button'
import { cn } from '@utils/index'

interface FilePreviewProps {
  previewUrl: string | null
  mimeType: string
  filename: string
  onDownload: () => void
  className?: string
}

export const FilePreview = ({ previewUrl, mimeType, filename, onDownload, className }: FilePreviewProps) => {
  const [loaded, setLoaded] = useState(false)

  const isImage = mimeType.startsWith('image/')
  const isText = mimeType.startsWith('text/')
  const isPdf = mimeType === 'application/pdf'

  const renderPreview = () => {
    if (!previewUrl) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-surface-500">
          {isImage ? <ImageIcon size={40} /> : isPdf ? <FileText size={40} /> : isText ? <FileCode size={40} /> : <FileIcon size={40} />}
          <p className="text-sm text-surface-400">Preview not available</p>
        </div>
      )
    }

    if (isImage) {
      return (
        <div className="relative flex items-center justify-center min-h-[200px]">
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-400 rounded-full animate-spin" />
            </div>
          )}
          <img
            src={previewUrl}
            alt={filename}
            onLoad={() => setLoaded(true)}
            className={cn('max-w-full max-h-[400px] rounded-lg object-contain transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
          />
        </div>
      )
    }

    if (isPdf) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <iframe
            src={previewUrl}
            title={filename}
            className="w-full h-[400px] rounded-lg border border-surface-700/50"
          />
        </div>
      )
    }

    if (isText) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <iframe
            src={previewUrl}
            title={filename}
            className="w-full h-[300px] rounded-lg border border-surface-700/50 bg-surface-900/50"
          />
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-surface-500">
        <FileIcon size={40} />
        <p className="text-sm text-surface-400">Preview not available for this file type</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-xl border border-surface-700/50 bg-surface-800/30 overflow-hidden', className)}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/30">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-surface-300 font-mono truncate">{filename}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-700/50 text-surface-400 uppercase">
            {mimeType.split('/')[1] || mimeType}
          </span>
        </div>
        <Button size="xs" variant="ghost" icon={<Download size={12} />} onClick={onDownload}>
          Download
        </Button>
      </div>
      <div className="p-4">{renderPreview()}</div>
    </motion.div>
  )
}
