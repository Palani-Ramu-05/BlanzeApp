import { cn } from '@utils/index'
import { Loader2 } from 'lucide-react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

const sizeMap = {
  sm: 14,
  md: 18,
  lg: 28,
}

export const Spinner = ({ size = 'md', className, text }: SpinnerProps) => (
  <div className={cn('flex items-center gap-2', className)}>
    <Loader2 size={sizeMap[size]} className="animate-spin text-brand-400" />
    {text && <span className="text-sm text-surface-400">{text}</span>}
  </div>
)

export const FullPageLoader = ({ text = 'Loading…' }: { text?: string }) => (
  <div className="fixed inset-0 bg-[rgb(var(--color-body-bg))] flex flex-col items-center justify-center gap-4 z-50">
    <div className="relative">
      <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-brand-400" />
      </div>
    </div>
    <p className="text-sm text-surface-400">{text}</p>
  </div>
)
