import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { cn } from '@utils/index'

interface ToolCardProps {
  title: string
  description: string
  icon: React.ReactNode
  route: string
  formats: string[]
  gradient: string
  index?: number
}

export const ToolCard = ({ title, description, icon, route, formats, gradient, index = 0 }: ToolCardProps) => {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      className="group relative cursor-pointer"
      onClick={() => navigate(route)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') navigate(route)
      }}
      aria-label={`Open ${title}`}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-surface-700/50 bg-surface-900 p-6',
          'transition-all duration-300',
          'hover:border-surface-500/70 hover:bg-surface-800/90',
          'hover:shadow-[var(--shadow-card-hover)]',
          'active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
        )}
      >
        <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] pointer-events-none">
          <div className={cn('w-full h-full rounded-full blur-3xl', gradient)} />
        </div>

        <div className="relative z-10">
          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-5', gradient)}>
            {icon}
          </div>

          <h3 className="text-lg font-bold text-surface-100 mb-1.5 group-hover:text-white transition-colors">
            {title}
          </h3>

          <p className="text-sm text-surface-400 leading-relaxed mb-4">
            {description}
          </p>

          <div className="flex items-center gap-1.5 flex-wrap mb-5">
            {formats.map((fmt) => (
              <span
                key={fmt}
                className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-surface-800 text-surface-400 border border-surface-700/50"
              >
                {fmt}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-400 group-hover:text-brand-300 transition-colors">
            Open Tool
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
