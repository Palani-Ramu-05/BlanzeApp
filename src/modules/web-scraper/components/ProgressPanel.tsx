import { memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Loader2, AlertTriangle, Clock, Timer } from 'lucide-react'
import { useAppSelector } from '@core/hooks/useStore'
import { URL_STATUS_CONFIG } from '../dto/types/webscraper.types'
import { cn } from '@utils/index'

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <Check size={11} className="text-emerald-400" />
  if (status === 'failed') return <X size={11} className="text-red-400" />
  if (status === 'running') return <Loader2 size={11} className="animate-spin text-blue-400" />
  return <span className="w-1.5 h-1.5 rounded-full inline-block bg-surface-500" />
}

const STATUS_BORDER: Record<string, string> = {
  completed: 'border-l-emerald-500/50',
  failed: 'border-l-red-500/50',
  running: 'border-l-blue-500/50',
}

const QueueRow = memo(({ url, status, error, isCurrent }: {
  url: string; status: string; error?: string; isCurrent: boolean
}) => {
  const cfg = URL_STATUS_CONFIG[status as keyof typeof URL_STATUS_CONFIG]
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all border text-[11px] border-l-2',
        isCurrent ? 'border-brand-500/20 bg-brand-600/5' : 'border-transparent border-l-surface-700/20',
        STATUS_BORDER[status] || 'border-l-surface-700/20',
      )}
    >
      <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
        <StatusIcon status={status} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-surface-100 truncate text-[10px] font-mono">{url}</span>
          {isCurrent && <span className="text-[8px] text-brand-400 font-semibold animate-pulse">NOW</span>}
        </div>
        {error && <p className="text-[9px] text-red-400/80 mt-0.5 truncate">{error}</p>}
      </div>
      <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0', cfg.color, cfg.bgColor)}>
        {cfg.label}
      </span>
    </motion.div>
  )
})
QueueRow.displayName = 'QueueRow'

export function ProgressPanel() {
  const { queue, currentURLIndex, isRunning, startTime } = useAppSelector(s => s.webScraper)

  const completedCount = queue.filter(q => q.status === 'completed').length
  const failedCount = queue.filter(q => q.status === 'failed').length
  const total = queue.length
  const doneCount = completedCount + failedCount
  const percentage = total > 0 ? Math.round((doneCount / total) * 100) : 0

  const elapsed = useMemo(() => {
    if (!startTime) return '0s'
    const diff = Date.now() - startTime
    const secs = Math.floor(diff / 1000)
    if (secs < 60) return `${secs}s`
    const m = Math.floor(secs / 60); const s = secs % 60
    return s > 0 ? `${m}m ${s}s` : `${m}m`
  }, [startTime, doneCount])

  const eta = useMemo(() => {
    if (!isRunning || doneCount === 0 || doneCount >= total) return null
    const elapsedMs = startTime ? Date.now() - startTime : 0
    const avgMs = elapsedMs / doneCount
    const remainingMs = (total - doneCount) * avgMs
    const secs = Math.round(remainingMs / 1000)
    if (secs < 60) return `~${secs}s left`
    return `~${Math.floor(secs / 60)}m ${secs % 60}s left`
  }, [isRunning, doneCount, total, startTime])

  if (queue.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 text-surface-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {completedCount} done
          </span>
          {failedCount > 0 && (
            <span className="flex items-center gap-1 text-surface-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              {failedCount} fail
            </span>
          )}
          <span className="text-surface-500">{doneCount}/{total}</span>
        </div>
        <div className="flex items-center gap-2.5">
          {eta && <span className="flex items-center gap-1 text-surface-500"><Timer size={10} />{eta}</span>}
          <span className="flex items-center gap-1 text-surface-500"><Clock size={10} />{elapsed}</span>
          <span className="font-semibold text-surface-50">{percentage}%</span>
        </div>
      </div>

      <div className="h-1 bg-surface-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <div className="space-y-px max-h-48 overflow-y-auto no-scrollbar">
        <AnimatePresence>
          {queue.map((item, i) => (
            <QueueRow
              key={`${item.url}-${i}`}
              url={item.url}
              status={item.status}
              error={item.error}
              isCurrent={i === currentURLIndex && item.status === 'running'}
            />
          ))}
        </AnimatePresence>
      </div>

      {!isRunning && total > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium border',
            failedCount === 0
              ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
              : 'border-amber-500/20 bg-amber-500/5 text-amber-400',
          )}
        >
          {failedCount === 0
            ? <><Check size={11} /> All {total} URL{total > 1 ? 's' : ''} scraped successfully</>
            : <><AlertTriangle size={11} /> Completed with {failedCount} failure{failedCount !== 1 ? 's' : ''}</>
          }
        </motion.div>
      )}
    </div>
  )
}
