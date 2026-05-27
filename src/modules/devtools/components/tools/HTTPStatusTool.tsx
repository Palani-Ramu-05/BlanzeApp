import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react'
import { ToolWrapper } from '../ToolShared'
import { HTTP_STATUSES } from '../../config/httpStatuses'
import { cn } from '@utils/index'

const CATEGORY_COLORS: Record<string, string> = {
  '1xx': 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  '2xx': 'text-green-400 border-green-500/30 bg-green-500/10',
  '3xx': 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  '4xx': 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  '5xx': 'text-red-400 border-red-500/30 bg-red-500/10',
}
const CAT_LABELS: Record<string, string> = {
  '1xx': 'Informational', '2xx': 'Success', '3xx': 'Redirection', '4xx': 'Client Error', '5xx': 'Server Error',
}

export const HTTPStatusTool = () => {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const categories = ['1xx', '2xx', '3xx', '4xx', '5xx']

  const filtered = useMemo(() => {
    return HTTP_STATUSES.filter(s => {
      const matchCat = filter === 'all' || s.category === filter
      const q = search.toLowerCase()
      const matchSearch = !q || String(s.code).includes(q) || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [search, filter])

  const toggle = (code: number) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(code) ? next.delete(code) : next.add(code)
    return next
  })

  return (
    <ToolWrapper>
      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search status codes…"
            className="w-full pl-9 pr-9 py-2 text-sm rounded-xl bg-surface-800 border border-surface-700/60 text-white placeholder-surface-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          {['all', ...categories].map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                filter === cat
                  ? cat === 'all' ? 'bg-brand-600 text-white' : `${CATEGORY_COLORS[cat]} border`
                  : 'bg-surface-800 text-surface-400 border border-surface-700/40 hover:border-surface-600')}>
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped status list */}
      <div className="space-y-4">
        {categories
          .filter(cat => filter === 'all' || filter === cat)
          .map(cat => {
            const items = filtered.filter(s => s.category === cat)
            if (!items.length) return null
            return (
              <div key={cat}>
                <p className={cn('text-xs font-bold mb-2 px-1', CATEGORY_COLORS[cat].split(' ')[0])}>
                  {cat} — {CAT_LABELS[cat]}
                </p>
                <div className="space-y-1.5">
                  {items.map((status, i) => {
                    const isOpen = expanded.has(status.code)
                    return (
                      <motion.div
                        key={status.code}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className={cn('rounded-xl border transition-all overflow-hidden', isOpen ? CATEGORY_COLORS[status.category] : 'border-surface-700/60 bg-surface-900 hover:border-surface-600/60')}
                      >
                        <button
                          onClick={() => toggle(status.code)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left"
                        >
                          <span className={cn('text-sm font-black font-mono w-10 flex-shrink-0', CATEGORY_COLORS[status.category].split(' ')[0])}>
                            {status.code}
                          </span>
                          <span className={cn('text-sm font-semibold flex-1', isOpen ? 'text-white' : 'text-surface-200')}>{status.name}</span>
                          {isOpen ? <ChevronUp size={14} className="text-surface-400" /> : <ChevronDown size={14} className="text-surface-500" />}
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-3 pt-0 space-y-2">
                                <p className="text-sm text-surface-300 leading-relaxed">{status.description}</p>
                                {status.tip && (
                                  <div className="flex items-start gap-2 px-3 py-2 bg-surface-800/60 rounded-xl">
                                    <span className="text-xs text-brand-400 font-bold flex-shrink-0">Tip:</span>
                                    <p className="text-xs text-surface-400">{status.tip}</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )
          })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Search size={28} className="text-surface-600" />
            <p className="text-sm font-bold text-white">No status codes found</p>
            <p className="text-xs text-surface-400">Try searching by code number or name</p>
          </div>
        )}
      </div>
    </ToolWrapper>
  )
}
