import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@utils/index'
import { KeyboardShortcuts } from './KeyboardShortcuts'

interface ToolLayoutProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  children: React.ReactNode
  sidebar?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export const ToolLayout = ({ title, subtitle, icon, children, sidebar, actions, className }: ToolLayoutProps) => {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-full"
    >
      <KeyboardShortcuts />
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/file-studio')}
          className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-100 transition-colors mb-6 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to File Studio
        </button>

        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-[rgb(var(--color-text-primary))] truncate">{title}</h1>
              {subtitle && <p className="text-sm text-surface-400 mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>

        <div className={cn('flex flex-col lg:flex-row gap-6', className)}>
          <div className="flex-1 min-w-0 space-y-6">{children}</div>
          {sidebar && <div className="w-full lg:w-72 flex-shrink-0 space-y-4">{sidebar}</div>}
        </div>
      </div>
    </motion.div>
  )
}
