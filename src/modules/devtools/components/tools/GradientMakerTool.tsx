import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Copy, RotateCcw } from 'lucide-react'
import { ToolWrapper, Slider, ToolButton, CopyButton } from '../ToolShared'
import { cn } from '@utils/index'
import toast from 'react-hot-toast'

interface ColorStop { id: string; color: string; position: number }
const uid = () => Math.random().toString(36).slice(2, 8)

const DEFAULT_STOPS: ColorStop[] = [
  { id: uid(), color: '#6366f1', position: 0 },
  { id: uid(), color: '#8b5cf6', position: 50 },
  { id: uid(), color: '#ec4899', position: 100 },
]

export const GradientMakerTool = () => {
  const [stops, setStops] = useState<ColorStop[]>(DEFAULT_STOPS)
  const [type, setType] = useState<'linear' | 'radial'>('linear')
  const [angle, setAngle] = useState(135)
  const [outputFormat, setOutputFormat] = useState<'css' | 'tailwind'>('css')

  const sortedStops = useMemo(() => [...stops].sort((a, b) => a.position - b.position), [stops])

  const gradientCSS = useMemo(() => {
    const stopsStr = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ')
    return type === 'linear'
      ? `linear-gradient(${angle}deg, ${stopsStr})`
      : `radial-gradient(circle, ${stopsStr})`
  }, [sortedStops, type, angle])

  const cssOutput = `background: ${gradientCSS};`
  const tailwindOutput = `bg-gradient-to-r from-[${stops[0]?.color}] via-[${stops[1]?.color}] to-[${stops[stops.length - 1]?.color}]`

  const addStop = () => setStops(s => [...s, { id: uid(), color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'), position: 50 }])
  const removeStop = (id: string) => stops.length > 2 && setStops(s => s.filter(stop => stop.id !== id))
  const updateStop = (id: string, field: keyof ColorStop, val: string | number) =>
    setStops(s => s.map(stop => stop.id === id ? { ...stop, [field]: val } : stop))

  return (
    <ToolWrapper>
      {/* Live preview */}
      <motion.div
        className="h-32 rounded-2xl w-full ring-1 ring-white/10"
        style={{ background: gradientCSS }}
        key={gradientCSS}
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 1 }}
      />

      {/* Type + angle */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1 p-1 bg-surface-800 rounded-xl border border-surface-700/40">
          {(['linear', 'radial'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${type === t ? 'bg-brand-600 text-white' : 'text-surface-400 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>
        {type === 'linear' && (
          <div className="flex-1 min-w-[180px]">
            <Slider label="Rotation Angle" value={angle} min={0} max={360} onChange={setAngle} displayValue={`${angle}°`} />
          </div>
        )}
      </div>

      {/* Color stops */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Color Stops ({stops.length})</label>
          {stops.length < 6 && <ToolButton variant="ghost" size="sm" icon={<Plus size={12} />} onClick={addStop}>Add stop</ToolButton>}
        </div>
        {stops.map((stop, i) => (
          <motion.div key={stop.id} layout className="flex items-center gap-3">
            <input type="color" value={stop.color}
              onChange={e => updateStop(stop.id, 'color', e.target.value)}
              className="w-9 h-9 rounded-xl cursor-pointer border-0 p-0 flex-shrink-0" />
            <input value={stop.color} onChange={e => updateStop(stop.id, 'color', e.target.value)}
              className="w-24 px-2.5 py-2 font-mono text-xs rounded-xl bg-surface-900 border border-surface-700/60 text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50" />
            <div className="flex-1 flex items-center gap-2">
              <span className="text-[10px] text-surface-500">{stop.position}%</span>
              <input type="range" min={0} max={100} value={stop.position}
                onChange={e => updateStop(stop.id, 'position', Number(e.target.value))}
                className="flex-1 h-1.5 rounded-full accent-brand-500 cursor-pointer" />
            </div>
            <button onClick={() => removeStop(stop.id)}
              className={cn('w-7 h-7 flex items-center justify-center rounded-lg transition-colors', stops.length > 2 ? 'text-surface-500 hover:text-red-400 hover:bg-red-500/10' : 'text-surface-700 cursor-not-allowed')}>
              <Trash2 size={13} />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 p-1 bg-surface-800 rounded-xl border border-surface-700/40">
            {(['css', 'tailwind'] as const).map(f => (
              <button key={f} onClick={() => setOutputFormat(f)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all uppercase ${outputFormat === f ? 'bg-brand-600 text-white' : 'text-surface-400 hover:text-white'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <CopyButton value={outputFormat === 'css' ? cssOutput : tailwindOutput} />
            <button onClick={() => setStops(DEFAULT_STOPS)} className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors">
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
        <div className="p-3 bg-surface-900 border border-surface-700/40 rounded-xl font-mono text-xs text-emerald-300 break-all">
          {outputFormat === 'css' ? cssOutput : tailwindOutput}
        </div>
      </div>
    </ToolWrapper>
  )
}
