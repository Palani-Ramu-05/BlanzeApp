import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@utils/index'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline' | 'link'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 hover:bg-brand-500 text-white border border-brand-600 hover:border-brand-500 shadow-sm',
  secondary:
    'bg-surface-800 hover:bg-surface-700 text-surface-200 hover:text-surface-100 border border-surface-600 hover:border-surface-500',
  ghost:
    'bg-transparent hover:bg-surface-800/60 text-surface-400 hover:text-surface-100 border border-transparent',
  danger:
    'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40',
  success:
    'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40',
  outline:
    'bg-transparent hover:bg-surface-800 text-surface-300 border border-surface-600 hover:border-brand-500 hover:text-brand-400',
  link: 'bg-transparent text-brand-400 hover:text-brand-300 border-none underline-offset-4 hover:underline p-0',
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-[11px] rounded-lg gap-1.5',
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-9 px-4 text-sm rounded-lg gap-2',
  lg: 'h-11 px-5 text-sm rounded-xl gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-150 select-none',
          'active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900',
          variant === 'primary' && 'focus-visible:ring-brand-500/50',
          variant === 'secondary' && 'focus-visible:ring-surface-400/40',
          variant === 'ghost' && 'focus-visible:ring-surface-400/30',
          variant === 'danger' && 'focus-visible:ring-red-500/40',
          variant === 'success' && 'focus-visible:ring-emerald-500/40',
          variant === 'outline' && 'focus-visible:ring-brand-500/40',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={14} />
        ) : (
          icon && <span className="flex-shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {iconRight && !loading && <span className="flex-shrink-0">{iconRight}</span>}
      </button>
    )
  },
)

Button.displayName = 'Button'
