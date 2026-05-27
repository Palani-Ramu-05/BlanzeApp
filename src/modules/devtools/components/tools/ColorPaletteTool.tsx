import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Shuffle, Copy } from 'lucide-react'
import { ToolWrapper, Slider, ToolButton } from '../ToolShared'
import {
  generateTints, generateShades, generateHues,
  generateAnalogous, generateComplementary, generateTriadic, generateTransparentSteps,
  isValidHex, hexToRgb, rgbToHsl,
} from '../../utils/colorUtils'
import { cn } from '@utils/index'
import toast from 'react-hot-toast'

const PALETTE_TYPES = [
  { id: 'tints', label: 'Tints' },
  { id: 'shades', label: 'Shades' },
  { id: 'hues', label: 'Hues' },
  { id: 'analogous', label: 'Analogous' },
  { id: 'complementary', label: 'Complementary' },
  { id: 'triadic', label: 'Triadic' },
  { id: 'transparent', label: 'Transparent' },
] as const
type PaletteType = (typeof PALETTE_TYPES)[number]['id']

const randomHex = () => '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')

export const ColorPaletteTool = () => {
  const [baseColor, setBaseColor] = useState('#3b82f6')
  const [paletteType, setPaletteType] = useState<PaletteType>('tints')
  const [steps, setSteps] = useState(10)
  const [hexInput, setHexInput] = useState('#3b82f6')

  const palette = useMemo(() => {
    const color = isValidHex(hexInput) ? hexInput : baseColor
    switch (paletteType) {
      case 'tints': return generateTints(color, steps)
      case 'shades': return generateShades(color, steps)
      case 'hues': return generateHues(color, steps)
      case 'analogous': return generateAnalogous(color)
      case 'complementary': return generateComplementary(color)
      case 'triadic': return generateTriadic(color)
      case 'transparent': return generateTransparentSteps(color, steps)
      default: return []
    }
  }, [hexInput, baseColor, paletteType, steps])

  const handleColorChange = (val: string) => {
    setHexInput(val)
    if (isValidHex(val)) setBaseColor(val)
  }

  const copyAll = () => {
    navigator.clipboard.writeText(palette.join('\n'))
    toast.success(`Copied ${palette.length} colors`)
  }

  const getTextColor = (hex: string) => {
    if (hex.startsWith('rgba')) return '#fff'
    const rgb = hexToRgb(hex)
    if (!rgb) return '#fff'
    const hsl = rgbToHsl(rgb)
    return hsl.l > 50 ? '#000' : '#fff'
  }

  return (
    <ToolWrapper>
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Base Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={isValidHex(hexInput) ? hexInput : '#3b82f6'}
              onChange={e => handleColorChange(e.target.value)}
              className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0"
            />
            <input
              value={hexInput}
              onChange={e => handleColorChange(e.target.value)}
              className="w-28 px-3 py-2 font-mono text-sm rounded-xl bg-surface-900 border border-surface-700/60 text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-colors"
            />
          </div>
        </div>

        {['tints', 'shades', 'hues', 'transparent'].includes(paletteType) && (
          <div className="flex-1 min-w-[160px]">
            <Slider label="Color Steps" value={steps} min={3} max={20} onChange={setSteps} />
          </div>
        )}

        <div className="flex gap-1.5">
          <ToolButton variant="ghost" size="sm" icon={<Shuffle size={12} />} onClick={() => handleColorChange(randomHex())}>
            Random
          </ToolButton>
          <ToolButton variant="secondary" size="sm" icon={<Copy size={12} />} onClick={copyAll}>
            Copy All
          </ToolButton>
        </div>
      </div>

      {/* Palette type pills */}
      <div className="flex flex-wrap gap-1.5">
        {PALETTE_TYPES.map(pt => (
          <button
            key={pt.id}
            onClick={() => setPaletteType(pt.id)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border',
              paletteType === pt.id
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-surface-800 text-surface-400 border-surface-700/40 hover:border-surface-600 hover:text-white',
            )}
          >
            {pt.label}
          </button>
        ))}
      </div>

      {/* Palette display */}
      <div>
        <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-2">
          {PALETTE_TYPES.find(p => p.id === paletteType)?.label} — {palette.length} colors
        </p>
        <div className="flex flex-wrap gap-2">
          {palette.map((color, i) => (
            <motion.div
              key={`${color}-${i}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="group relative"
            >
              <div
                className="w-16 h-16 rounded-xl cursor-pointer hover:scale-110 transition-transform ring-1 ring-white/10 flex items-end justify-center pb-1"
                style={{ backgroundColor: color }}
                onClick={() => { navigator.clipboard.writeText(color); toast.success('Copied!') }}
                title={color}
              >
                <span className="text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity px-1 py-0.5 rounded-md bg-black/30" style={{ color: getTextColor(color) }}>
                  {color.length > 8 ? 'Copy' : color.toUpperCase()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* List view */}
        <div className="mt-4 space-y-1 max-h-48 overflow-y-auto no-scrollbar">
          {palette.map((color, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-surface-800/60 transition-colors group">
              <div className="w-5 h-5 rounded-md ring-1 ring-white/10 flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs font-mono text-surface-300 flex-1">{color}</span>
              <button onClick={() => { navigator.clipboard.writeText(color); toast.success('Copied!') }}
                className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Copy size={11} className="text-surface-400 hover:text-white" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </ToolWrapper>
  )
}
