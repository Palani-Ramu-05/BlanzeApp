import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Play, Pause, RotateCcw, Timer, Zap, Clock, Plus as PlusIcon } from 'lucide-react'
import { useCountdowns } from '../hooks/useTimer'
import { cn } from '@utils/index'

const PRESETS = [
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '25 min', seconds: 1500 },
  { label: '45 min', seconds: 2700 },
  { label: '60 min', seconds: 3600 },
]

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const STATE_COLORS: Record<string, string> = {
  idle: '#3b82f6',
  running: '#10b981',
  paused: '#f59e0b',
  completed: '#ef4444',
}

function CircularProgress({
  progress,
  size = 200,
  color = '#3b82f6',
  children,
}: {
  progress: number
  size?: number
  color?: string
  children?: React.ReactNode
}) {
  const strokeWidth = 10
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)))

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ position: 'absolute' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
          strokeWidth={strokeWidth} className="text-surface-700/60" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
          transition={{ duration: 0.8, ease: 'linear' }}
        />
      </svg>
      <div className="flex flex-col items-center justify-center z-10">{children}</div>
    </div>
  )
}

export function CountdownTimer() {
  const { timers, addTimer, removeTimer, start, pause, reset, addTime } = useCountdowns()
  const [newLabel, setNewLabel] = useState('')
  const [newMinutes, setNewMinutes] = useState(25)
  const [showAdd, setShowAdd] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const handleAdd = (seconds?: number) => {
    addTimer(newLabel || 'Timer', seconds ?? newMinutes * 60)
    setNewLabel(''); setNewMinutes(25); setShowAdd(false)
  }

  const activeTimer = timers.find(t => t.id === activeId) ?? timers[0]

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Left: active timer display */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTimer ? (
            <motion.div
              key={activeTimer.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
              <CircularProgress
                size={220}
                progress={activeTimer.remaining / activeTimer.duration}
                color={STATE_COLORS[activeTimer.state]}
              >
                <span className="text-4xl font-mono font-black" style={{ color: STATE_COLORS[activeTimer.state] }}>
                  {formatTime(activeTimer.remaining)}
                </span>
                <span className="text-sm text-surface-400 mt-1 max-w-[140px] text-center truncate">
                  {activeTimer.label}
                </span>
                {activeTimer.state === 'completed' && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-xs font-bold text-red-400 mt-1"
                  >
                    Done!
                  </motion.span>
                )}
              </CircularProgress>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => addTime(activeTimer.id, -60)}
                  className="w-9 h-9 rounded-lg bg-surface-800 border border-surface-700 text-surface-300 hover:text-white hover:border-surface-500 transition-all text-sm font-bold"
                >−1m</button>

                {activeTimer.state === 'running' ? (
                  <button onClick={() => pause(activeTimer.id)}
                    className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 text-amber-400 hover:bg-amber-500/30 transition-all flex items-center justify-center">
                    <Pause size={22} />
                  </button>
                ) : (
                  <button onClick={() => start(activeTimer.id)}
                    className="w-14 h-14 rounded-2xl bg-brand-600/20 border-2 border-brand-500/50 text-brand-400 hover:bg-brand-600/30 transition-all flex items-center justify-center">
                    <Play size={22} />
                  </button>
                )}
                <button onClick={() => reset(activeTimer.id)}
                  className="w-9 h-9 rounded-lg bg-surface-800 border border-surface-700 text-surface-300 hover:text-white hover:border-surface-500 transition-all flex items-center justify-center">
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={() => addTime(activeTimer.id, 60)}
                  className="w-9 h-9 rounded-lg bg-surface-800 border border-surface-700 text-surface-300 hover:text-white hover:border-surface-500 transition-all text-sm font-bold"
                >+1m</button>
              </div>

              {/* Quick presets */}
              <div className="flex gap-2 flex-wrap justify-center">
                {PRESETS.map(p => (
                  <button key={p.label}
                    onClick={() => { reset(activeTimer.id); setTimeout(() => start(activeTimer.id), 50) }}
                    className="px-3 py-1 text-xs font-medium rounded-lg bg-surface-800 border border-surface-700 text-surface-300 hover:text-white hover:border-brand-500 transition-all"
                  >{p.label}</button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-surface-800/80 border border-surface-700 flex items-center justify-center">
                <Timer size={32} className="text-surface-500" />
              </div>
              <p className="text-surface-300 font-medium">No timers yet</p>
              <p className="text-surface-500 text-sm">Add a timer to get started</p>
              <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
                <Plus size={16} /> Add Timer
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: timer list */}
      <div className="lg:w-72 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>Timers</h3>
          <button onClick={() => setShowAdd(v => !v)}
            className="w-7 h-7 rounded-lg bg-brand-600/20 border border-brand-500/30 text-brand-400 hover:bg-brand-600/30 transition-all flex items-center justify-center">
            <Plus size={14} />
          </button>
        </div>

        {/* Add timer form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-surface-800/60 border border-surface-700 rounded-xl p-3 flex flex-col gap-2">
                <input
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="Timer label..."
                  className="input-base text-xs py-2"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={1} max={999}
                    value={newMinutes}
                    onChange={e => setNewMinutes(Number(e.target.value))}
                    className="input-base text-xs py-2 w-20"
                  />
                  <span className="text-surface-400 text-xs">min</span>
                  <button onClick={() => handleAdd()} className="btn-primary py-1.5 px-3 text-xs flex-1">Start</button>
                </div>
                {/* Quick presets */}
                <div className="flex gap-1.5 flex-wrap">
                  {PRESETS.map(p => (
                    <button key={p.label} onClick={() => { setNewMinutes(p.seconds / 60); handleAdd(p.seconds) }}
                      className="px-2 py-1 text-[11px] font-medium rounded-md bg-surface-700 text-surface-300 hover:text-white hover:bg-surface-600 transition-all">
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timer list */}
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto no-scrollbar">
          <AnimatePresence>
            {timers.map(t => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={() => setActiveId(t.id)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                  activeTimer?.id === t.id
                    ? 'bg-brand-600/10 border-brand-500/40'
                    : 'bg-surface-800/40 border-surface-700 hover:border-surface-600'
                )}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${STATE_COLORS[t.state]}20`, border: `1px solid ${STATE_COLORS[t.state]}40` }}>
                  {t.state === 'running' ? <Zap size={14} style={{ color: STATE_COLORS[t.state] }} /> :
                    t.state === 'completed' ? <span style={{ color: STATE_COLORS[t.state] }} className="text-sm">✓</span> :
                      <Clock size={14} style={{ color: STATE_COLORS[t.state] }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'rgb(var(--color-text-primary))' }}>{t.label}</p>
                  <p className="text-xs font-mono" style={{ color: STATE_COLORS[t.state] }}>{formatTime(t.remaining)}</p>
                </div>
                <div className="flex items-center gap-1">
                  {t.state === 'running' ? (
                    <button onClick={e => { e.stopPropagation(); pause(t.id) }}
                      className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center hover:bg-amber-500/30 transition-all">
                      <Pause size={10} />
                    </button>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); start(t.id) }}
                      className="w-6 h-6 rounded-md bg-brand-600/20 text-brand-400 flex items-center justify-center hover:bg-brand-600/30 transition-all">
                      <Play size={10} />
                    </button>
                  )}
                  <button onClick={e => { e.stopPropagation(); removeTimer(t.id) }}
                    className="w-6 h-6 rounded-md bg-red-600/10 text-red-400 flex items-center justify-center hover:bg-red-600/20 transition-all">
                    <Trash2 size={10} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {timers.length === 0 && !showAdd && (
            <button onClick={() => setShowAdd(true)}
              className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-surface-700 text-surface-500 hover:border-brand-500/50 hover:text-brand-400 transition-all text-sm">
              <PlusIcon size={16} /> Add first timer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
