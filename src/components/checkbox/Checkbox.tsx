import { forwardRef } from 'react'
import { cn } from '@utils/index'

interface CheckboxProps {
  label?: string
  description?: string
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, checked, onChange, disabled, className }, ref) => {
    return (
      <label
        className={cn(
          'flex items-start gap-3 cursor-pointer group',
          disabled && 'opacity-50 pointer-events-none',
          className,
        )}
      >
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
            disabled={disabled}
            className="sr-only peer"
          />
          <div
            className={cn(
              'w-4 h-4 rounded border-2 transition-all duration-150',
              'border-surface-500 bg-transparent',
              'peer-checked:border-brand-500 peer-checked:bg-brand-500',
              'group-hover:border-brand-400',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/40 peer-focus-visible:ring-offset-1',
            )}
          />
          {checked && (
            <svg
              className="absolute inset-0 w-4 h-4 text-white pointer-events-none"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M3 8l3.5 3.5L13 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        {(label || description) && (
          <div>
            {label && <span className="text-sm font-medium text-[rgb(var(--color-text-primary))]">{label}</span>}
            {description && <p className="text-xs text-surface-400 mt-0.5">{description}</p>}
          </div>
        )}
      </label>
    )
  },
)

Checkbox.displayName = 'Checkbox'
