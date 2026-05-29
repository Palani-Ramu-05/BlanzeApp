import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, ChevronRight } from 'lucide-react'
import { useIntervalTimer, type IntervalPhase } from '../hooks/useTimer'
import { cn } from '@utils/index'

const PRESETS: { name: string; description: string; phases: IntervalPhase[]; rounds: number }[] = [
  {
    name: 'Pomodoro',
    description: '25 min work, 5 min break',
    rounds: 4,
    phases: [
      { label: 'Focus', duration: 1500, color: '#3b82f6' },
      { label: 'Break', duration: 300, color: '#10b981' },
    ],
  },
  {
    name: 'HIIT',
    description: '20s work, 10s rest × 8',
    rounds: 8,
    phases: [
      { label: 'Work', duration: 20, color: '#ef4444' },
      { label: 'Rest', duration: 10, color: '#10b981' },
    ],
  },
  {
    name: 'Tabata',
    description: '20s work, 10s rest × 8',
    rounds: 8,
    phases: [
      { label: 'Effort', duration: 20, color: '#f59e0b' },
      { label: 'Rest', duration: 10, color: '#3b82f6' },
    ],
  },
  {
    name: 'Box Breathing',
    description: 'Inhale 4s / Hold 4s / Exhale 4s / Hold 4s',
    rounds: 10,
    phases: [
      { label: 'Inhale', duration: 4, color: '#3b82f6' },
      { label: 'Hold', duration: 4, color: '#8b5cf6' },
      { label: 'Exhale', duration: 4, color: '#10b981' },
      { label: 'Hold', duration: 4, color: '#f59e0b' },
    ],
  },
]

