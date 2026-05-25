import { cn } from '@utils/index'
import { Loader2 } from 'lucide-react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

const sizeMap = {
  sm: 14,
  md: 20,
  lg: 32,
}

export const Spinner = ({ size = 'md', className, text }: SpinnerProps) => (
  <div className={cn('flex items-center gap-2', className)}>
    <Loader2
      size={sizeMap[size]}
      className="animate-spin text-brand-400"
    />
    {text && <span className="text-sm text-surface-400">{text}</span>}
  </div>
)

export const FullPageLoader = ({ text = 'Loading…' }: { text?: string }) => (
  <div className="fixed inset-0 bg-surface-950 flex flex-col items-center justify-center gap-4 z-50">
    <div className="relative">
      <div className="w-12 h-12 rounded-2xl bg-brand-600/20 flex items-center justify-center">
        <span className="text-2xl">⚡</span>
      </div>
      <div className="absolute -inset-1 rounded-2xl border-2 border-brand-600/30 animate-pulse" />
    </div>
    <Spinner size="sm" text={text} />
  </div>
)
