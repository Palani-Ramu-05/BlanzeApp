import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { cn } from '@utils/index'
import { ArrowRight } from 'lucide-react'

interface StudioCardProps {
  icon: React.ReactNode
  title: string
  description: string
  to: string
  gradient: string
  color: string
}

export const StudioCard = ({ icon, title, description, to, gradient, color }: StudioCardProps) => {
  const navigate = useNavigate()

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(to)}
      className={cn(
        'relative group flex flex-col items-start p-5 rounded-2xl text-left',
        'border border-surface-700/50 bg-surface-900/80 backdrop-blur-sm',
        'hover:border-surface-500/50 transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950',
        'cursor-pointer',
      )}
      style={{ boxShadow: 'var(--shadow-card)' }}
      aria-label={`Open ${title}`}
    >
      <div
        className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center mb-3',
          'text-white text-lg',
        )}
        style={{ background: gradient }}
      >
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-[rgb(var(--color-text-primary))] mb-1">{title}</h3>
      <p className="text-xs text-surface-400 leading-relaxed line-clamp-2">{description}</p>
      <div
        className={cn(
          'mt-3 flex items-center gap-1 text-xs font-medium transition-all duration-200',
          'opacity-0 group-hover:opacity-100',
        )}
        style={{ color }}
      >
        <span>Open</span>
        <ArrowRight size={12} />
      </div>
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"
        style={{ background: gradient }}
      />
    </motion.button>
  )
}