function formatSecs(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function IntervalTimer() {
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0])
  const [customPhases, setCustomPhases] = useState<IntervalPhase[]>(PRESETS[0].phases)
  const [rounds, setRounds] = useState(PRESETS[0].rounds)
  const [tab, setTab] = useState<'presets' | 'custom'>('presets')

  const activePhases = tab === 'presets' ? selectedPreset.phases : customPhases
  const activeRounds = tab === 'presets' ? selectedPreset.rounds : rounds

  const { phaseIdx, roundIdx, remaining, isRunning, isDone, currentPhase, start, pause, reset } =
    useIntervalTimer(activePhases, activeRounds)

  const progress = currentPhase ? remaining / currentPhase.duration : 0
  const totalDurationPerRound = activePhases.reduce((s, p) => s + p.duration, 0)
  const totalTime = totalDurationPerRound * activeRounds

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Timer display */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 min-h-[400px]">
        <AnimatePresence mode="wait">
          {isDone ? (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4 text-center"
            >
              <div className="w-24 h-24 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-5xl">🎉</div>
              <h3 className="text-2xl font-black text-emerald-400">Complete!</h3>
              <p className="text-surface-400 text-sm">All {activeRounds} rounds done</p>
              <button onClick={reset} className="btn-primary flex items-center gap-2">
                <RotateCcw size={14} /> Start Over
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={phaseIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-6"
            >
              {/* Phase label */}
              <div className="flex items-center gap-2">
                {activePhases.map((p, i) => (
                  <div key={i} className={cn(
                    'px-3 py-1 rounded-full text-xs font-bold transition-all',
                    i === phaseIdx ? 'scale-110' : 'opacity-40 scale-90'
                  )}
                    style={{
                      backgroundColor: `${p.color}20`,
                      border: `1px solid ${p.color}50`,
                      color: p.color
                    }}>
                    {p.label}
                  </div>
                ))}
              </div>

              {/* Circular progress */}
              <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
                <svg width={200} height={200} className="-rotate-90" style={{ position: 'absolute' }}>
                  <circle cx={100} cy={100} r={88} fill="none" stroke="currentColor" strokeWidth={10}
                    className="text-surface-700/60" />
                  <motion.circle
                    cx={100} cy={100} r={88} fill="none"
                    stroke={currentPhase?.color ?? '#3b82f6'}
                    strokeWidth={10} strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 88}
                    strokeDashoffset={2 * Math.PI * 88 * (1 - progress)}
                    style={{ filter: `drop-shadow(0 0 8px ${currentPhase?.color ?? '#3b82f6'}60)` }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                </svg>
                <div className="z-10 flex flex-col items-center">
                  <span className="text-5xl font-mono font-black" style={{ color: currentPhase?.color ?? '#3b82f6' }}>
                    {formatSecs(remaining)}
                  </span>
                  <span className="text-sm text-surface-400 mt-1">{currentPhase?.label}</span>
                  <span className="text-xs text-surface-500 mt-0.5">Round {roundIdx + 1} / {activeRounds}</span>
                </div>
              </div>

              {/* Phase timeline */}
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {activePhases.map((p, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className={cn(
                      'h-1.5 rounded-full transition-all',
                      i === phaseIdx ? 'w-8' : 'w-4 opacity-40'
                    )} style={{ backgroundColor: p.color }} />
                    <span className="text-[10px] text-surface-500">{p.label}</span>
                    <ChevronRight size={10} className="text-surface-600" />
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <button onClick={reset}
                  className="w-12 h-12 rounded-xl bg-surface-800 border border-surface-700 text-surface-400 hover:text-white hover:border-surface-500 transition-all flex items-center justify-center">
                  <RotateCcw size={18} />
                </button>
                <button
                  onClick={isRunning ? pause : start}
                  className={cn(
                    'w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all',
                    isRunning
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-400 hover:bg-amber-500/30'
                      : 'bg-brand-600/20 border-brand-500/60 text-brand-400 hover:bg-brand-600/30'
                  )}>
                  {isRunning ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <div className="text-xs text-surface-500 text-center w-12">
                  <div className="font-mono text-surface-400">{formatSecs(totalTime)}</div>
                  <div>total</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Config panel */}
      <div className="lg:w-80 flex flex-col gap-3">
        {/* Tabs */}
        <div className="flex gap-1 bg-surface-800/60 rounded-xl p-1">
          {(['presets', 'custom'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); reset() }}
              className={cn(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize',
                tab === t ? 'bg-brand-600 text-white' : 'text-surface-400 hover:text-white'
              )}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'presets' ? (
          <div className="flex flex-col gap-2">
            {PRESETS.map(p => (
              <button key={p.name}
                onClick={() => { setSelectedPreset(p); reset() }}
                className={cn(
                  'text-left p-3 rounded-xl border transition-all',
                  selectedPreset.name === p.name
                    ? 'bg-brand-600/10 border-brand-500/40'
                    : 'bg-surface-800/40 border-surface-700 hover:border-surface-600'
                )}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>{p.name}</span>
                  <span className="text-xs text-surface-500">{p.rounds} rounds</span>
                </div>
                <p className="text-xs text-surface-500">{p.description}</p>
                <div className="flex gap-1.5 mt-2">
                  {p.phases.map((ph, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${ph.color}20`, color: ph.color, border: `1px solid ${ph.color}40` }}>
                      {ph.label} {ph.duration}s
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-surface-300">Phases</span>
              <button onClick={() => setCustomPhases(prev => [...prev, { label: 'Phase', duration: 30, color: '#8b5cf6' }])}
                className="text-xs text-brand-400 hover:text-brand-300 transition-all">+ Add phase</button>
            </div>
            {customPhases.map((ph, i) => (
              <div key={i} className="flex items-center gap-2 bg-surface-800/40 border border-surface-700 rounded-xl p-2.5">
                <input type="color" value={ph.color} onChange={e => setCustomPhases(prev => prev.map((p, j) => j === i ? { ...p, color: e.target.value } : p))}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0" />
                <input value={ph.label} onChange={e => setCustomPhases(prev => prev.map((p, j) => j === i ? { ...p, label: e.target.value } : p))}
                  className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'rgb(var(--color-text-primary))' }} />
                <input type="number" min={1} value={ph.duration} onChange={e => setCustomPhases(prev => prev.map((p, j) => j === i ? { ...p, duration: Number(e.target.value) } : p))}
                  className="w-16 input-base text-xs py-1 text-center" />
                <span className="text-xs text-surface-500">s</span>
                {customPhases.length > 1 && (
                  <button onClick={() => setCustomPhases(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 transition-all text-xs">✕</button>
                )}
              </div>
            ))}
            <div className="flex items-center gap-2">
              <label className="text-xs text-surface-400">Rounds:</label>
              <input type="number" min={1} max={99} value={rounds} onChange={e => setRounds(Number(e.target.value))}
                className="w-16 input-base text-xs py-1 text-center" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
