import { memo } from 'react'
import { motion } from 'framer-motion'
import { Star, ArrowRight, Binary, Palette, Database, FileText, Cpu, Lock } from 'lucide-react'
import { cn } from '@utils/index'
import { CATEGORIES } from '../config/tools.config'
import type { CategoryId, ToolDef } from '../dto/types/devtools.types'

interface Props {
  tool: ToolDef
  isFav: boolean
  onOpen: (id: string) => void
  onToggleFav: (id: string, e: React.MouseEvent) => void
  index: number
}

const CAT_ICONS: Record<CategoryId, React.ReactNode> = {
  'encoding': <Binary size={15} />,
  'json-data': <Database size={15} />,
  'design': <Palette size={15} />,
  'text-tools': <FileText size={15} />,
  'utilities': <Cpu size={15} />,
  'security': <Lock size={15} />,
}

const BADGE_STYLES = {
  popular: 'bg-brand-600/15 text-brand-300 border-brand-600/25',
  new: 'bg-green-600/15 text-green-300 border-green-600/25',
  advanced: 'bg-amber-600/15 text-amber-300 border-amber-600/25',
}

export const ToolCard = memo(({ tool, isFav, onOpen, onToggleFav, index }: Props) => {
  const cat = CATEGORIES.find(c => c.id === tool.category)!

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      whileHover={{ y: -3, scale: 1.01 }}
      onClick={() => onOpen(tool.id)}
      className={cn(
        'relative group rounded-xl border border-surface-700/50 bg-surface-900/50 p-4 cursor-pointer',
        'hover:border-brand-600/40 hover:bg-surface-800/80 transition-all',
        'hover:shadow-lg hover:shadow-brand-900/15',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
      )}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(tool.id) } }}
      aria-label={`Open ${tool.name}`}
    >
      {/* Top accent line */}
      <div className={cn('absolute top-0 left-4 right-4 h-px bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-200', cat.gradientFrom, cat.gradientTo)} />

      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0',
          cat.gradientFrom, cat.gradientTo, 'shadow-lg',
        )}>
          {CAT_ICONS[tool.category]}
        </div>

        <div className="flex items-center gap-1.5">
          {tool.badge && (
            <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase', BADGE_STYLES[tool.badge])}>
              {tool.badge}
            </span>
          )}
          <button
            onClick={e => onToggleFav(tool.id, e)}
            className={cn(
              'w-7 h-7 flex items-center justify-center rounded-lg transition-all',
              isFav ? 'text-amber-400 hover:text-amber-300' : 'text-surface-600 hover:text-amber-400 opacity-0 group-hover:opacity-100',
            )}
            aria-label={isFav ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
          >
            <Star size={13} fill={isFav ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <h3 className="text-sm font-bold text-white mb-1 leading-snug">{tool.name}</h3>
      <p className="text-xs text-surface-400 leading-relaxed line-clamp-2 mb-3">{tool.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {tool.keywords.slice(0, 2).map(kw => (
            <span key={kw} className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-surface-800 text-surface-500 border border-surface-700/40">
              {kw}
            </span>
          ))}
          {tool.keywords.length > 2 && (
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-surface-800 text-surface-500 border border-surface-700/40">
              +{tool.keywords.length - 2}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-[10px] font-semibold text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Open <ArrowRight size={11} />
        </div>
      </div>
    </motion.div>
  )
})

ToolCard.displayName = 'ToolCard'
