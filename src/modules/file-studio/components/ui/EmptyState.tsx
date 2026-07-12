import { motion } from 'framer-motion'
import { Upload } from 'lucide-react'
import { Button } from '@components/Button'

interface EmptyStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export const EmptyState = ({
  title = 'No file selected',
  description = 'Upload a file to get started with the tools',
  actionLabel = 'Upload File',
  onAction,
}: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-16 h-16 rounded-2xl bg-surface-800/80 border border-surface-700/50 flex items-center justify-center mb-4">
          <Upload size={24} className="text-surface-500" />
        </div>
      </motion.div>
      <p className="text-sm font-semibold text-surface-100 mb-1">{title}</p>
      <p className="text-xs text-surface-400 text-center max-w-xs mb-5">{description}</p>
      {onAction && (
        <Button size="sm" variant="primary" icon={<Upload size={14} />} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}
