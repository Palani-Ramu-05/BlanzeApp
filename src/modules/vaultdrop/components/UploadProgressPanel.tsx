import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2, X } from 'lucide-react'
import { cn } from '@utils/index'
import type { UploadProgress } from '../dto/types/vaultdrop.types'

interface UploadProgressPanelProps {
  items: UploadProgress[]
  onClear: () => void
}

export const UploadProgressPanel = ({ items, onClear }: UploadProgressPanelProps) => {
  if (items.length === 0) return null

  const allDone = items.every((p) => p.status !== 'uploading')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="bg-surface-900 border border-surface-700/60 rounded-xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-700/50">
        <p className="text-xs font-semibold text-surface-300">
          {allDone ? 'Upload complete' : 'Uploading…'} ({items.length} file{items.length > 1 ? 's' : ''})
        </p>
        {allDone && (
          <button
            onClick={onClear}
            className="text-surface-400 hover:text-white transition-colors p-0.5 rounded"
          >
            <X size={13} />
          </button>
        )}
      </div>
      <div className="divide-y divide-surface-800">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.fileName}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 flex items-center gap-3"
            >
              {/* Status icon */}
              <div className="flex-shrink-0">
                {item.status === 'uploading' && (
                  <Loader2 size={15} className="text-brand-400 animate-spin" />
                )}
                {item.status === 'success' && (
                  <CheckCircle2 size={15} className="text-green-400" />
                )}
                {item.status === 'error' && (
                  <XCircle size={15} className="text-red-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{item.fileName}</p>
                {item.status === 'uploading' && (
                  <div className="mt-1 h-1 bg-surface-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-brand-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${item.progress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                )}
                {item.status === 'error' && item.error && (
                  <p className="text-[10px] text-red-400 mt-0.5 truncate">{item.error}</p>
                )}
                {item.status === 'success' && (
                  <p className="text-[10px] text-green-400 mt-0.5">Uploaded successfully</p>
                )}
              </div>

              {item.status === 'uploading' && (
                <span className={cn('text-[10px] font-mono text-brand-400 flex-shrink-0')}>
                  {item.progress}%
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
