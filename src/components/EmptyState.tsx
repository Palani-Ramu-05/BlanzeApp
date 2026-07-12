import { cn } from '@utils/index'
import { AlertCircle, SearchX, FolderOpen, Wifi } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  type?: 'empty' | 'search' | 'error' | 'offline'
  title?: string
  description?: string
  action?: { label: string; onClick: () => void }
  className?: string
}

const config = {
  empty: {
    icon: <FolderOpen size={28} className="text-surface-500" />,
    title: 'Nothing here yet',
    description: 'Get started by creating your first item.',
  },
  search: {
    icon: <SearchX size={28} className="text-surface-500" />,
    title: 'No results found',
    description: 'Try adjusting your search or filters.',
  },
  error: {
    icon: <AlertCircle size={28} className="text-red-400" />,
    title: 'Something went wrong',
    description: 'An error occurred. Please try again.',
  },
  offline: {
    icon: <Wifi size={28} className="text-amber-400" />,
    title: "You're offline",
    description: 'Check your internet connection and try again.',
  },
}

export const EmptyState = ({
  type = 'empty',
  title,
  description,
  action,
  className,
}: EmptyStateProps) => {
  const c = config[type]
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-4', className)}>
      <div className="mb-3">{c.icon}</div>
      <h3 className="text-sm font-semibold text-surface-100 mb-1">{title || c.title}</h3>
      <p className="text-xs text-surface-400 max-w-xs mb-4">{description || c.description}</p>
      {action && (
        <Button size="sm" variant="secondary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
