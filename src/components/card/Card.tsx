import { cn } from '@utils/index'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export const Card = ({ children, className, hover = false, padding = 'md' }: CardProps) => (
  <div
    className={cn(
      'bg-surface-900 border border-surface-700 rounded-xl',
      paddingClasses[padding],
      hover && 'card-hover cursor-pointer',
      className,
    )}
  >
    {children}
  </div>
)

interface CardHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export const CardHeader = ({ title, subtitle, actions, className }: CardHeaderProps) => (
  <div className={cn('flex items-start justify-between gap-3 mb-4', className)}>
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {subtitle && <p className="text-xs text-surface-400 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
  </div>
)
