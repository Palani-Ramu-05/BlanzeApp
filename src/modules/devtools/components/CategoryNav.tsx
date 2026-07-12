import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Binary, Palette, Database, FileText, Cpu, Lock } from 'lucide-react'
import { cn } from '@utils/index'
import { CATEGORIES, ALL_TOOLS } from '../config/tools.config'
import type { CategoryId } from '../dto/types/devtools.types'

interface Props {
  active: CategoryId | null
  onChange: (id: CategoryId | null) => void
}

const CAT_ICONS: Record<CategoryId, React.ReactNode> = {
  'encoding': <Binary size={15} />,
  'json-data': <Database size={15} />,
  'design': <Palette size={15} />,
  'text-tools': <FileText size={15} />,
  'utilities': <Cpu size={15} />,
  'security': <Lock size={15} />,
}

export const CategoryNav = ({ active, onChange }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (active && scrollRef.current) {
      const btn = scrollRef.current.querySelector(`[data-cat-id="${active}"]`)
      btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [active])

  return (
    <nav
      ref={scrollRef}
      className="sticky top-0 z-10 overflow-x-auto no-scrollbar border-b border-surface-800/60 bg-surface-950/90 backdrop-blur-md"
      role="tablist"
      aria-label="Tool categories"
    >
      <div className="flex gap-1 px-6 py-2 min-w-max">
        <button
          onClick={() => onChange(null)}
          data-cat-id="all"
          className={cn(
            'relative flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap',
            active === null
              ? 'text-white bg-surface-800'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/40',
          )}
          role="tab"
          aria-selected={active === null}
        >
          All
          <span className={cn(
            'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
            active === null ? 'bg-brand-500/20 text-brand-300' : 'bg-surface-700/60 text-surface-500',
          )}>
            {ALL_TOOLS.length}
          </span>
        </button>

        {CATEGORIES.map(cat => {
          const count = ALL_TOOLS.filter(t => t.category === cat.id).length
          const isActive = active === cat.id
          return (
            <button
              key={cat.id}
              data-cat-id={cat.id}
              onClick={() => onChange(cat.id)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap',
                isActive ? 'text-white' : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/40',
              )}
              role="tab"
              aria-selected={isActive}
            >
              {isActive && (
                <motion.div
                  layoutId="cat-bg"
                  className={cn('absolute inset-0 rounded-lg opacity-15', cat.gradientFrom.replace('from-', 'bg-').replace('-500', '-500/15'))}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className={cn('relative z-10', isActive ? cat.accentClass : '')}>
                {CAT_ICONS[cat.id]}
              </span>
              <span className="relative z-10">{cat.label}</span>
              <span className={cn(
                'relative z-10 text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                isActive ? `${cat.accentClass.replace('text-', 'bg-')}/20 ${cat.accentClass.replace('text-', 'text-')}` : 'bg-surface-700/60 text-surface-500',
              )}>
                {count}
              </span>
              {isActive && (
                <motion.div
                  layoutId="cat-underline"
                  className="absolute -bottom-2 inset-x-2 h-0.5 rounded-full"
                  style={{ background: `var(--cat-${cat.id})` }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
