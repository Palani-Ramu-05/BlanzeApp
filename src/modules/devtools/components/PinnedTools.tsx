import { motion } from 'framer-motion'
import { Star, X, Binary, Palette, Database, FileText, Cpu, Lock } from 'lucide-react'
import { cn } from '@utils/index'
import { ALL_TOOLS, CATEGORIES } from '../config/tools.config'
import type { CategoryId } from '../dto/types/devtools.types'

interface Props {
  favorites: string[]
  onOpen: (id: string) => void
  onToggleFav: (id: string, e: React.MouseEvent) => void
}

const CAT_ICONS: Record<CategoryId, React.ReactNode> = {
  'encoding': <Binary size={13} />,
  'json-data': <Database size={13} />,
  'design': <Palette size={13} />,
  'text-tools': <FileText size={13} />,
  'utilities': <Cpu size={13} />,
  'security': <Lock size={13} />,
}

export const PinnedTools = ({ favorites, onOpen, onToggleFav }: Props) => {
  if (favorites.length === 0) return null

  const pinned = favorites
    .map(id => ALL_TOOLS.find(t => t.id === id))
    .filter(Boolean) as typeof ALL_TOOLS

  if (pinned.length === 0) return null

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Star size={13} className="text-amber-400" />
        <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Pinned</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {pinned.map((tool, i) => {
          const cat = CATEGORIES.find(c => c.id === tool.category)!
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, duration: 0.18 }}
              className="group relative"
            >
              <button
                onClick={() => onOpen(tool.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all',
                  'border-amber-500/20 bg-amber-500/8 hover:bg-amber-500/15 hover:border-amber-500/30',
                  'text-amber-200',
                )}
              >
                <span className={cat.accentClass}>{CAT_ICONS[tool.category]}</span>
                {tool.name}
              </button>
              <button
                onClick={e => onToggleFav(tool.id, e)}
                className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-surface-800 border border-surface-700 text-surface-500 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-all"
                aria-label={`Unpin ${tool.name}`}
              >
                <X size={8} />
              </button>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
