import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { Plus, Trash2, RotateCcw, Volume2, VolumeX, History, Shuffle, ChevronDown } from 'lucide-react'
import { cn } from '@utils/index'

const WHEEL_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#84cc16', '#6366f1', '#14b8a6', '#d946ef',
]

interface WheelItem {
  id: string
  label: string
  weight: number
  color: string
}

const PRESETS = {
  'Yes / No': [
    { id: '1', label: 'Yes', weight: 1, color: '#10b981' },
    { id: '2', label: 'No', weight: 1, color: '#ef4444' },
  ],
  'Team Picker': [
    { id: '1', label: 'Team A', weight: 1, color: '#3b82f6' },
    { id: '2', label: 'Team B', weight: 1, color: '#f59e0b' },
    { id: '3', label: 'Team C', weight: 1, color: '#10b981' },
    { id: '4', label: 'Team D', weight: 1, color: '#ef4444' },
  ],
  'Numbers 1-6': Array.from({ length: 6 }, (_, i) => ({
    id: String(i + 1), label: String(i + 1), weight: 1, color: WHEEL_COLORS[i],
  })),
  'Lucky Draw': [
    { id: '1', label: '🥇 1st Prize', weight: 1, color: '#f59e0b' },
    { id: '2', label: '🥈 2nd Prize', weight: 2, color: '#94a3b8' },
    { id: '3', label: '🥉 3rd Prize', weight: 3, color: '#cd7c3e' },
    { id: '4', label: 'Try Again', weight: 6, color: '#64748b' },
  ],
}

function playWheelSound(freq: number) {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.05, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
    osc.start(); osc.stop(ctx.currentTime + 0.05)
  } catch {}
}

