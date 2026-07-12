import { Wrench, Search, Command } from 'lucide-react'
import { cn } from '@utils/index'
import type { FilterId } from '../dto/types/devtools.types'

interface Props {
  totalTools: number
  filter: FilterId
  onFilterChange: (f: FilterId) => void
  onSearchOpen: () => void
}

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'popular', label: 'Popular' },
  { id: 'new', label: 'New' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'advanced', label: 'Advanced' },
]

export const DevToolsHeader = ({
  totalTools,
  filter,
  onFilterChange,
  onSearchOpen,
}: Props) => (
  <header className="flex-shrink-0 border-b border-surface-800/60 bg-surface-950/80 backdrop-blur-sm">
    <div className="flex items-center gap-4 px-6 h-14">
      {/* Logo + Title */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <Wrench size={16} className="text-white" />
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-bold text-white tracking-tight">DevTools</h1>
          <p className="text-[10px] text-surface-500 leading-none">{totalTools} tools</p>
        </div>
      </div>

      {/* Vertical divider */}
      <div className="w-px h-6 bg-surface-800 shrink-0" />

      {/* Filter chips */}
      <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            className={cn(
              'px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all whitespace-nowrap',
              filter === f.id
                ? 'text-white bg-brand-500/15'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/60',
            )}
          >
            {f.label}
            {f.id === 'new' && (
              <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 inline-block align-middle" />
            )}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1 min-w-4" />

      {/* Search bar */}
      <button
        onClick={onSearchOpen}
        className="flex items-center gap-2 px-3 h-8 rounded-lg bg-surface-800 border border-surface-700/60 text-surface-400 hover:text-surface-200 hover:border-surface-600 transition-all text-xs min-w-[180px] group"
      >
        <Search size={13} className="shrink-0" />
        <span className="flex-1 text-left">Search tools…</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-surface-700/60 text-[9px] font-bold text-surface-500 border border-surface-600/40">
          <Command size={9} />K
        </kbd>
      </button>
    </div>
  </header>
)
