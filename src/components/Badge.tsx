import { cn } from '@utils/index'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'cyan'
  size?: 'sm' | 'md'
  className?: string
}

const variantClasses = {
  default: 'bg-surface-700 text-surface-300',
  success: 'bg-green-500/15 text-green-400 border border-green-500/25',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  danger: 'bg-red-500/15 text-red-400 border border-red-500/25',
  info: 'bg-brand-500/15 text-brand-400 border border-brand-500/25',
  purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/25',
  cyan: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25',
}

const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0.5 rounded-md',
  md: 'text-xs px-2 py-0.5 rounded-lg',
}

export const Badge = ({ children, variant = 'default', size = 'md', className }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center font-semibold',
      variantClasses[variant],
      sizeClasses[size],
      className,
    )}
  >
    {children}
  </span>
)
