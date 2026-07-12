import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw, XCircle } from 'lucide-react'
import { Button } from '@components/Button'

interface ErrorStateProps {
  message: string | null
  code?: string | null
  onRetry?: () => void
  onClear?: () => void
}

export const ErrorState = ({ message, code, onRetry, onClear }: ErrorStateProps) => {
  if (!message) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-red-500/20 bg-red-500/6 p-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
          <AlertCircle size={16} className="text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-400">Error</p>
          <p className="text-sm text-surface-200 mt-0.5">{message}</p>
          {code && (
            <p className="text-[11px] font-mono text-surface-500 mt-1">
              Code: {code}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3">
            {onRetry && (
              <Button size="xs" variant="danger" icon={<RefreshCw size={12} />} onClick={onRetry}>
                Retry
              </Button>
            )}
            {onClear && (
              <Button size="xs" variant="ghost" icon={<XCircle size={12} />} onClick={onClear}>
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
