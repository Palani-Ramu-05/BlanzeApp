import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import { ToolWrapper, CopyButton, ToolButton } from '../ToolShared'
import { mixColors, hexToRgb, rgbToHsl } from '../../utils/colorUtils'
import { cn } from '@utils/index'

const uid = () => Math.random().toString(36).slice(2, 8)
const DEFAULT_COLORS = [
  { id: uid(), value: '#22c55e' },
  { id: uid(), value: '#1d4ed8' },
  { id: uid(), value: '#bef264' },
]

export const ColorMixerTool = () => {
  const [colors, setColors] = useState(DEFAULT_COLORS)

  const mixed = useMemo(() => mixColors(colors.map(c => c.value)), [colors])

  const getTextColor = (hex: string) => {
    const rgb = hexToRgb(hex)
    if (!rgb) return '#fff'
    return rgbToHsl(rgb).l > 50 ? '#000' : '#fff'
  }

  const add = () => colors.length < 5 && setColors(c => [...c, { id: uid(), value: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0') }])
  const remove = (id: string) => colors.length > 2 && setColors(c => c.filter(x => x.id !== id))
  const update = (id: string, val: string) => setColors(c => c.map(x => x.id === id ? { ...x, value: val } : x))

  return (
    <ToolWrapper className="max-w-lg">
      {/* Mixed result */}
      <div>
        <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-2 block">Mixed Result</label>
        <motion.div
          key={mixed}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          className="h-20 rounded-2xl ring-1 ring-white/10 flex items-center justify-between px-4"
          style={{ backgroundColor: mixed }}
        >
          <span className="text-sm font-bold" style={{ color: getTextColor(mixed) }}>{mixed.toUpperCase()}</span>
          <CopyButton value={mixed} className="opacity-70 hover:opacity-100" />
        </motion.div>
      </div>

      {/* Input colors */}
      <div className="space-y-2">
        {colors.map((c, i) => (
          <motion.div key={c.id} layout className="flex items-center gap-3">
            <div
              className="h-10 flex-1 rounded-xl ring-1 ring-white/10"
              style={{ backgroundColor: c.value }}
            />
            <input
              type="color"
              value={c.value}
              onChange={e => update(c.id, e.target.value)}
              className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 flex-shrink-0"
            />
            <input
              value={c.value}
              onChange={e => update(c.id, e.target.value)}
              className="w-24 px-2.5 py-2 font-mono text-xs rounded-xl bg-surface-900 border border-surface-700/60 text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50"
            />
            <button
              onClick={() => remove(c.id)}
              className={cn('w-7 h-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0',
                colors.length > 2 ? 'text-surface-500 hover:text-red-400 hover:bg-red-500/10' : 'text-surface-700 cursor-not-allowed')}
            >
              <Trash2 size={13} />
            </button>
          </motion.div>
        ))}
      </div>

      {colors.length < 5 && (
        <ToolButton variant="ghost" size="sm" icon={<Plus size={12} />} onClick={add}>
          Add color ({colors.length}/5)
        </ToolButton>
      )}
    </ToolWrapper>
  )
}
