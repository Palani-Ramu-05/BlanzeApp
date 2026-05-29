import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Flag } from 'lucide-react'
import { useStopwatch } from '../hooks/useTimer'
import { cn } from '@utils/index'

function fmtMs(ms: number) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const cs = Math.floor((ms % 1000) / 10)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}

function fmtSplit(ms: number) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const cs = Math.floor((ms % 1000) / 10)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}

export function Stopwatch() {
  const { elapsed, isRunning, laps, start, pause, reset, lap } = useStopwatch()

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.code === 'Space') { e.preventDefault(); isRunning ? pause() : start() }
    if (e.code === 'KeyL' && isRunning) lap()
    if (e.code === 'KeyR' && !isRunning) reset()
  }, [isRunning, start, pause, lap, reset])

  const bestLap = laps.length > 1 ? Math.min(...laps.map(l => l.split)) : null
  const worstLap = laps.length > 1 ? Math.max(...laps.map(l => l.split)) : null

  return (
    <div
      className="flex flex-col lg:flex-row gap-6 h-full outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Main display */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        {/* Timer display */}
        <motion.div className="text-center" key={isRunning ? 'running' : 'paused'}>
          <motion.div
            className="font-mono font-black text-6xl sm:text-7xl lg:text-8xl tracking-tighter select-none"
            style={{ color: isRunning ? '#10b981' : 'rgb(var(--color-text-primary))' }}
            animate={{ scale: isRunning ? [1, 1.01, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            {fmtMs(elapsed)}
          </motion.div>
          {laps.length > 0 && (
            <div className="mt-2 text-surface-400 text-sm font-mono">
              Lap {laps.length + 1}: {fmtSplit(elapsed - (laps[laps.length - 1]?.total ?? 0))}
            </div>
          )}
        </motion.div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={isRunning ? lap : reset}
            disabled={elapsed === 0 && !isRunning}
            className={cn(
              'w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all font-medium text-sm',
              isRunning
                ? 'bg-surface-800/60 border-surface-600 text-surface-300 hover:border-surface-500 hover:text-white'
                : 'bg-surface-800/60 border-surface-600 text-surface-300 hover:border-surface-500 hover:text-white disabled:opacity-30'
            )}
          >
            {isRunning ? <Flag size={20} /> : <RotateCcw size={20} />}
          </button>

          <button
            onClick={isRunning ? pause : start}
            className={cn(
              'w-20 h-20 rounded-2xl border-2 flex items-center justify-center transition-all',
              isRunning
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-400 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/30'
            )}
          >
            {isRunning ? <Pause size={28} /> : <Play size={28} />}
          </button>

          <div className="w-16 h-16 flex flex-col items-center justify-center text-xs text-surface-500 gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-800 border border-surface-700 text-[10px] font-mono">Space</kbd>
            <span>start/stop</span>
          </div>
        </div>

        {/* Keyboard hints */}
        <div className="flex gap-4 text-xs text-surface-500">
          <span><kbd className="px-1.5 py-0.5 rounded bg-surface-800 border border-surface-700 font-mono">L</kbd> lap</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-surface-800 border border-surface-700 font-mono">R</kbd> reset</span>
        </div>
      </div>

      {/* Laps panel */}
      <div className="lg:w-72 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>
            Laps {laps.length > 0 && <span className="text-surface-500 font-normal">({laps.length})</span>}
          </h3>
          {laps.length > 0 && (
            <span className="text-xs text-surface-500">Best / Worst highlighted</span>
          )}
        </div>

        <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar max-h-[400px]">
          <AnimatePresence initial={false}>
            {[...laps].reverse().map((l) => {
              const isBest = bestLap !== null && l.split === bestLap
              const isWorst = worstLap !== null && l.split === worstLap
              return (
                <motion.div
                  key={l.index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex items-center justify-between p-2.5 rounded-lg text-sm transition-all',
                    isBest ? 'bg-emerald-500/10 border border-emerald-500/30' :
                      isWorst ? 'bg-red-500/10 border border-red-500/30' :
                        'bg-surface-800/40 border border-surface-700'
                  )}
                >
                  <span className="font-medium text-surface-400">Lap {l.index}</span>
                  <span className={cn('font-mono text-xs', isBest ? 'text-emerald-400' : isWorst ? 'text-red-400' : 'text-surface-300')}>
                    {fmtSplit(l.split)}
                  </span>
                  <span className="font-mono text-xs text-surface-500">{fmtSplit(l.total)}</span>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {laps.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Flag size={28} className="text-surface-600 mb-2" />
              <p className="text-surface-500 text-sm">No laps recorded</p>
              <p className="text-surface-600 text-xs mt-1">Press L or the flag button while running</p>
            </div>
          )}
        </div>

        {laps.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-auto pt-2 border-t border-surface-700">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
              <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide mb-0.5">Best</div>
              <div className="font-mono text-xs text-emerald-300">{bestLap !== null ? fmtSplit(bestLap) : '—'}</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
              <div className="text-[10px] text-red-400 font-semibold uppercase tracking-wide mb-0.5">Worst</div>
              <div className="font-mono text-xs text-red-300">{worstLap !== null ? fmtSplit(worstLap) : '—'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
