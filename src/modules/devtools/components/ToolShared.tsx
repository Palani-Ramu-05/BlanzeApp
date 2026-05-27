import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, RotateCcw } from 'lucide-react'
import { useState, useCallback } from 'react'
import { cn } from '@utils/index'
import toast from 'react-hot-toast'

interface ToolWrapperProps {
  children: ReactNode
  className?: string
}

export const ToolWrapper = ({ children, className }: ToolWrapperProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className={cn('space-y-4', className)}
  >
    {children}
  </motion.div>
)

// ── Shared panel block ───────────────────────────────────────

interface PanelProps {
  label?: string
  children: ReactNode
  className?: string
  actions?: ReactNode
}

export const Panel = ({ label, children, className, actions }: PanelProps) => (
  <div className={cn('rounded-xl border border-surface-700/60 overflow-hidden', className)}>
    {(label || actions) && (
      <div className="flex items-center justify-between px-3 py-2 bg-surface-800/60 border-b border-surface-700/40">
        {label && <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">{label}</span>}
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
    )}
    <div className="p-3 bg-surface-900/60">{children}</div>
  </div>
)

// ── Copy button ──────────────────────────────────────────────

export const CopyButton = ({ value, className }: { value: string; className?: string }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch { toast.error('Copy failed') }
  }, [value])
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleCopy}
      className={cn('w-7 h-7 flex items-center justify-center rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors', className)}
      title="Copy"
    >
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </motion.button>
  )
}

// ── Reset button ─────────────────────────────────────────────

export const ResetButton = ({ onClick, className }: { onClick: () => void; className?: string }) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={cn('w-7 h-7 flex items-center justify-center rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors', className)}
    title="Reset"
  >
    <RotateCcw size={13} />
  </motion.button>
)

// ── Styled textarea ──────────────────────────────────────────

interface StyledTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  mono?: boolean
  actions?: ReactNode
}

export const StyledTextarea = ({ label, error, mono, actions, className, ...props }: StyledTextareaProps) => (
  <div className="space-y-1.5">
    {(label || actions) && (
      <div className="flex items-center justify-between">
        {label && <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">{label}</label>}
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
    )}
    <textarea
      className={cn(
        'w-full min-h-[120px] px-3 py-2.5 text-sm rounded-xl bg-surface-900 border border-surface-700/60 text-white placeholder-surface-500',
        'focus:outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/50',
        'resize-none transition-colors',
        mono && 'font-mono text-xs',
        error && 'border-red-500/50',
        className,
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
)

// ── Styled input ─────────────────────────────────────────────

interface StyledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  mono?: boolean
  actions?: ReactNode
}

export const StyledInput = ({ label, error, mono, actions, className, ...props }: StyledInputProps) => (
  <div className="space-y-1.5">
    {(label || actions) && (
      <div className="flex items-center justify-between">
        {label && <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">{label}</label>}
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
    )}
    <input
      className={cn(
        'w-full px-3 py-2.5 text-sm rounded-xl bg-surface-900 border border-surface-700/60 text-white placeholder-surface-500',
        'focus:outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/50 transition-colors',
        mono && 'font-mono text-xs',
        error && 'border-red-500/50',
        className,
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
)

// ── Slider ───────────────────────────────────────────────────

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  displayValue?: string | number
}

export const Slider = ({ label, value, min, max, step = 1, onChange, displayValue }: SliderProps) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-xs font-semibold text-surface-300">{label}</label>
      <span className="text-xs font-mono text-brand-400 bg-surface-800 border border-surface-700/40 px-2 py-0.5 rounded-lg">
        {displayValue ?? value}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full accent-brand-500 cursor-pointer bg-surface-700"
    />
  </div>
)

// ── ToolButton ───────────────────────────────────────────────

interface ToolButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  icon?: ReactNode
}

export const ToolButton = ({ variant = 'primary', size = 'md', icon, children, className, ...props }: ToolButtonProps) => {
  const v = {
    primary: 'bg-brand-600 hover:bg-brand-500 text-white border border-brand-600',
    secondary: 'bg-surface-800 hover:bg-surface-700 text-white border border-surface-700/60',
    ghost: 'bg-transparent hover:bg-surface-800 text-surface-300 hover:text-white border border-surface-700/40',
    danger: 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30',
  }
  const s = { sm: 'px-3 py-1.5 text-xs gap-1.5', md: 'px-4 py-2 text-sm gap-2' }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        v[variant], s[size], className,
      )}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {icon}
      {children}
    </button>
  )
}

// ── Checkbox ─────────────────────────────────────────────────

interface CheckboxRowProps {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}

export const CheckboxRow = ({ label, checked, onChange }: CheckboxRowProps) => (
  <label className="flex items-center gap-2.5 cursor-pointer group">
    <div
      className={cn(
        'w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0',
        checked ? 'bg-brand-600 border-brand-600' : 'bg-surface-800 border-surface-600 group-hover:border-surface-500',
      )}
      onClick={() => onChange(!checked)}
    >
      {checked && <Check size={10} className="text-white" strokeWidth={3} />}
    </div>
    <span className="text-sm text-surface-300 group-hover:text-white transition-colors">{label}</span>
  </label>
)
