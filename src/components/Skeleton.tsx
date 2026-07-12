import { cn } from '@utils/index'

interface SkeletonProps {
  className?: string
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div
    className={cn(
      'animate-pulse rounded-lg bg-gradient-to-r from-surface-800 via-surface-700 to-surface-800',
      'bg-[length:200%_100%] animate-shimmer',
      className,
    )}
  />
)

export const SkeletonCard = () => (
  <div className="p-4 rounded-xl border border-surface-700/50 bg-surface-900 space-y-3">
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-4/5" />
  </div>
)

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-2">
    <Skeleton className="h-8 w-full rounded-lg" />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full rounded-lg" />
    ))}
  </div>
)
