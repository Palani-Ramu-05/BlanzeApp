import { motion } from 'framer-motion'
import { cn } from '@utils/index'
import { UploadStatus } from '../../dto/common'

interface ProcessingOverlayProps {
  status: UploadStatus
  message?: string
  className?: string
}

const statusConfig: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  [UploadStatus.Validating]: { label: 'Validating file...', emoji: '🔍', color: 'text-amber-400' },
  [UploadStatus.Uploading]: { label: 'Uploading...', emoji: '⬆️', color: 'text-blue-400' },
  [UploadStatus.Processing]: { label: 'Processing...', emoji: '⚙️', color: 'text-brand-400' },
  [UploadStatus.PreparingDownload]: { label: 'Preparing download...', emoji: '📦', color: 'text-purple-400' },
  [UploadStatus.Downloading]: { label: 'Downloading...', emoji: '⬇️', color: 'text-emerald-400' },
  [UploadStatus.Complete]: { label: 'Complete!', emoji: '✅', color: 'text-emerald-400' },
}

export const ProcessingOverlay = ({ status, message, className }: ProcessingOverlayProps) => {
  if (status === UploadStatus.Idle || status === UploadStatus.Error) return null

  const config = statusConfig[status] || { label: 'Processing...', emoji: '⏳', color: 'text-brand-400' }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-12',
        className,
      )}
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-surface-800/80 border border-surface-700/50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-400 rounded-full animate-spin" />
        </div>
      </div>
      <div className="text-center">
        <p className={cn('text-sm font-semibold', config.color)}>
          {message || config.label}
        </p>
        <p className="text-xs text-surface-400 mt-1">
          Please wait while your file is being processed
        </p>
      </div>
    </motion.div>
  )
}
