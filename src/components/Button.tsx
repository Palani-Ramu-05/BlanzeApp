import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@utils/index'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'success' | 'outline' | 'link'
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
    'bg-brand-600 hover:bg-brand-500 text-white border border-brand-600 hover:border-brand-500 shadow-glow-sm',
  ghost:
    'bg-transparent hover:bg-surface-700 text-surface-300 hover:text-white border border-surface-600 hover:border-surface-500',
  danger:
    'bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/30 hover:border-red-500/50',
  success:
    'bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-600/30 hover:border-green-500/50',
  outline:
    'bg-transparent hover:bg-surface-800 text-slate-200 border border-surface-500 hover:border-brand-500',
  link: 'bg-transparent text-brand-400 hover:text-brand-300 border-none underline-offset-4 hover:underline p-0',
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-6 px-2 text-xs rounded-md gap-1',
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-9 px-4 text-sm rounded-lg gap-2',
  lg: 'h-11 px-6 text-base rounded-xl gap-2.5',
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
          'inline-flex items-center justify-center font-medium transition-all duration-150',
          'active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          variant !== 'link' && 'cursor-pointer',
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
