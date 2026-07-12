import { motion } from 'framer-motion'
import { cn } from '@utils/index'

interface SettingsPanelProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

export const SettingsPanel = ({ title, icon, children, className, actions }: SettingsPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-xl border border-surface-700/50 bg-surface-800/30 overflow-hidden', className)}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/30">
        <div className="flex items-center gap-2">
          {icon && <span className="text-surface-400">{icon}</span>}
          <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">{title}</p>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </motion.div>
  )
}

export const SettingRow = ({
  label,
  description,
  children,
  className,
}: {
  label: string
  description?: string
  children: React.ReactNode
  className?: string
}) => (
  <div className={cn('flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2', className)}>
    <div className="min-w-0">
      <p className="text-sm font-medium text-surface-100">{label}</p>
      {description && <p className="text-xs text-surface-400 mt-0.5">{description}</p>}
    </div>
    <div className="flex-shrink-0 sm:w-48">{children}</div>
  </div>
)

export const Slider = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  className,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  label?: string
  className?: string
}) => (
  <div className={cn('flex items-center gap-3', className)}>
    <input
      type="range"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      className="flex-1 h-1.5 rounded-full appearance-none bg-surface-700 accent-brand-500 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:shadow-glow-sm"
      aria-label={label || 'Slider'}
    />
    <span className="text-xs font-mono text-surface-300 w-8 text-right">{value}</span>
  </div>
)