function Confetti({ trigger }: { trigger: boolean }) {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i, x: 40 + Math.random() * 20, color: WHEEL_COLORS[i % WHEEL_COLORS.length],
    delay: Math.random() * 0.3, size: 6 + Math.random() * 8,
    dx: (Math.random() - 0.5) * 300, dy: -(200 + Math.random() * 200),
  }))
  return (
    <AnimatePresence>
      {trigger && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 20 }}>
          {particles.map(p => (
            <motion.div key={p.id}
              style={{ position: 'absolute', top: '50%', left: `${p.x}%`, width: p.size, height: p.size, backgroundColor: p.color, borderRadius: 2 }}
              initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
              animate={{ opacity: 0, x: p.dx, y: p.dy, rotate: 720 }}
              transition={{ duration: 1.5, delay: p.delay, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

function WheelCanvas({ items, rotation }: { items: WheelItem[]; rotation: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const totalWeight = items.reduce((s, i) => s + i.weight, 0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || items.length === 0) return
    const ctx = canvas.getContext('2d')!
    const size = canvas.width
    const cx = size / 2, cy = size / 2, r = cx - 8

    ctx.clearRect(0, 0, size, size)

    let angle = (rotation * Math.PI) / 180
    items.forEach(item => {
      const slice = (item.weight / totalWeight) * 2 * Math.PI
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, angle, angle + slice)
      ctx.closePath()
      ctx.fillStyle = item.color
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Label
      const mid = angle + slice / 2
      const lx = cx + (r * 0.65) * Math.cos(mid)
      const ly = cy + (r * 0.65) * Math.sin(mid)
      ctx.save()
      ctx.translate(lx, ly)
      ctx.rotate(mid + Math.PI / 2)
      ctx.fillStyle = 'white'
      ctx.font = `bold ${Math.max(10, Math.min(14, 180 / items.length))}px system-ui`
      ctx.textAlign = 'center'
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 3
      const label = item.label.length > 12 ? item.label.slice(0, 12) + '…' : item.label
      ctx.fillText(label, 0, 4)
      ctx.restore()

      angle += slice
    })

    // Center circle
    ctx.beginPath()
    ctx.arc(cx, cy, 20, 0, 2 * Math.PI)
    ctx.fillStyle = '#1e2130'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [items, rotation, totalWeight])

  return <canvas ref={canvasRef} width={320} height={320} className="rounded-full" />
}

export const SpinnerWheelTool = () => {
  const [items, setItems] = useState<WheelItem[]>(PRESETS['Yes / No'])
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<WheelItem | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [history, setHistory] = useState<{ item: WheelItem; time: Date }[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [newWeight, setNewWeight] = useState(1)
  const [showPresets, setShowPresets] = useState(false)

  const soundInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const spin = useCallback(() => {
    if (isSpinning || items.length < 2) return
    setResult(null); setShowConfetti(false)

    const totalWeight = items.reduce((s, i) => s + i.weight, 0)
    const rand = Math.random() * totalWeight
    let cumulative = 0
    let winner = items[0]
    for (const item of items) {
      cumulative += item.weight
      if (rand < cumulative) { winner = item; break }
    }

    const winnerSliceCenter = items.reduce((acc, item) => {
      const slicePct = item.weight / totalWeight
      if (item.id === winner.id) return acc + slicePct / 2
      if (!acc) return acc + slicePct
      return acc
    }, 0) * 360

    const targetRotation = rotation + 1800 + (360 - (winnerSliceCenter % 360))
    const duration = 4000
    let lastTickRot = rotation
    let ticks = 0

    setIsSpinning(true)

    const start = Date.now()
    const animate = () => {
      const elapsed = Date.now() - start
      const t = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - t, 4) // ease-out quartic
      const current = rotation + (targetRotation - rotation) * ease

      setRotation(current)

      // Tick sound
      const rotDiff = Math.abs(current - lastTickRot)
      const sliceAngle = 360 / items.length
      if (rotDiff >= sliceAngle && soundEnabled) {
        const speed = rotDiff / (elapsed / 1000)
        const freq = 300 + Math.min(speed / 10, 500)
        playWheelSound(freq)
        lastTickRot = current
        ticks++
      }

      if (t < 1) {
        requestAnimationFrame(animate)
      } else {
        setRotation(targetRotation % 360)
        setIsSpinning(false)
        setResult(winner)
        setShowConfetti(true)
        setHistory(prev => [{ item: winner, time: new Date() }, ...prev].slice(0, 20))
        if (soundEnabled) playWheelSound(880)
        setTimeout(() => setShowConfetti(false), 2000)
      }
    }
    requestAnimationFrame(animate)
  }, [isSpinning, items, rotation, soundEnabled])

  const addItem = () => {
    if (!newLabel.trim()) return
    const color = WHEEL_COLORS[items.length % WHEEL_COLORS.length]
    setItems(prev => [...prev, { id: crypto.randomUUID(), label: newLabel.trim(), weight: newWeight, color }])
    setNewLabel(''); setNewWeight(1)
  }

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))
  const updateLabel = (id: string, label: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, label } : i))
  const updateWeight = (id: string, weight: number) => setItems(prev => prev.map(i => i.id === id ? { ...i, weight: Math.max(1, weight) } : i))
  const updateColor = (id: string, color: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, color } : i))

  const shuffle = () => setItems(prev => [...prev].sort(() => Math.random() - 0.5))

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Wheel */}
      <div className="flex flex-col items-center gap-4 flex-shrink-0">
        <div className="relative" style={{ width: 320, height: 320 }}>
          <Confetti trigger={showConfetti} />

          {/* Pointer */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 z-10">
            <div className="w-0 h-0" style={{
              borderTop: '12px solid transparent', borderBottom: '12px solid transparent',
              borderRight: '24px solid #f59e0b', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))'
            }} />
          </div>

          <WheelCanvas items={items} rotation={rotation} />

          {/* Shadow ring */}
          <div className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3), 0 0 0 4px rgba(255,255,255,0.08)' }} />
        </div>

        {/* Spin button */}
        <motion.button
          whileHover={{ scale: isSpinning ? 1 : 1.04 }}
          whileTap={{ scale: isSpinning ? 1 : 0.96 }}
          onClick={spin}
          disabled={isSpinning || items.length < 2}
          className={cn(
            'w-full max-w-[200px] py-3 rounded-2xl font-bold text-sm transition-all',
            isSpinning
              ? 'bg-surface-700 text-surface-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50'
          )}
        >
          {isSpinning ? '🌀 Spinning…' : '🎯 Spin!'}
        </motion.button>

        {/* Result */}
        <AnimatePresence>
          {result && !isSpinning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center p-4 rounded-2xl border min-w-[200px]"
              style={{ backgroundColor: `${result.color}20`, borderColor: `${result.color}50` }}
            >
              <p className="text-xs text-surface-400 mb-1">Result</p>
              <p className="text-xl font-black" style={{ color: result.color }}>{result.label}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {history.length > 0 && (
          <div className="w-full max-w-[320px]">
            <p className="text-xs font-semibold text-surface-500 flex items-center gap-1.5 mb-2">
              <History size={11} /> History
            </p>
            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto no-scrollbar">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between px-2.5 py-1.5 bg-surface-800/50 border border-surface-700 rounded-lg text-xs">
                  <span className="font-semibold" style={{ color: h.item.color }}>{h.item.label}</span>
                  <span className="text-surface-600 text-[10px]">{h.time.toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Configuration panel */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Presets + controls */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <button onClick={() => setShowPresets(v => !v)}
              className="flex items-center gap-2 px-3 py-2 bg-surface-800 border border-surface-700 rounded-xl text-xs font-medium text-surface-300 hover:text-white transition-all">
              Presets <ChevronDown size={12} />
            </button>
            <AnimatePresence>
              {showPresets && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute top-10 left-0 bg-surface-800 border border-surface-700 rounded-xl p-1.5 z-20 shadow-xl min-w-[160px]">
                  {Object.entries(PRESETS).map(([name, preset]) => (
                    <button key={name}
                      onClick={() => { setItems(preset.map((p, i) => ({ ...p, id: String(i) }))); setShowPresets(false); setResult(null) }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-surface-300 hover:text-white hover:bg-surface-700 transition-all">
                      {name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={shuffle} className="w-8 h-8 rounded-lg bg-surface-800 border border-surface-700 text-surface-400 hover:text-white flex items-center justify-center transition-all" title="Shuffle items">
              <Shuffle size={14} />
            </button>
            <button onClick={() => setSoundEnabled(v => !v)}
              className={cn('w-8 h-8 rounded-lg border flex items-center justify-center transition-all',
                soundEnabled ? 'bg-brand-600/20 border-brand-500/30 text-brand-400' : 'bg-surface-800 border-surface-700 text-surface-500')}>
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          </div>
        </div>

        {/* Add item */}
        <div className="flex gap-2 bg-surface-800/50 border border-surface-700 rounded-xl p-3">
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder="Item label..." className="input-base flex-1 text-sm py-1.5" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-surface-500">Weight:</span>
            <input type="number" min={1} max={10} value={newWeight} onChange={e => setNewWeight(Number(e.target.value))}
              className="input-base w-14 text-xs py-1.5 text-center" />
          </div>
          <button onClick={addItem} className="btn-primary py-1.5 px-3 text-sm">
            <Plus size={14} />
          </button>
        </div>

        {/* Items list */}
        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto no-scrollbar">
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">
            Items ({items.length})
          </p>
          <AnimatePresence initial={false}>
            {items.map(item => (
              <motion.div key={item.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2.5 p-2.5 bg-surface-800/50 border border-surface-700 rounded-xl group">
                <input type="color" value={item.color} onChange={e => updateColor(item.id, e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 flex-shrink-0" />
                <input value={item.label} onChange={e => updateLabel(item.id, e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none min-w-0" style={{ color: 'rgb(var(--color-text-primary))' }} />
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] text-surface-500">×</span>
                  <input type="number" min={1} max={10} value={item.weight} onChange={e => updateWeight(item.id, Number(e.target.value))}
                    className="w-10 text-center bg-surface-700 border border-surface-600 rounded-md text-xs py-0.5 outline-none" style={{ color: 'rgb(var(--color-text-primary))' }} />
                </div>
                <button onClick={() => removeItem(item.id)}
                  className="w-6 h-6 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-600/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 size={11} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {items.length === 0 && (
            <div className="text-center py-8 text-surface-500 text-sm">
              Add items above to spin the wheel
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-surface-500 bg-surface-800/30 border border-surface-700/40 rounded-xl p-3">
          <span className="font-semibold text-surface-400">Weight</span> controls probability — higher weight = more likely to be picked.
          Max weight per item: <span className="text-brand-400">10</span>
        </div>
      </div>
    </div>
  )
}
