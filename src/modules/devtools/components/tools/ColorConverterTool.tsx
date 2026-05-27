import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Shuffle } from 'lucide-react'
import { ToolWrapper, CopyButton, ToolButton } from '../ToolShared'
import {
  hexToRgb, rgbToHex, rgbToHsl, rgbToHwb, rgbToCmyk, isValidHex, getContrastRatio,
} from '../../utils/colorUtils'
import { cn } from '@utils/index'

const randomHex = () => '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')

export const ColorConverterTool = () => {
  const [hex, setHex] = useState('#144c85')
  const [error, setError] = useState('')

  const rgb = hexToRgb(hex)
  const hsl = rgb ? rgbToHsl(rgb) : null
  const hwb = rgb ? rgbToHwb(rgb) : null
  const cmyk = rgb ? rgbToCmyk(rgb) : null
  const contrast = rgb ? getContrastRatio(hex, '#ffffff') : null

  const handleHexInput = useCallback((val: string) => {
    const normalized = val.startsWith('#') ? val : '#' + val
    setHex(normalized)
    setError(isValidHex(normalized) ? '' : 'Invalid hex color')
  }, [])

  const outputs = rgb && hsl && hwb && cmyk ? [
    { label: 'HEX', value: hex.toLowerCase(), display: hex.toLowerCase() },
    { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, display: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
    { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, display: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
    { label: 'HWB', value: `hwb(${hwb.h} ${hwb.w}% ${hwb.b}%)`, display: `hwb(${hwb.h} ${hwb.w}% ${hwb.b}%)` },
    { label: 'CMYK', value: `device-cmyk(${cmyk.c}% ${cmyk.m}% ${cmyk.y}% ${cmyk.k}%)`, display: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)` },
  ] : []

  return (
    <ToolWrapper className="max-w-2xl">
      {/* Color picker + hex input */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={isValidHex(hex) ? hex : '#000000'}
            onChange={e => handleHexInput(e.target.value)}
            className="w-14 h-14 rounded-xl cursor-pointer border-0 p-0 bg-transparent"
            style={{ appearance: 'none' }}
          />
          <div className="absolute inset-0 rounded-xl pointer-events-none ring-1 ring-white/10" />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">HEX Color</label>
          <input
            value={hex}
            onChange={e => handleHexInput(e.target.value)}
            placeholder="#144c85"
            className={cn(
              'w-full px-3 py-2.5 font-mono text-sm rounded-xl bg-surface-900 border text-white',
              'focus:outline-none focus:ring-1 transition-colors',
              error ? 'border-red-500/60 focus:ring-red-500/30' : 'border-surface-700/60 focus:ring-brand-500/50 focus:border-brand-500/50',
            )}
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <ToolButton variant="ghost" size="sm" icon={<Shuffle size={13} />} onClick={() => handleHexInput(randomHex())}>
          Random
        </ToolButton>
      </div>

      {/* Color preview band */}
      {rgb && (
        <motion.div
          key={hex}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          className="h-16 rounded-xl overflow-hidden relative flex items-center justify-between px-4"
          style={{ backgroundColor: hex }}
        >
          <span className="text-[11px] font-bold" style={{ color: contrast && contrast > 4.5 ? '#000' : '#fff' }}>
            {hex.toUpperCase()}
          </span>
          {contrast && (
            <span className="text-[10px] font-semibold opacity-80" style={{ color: contrast > 4.5 ? '#000' : '#fff' }}>
              Contrast vs white: {contrast}:1 {contrast >= 4.5 ? '✓ AA' : '✗ Fails AA'}
            </span>
          )}
        </motion.div>
      )}

      {/* Output formats */}
      <div className="space-y-2">
        {outputs.map(out => (
          <motion.div
            key={out.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 px-4 py-3 bg-surface-900 border border-surface-700/40 rounded-xl group hover:border-surface-600/60 transition-colors"
          >
            <span className="text-xs font-bold text-surface-500 w-12 flex-shrink-0">{out.label}</span>
            <span className="flex-1 font-mono text-sm text-white">{out.display}</span>
            <div className="w-6 h-6 rounded-lg flex-shrink-0 ring-1 ring-white/10" style={{ backgroundColor: hex }} />
            <CopyButton value={out.value} />
          </motion.div>
        ))}
      </div>

      {/* Contrast checker */}
      {contrast && rgb && (
        <div className="flex items-center gap-4 px-4 py-3 bg-surface-800/60 border border-surface-700/40 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: hex }} />
            <span className="text-lg font-black" style={{ color: hex }}>Aa</span>
          </div>
          <div>
            <p className="text-xs font-bold text-white">Contrast Ratio: {contrast}:1</p>
            <p className="text-[10px] text-surface-400">
              WCAG AA: <span className={contrast >= 4.5 ? 'text-green-400' : 'text-red-400'}>{contrast >= 4.5 ? '✓ Pass' : '✗ Fail'}</span>
              {'  '}·{'  '}
              WCAG AAA: <span className={contrast >= 7 ? 'text-green-400' : 'text-red-400'}>{contrast >= 7 ? '✓ Pass' : '✗ Fail'}</span>
            </p>
          </div>
        </div>
      )}
    </ToolWrapper>
  )
}
