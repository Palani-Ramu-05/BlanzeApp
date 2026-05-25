import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@utils/index'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  mono?: boolean
  containerClassName?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, mono, containerClassName, className, id, ...props }, ref) => {
    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-semibold text-surface-300 uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'input-base resize-vertical min-h-24 leading-relaxed',
            mono && 'font-mono text-xs',
            error && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-surface-400">{hint}</p>}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
