import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Command, ArrowRight, TrendingUp, Clock, Star, Binary, Palette, Database, FileText, Cpu, Lock } from 'lucide-react'
import { cn } from '@utils/index'
import { ALL_TOOLS, CATEGORIES } from '../config/tools.config'
import type { CategoryId, ToolDef } from '../dto/types/devtools.types'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (id: string) => void
  recentSearches: string[]
  onClearRecent: () => void
}

const CAT_ICONS: Record<CategoryId, React.ReactNode> = {
  'encoding': <Binary size={14} />,
  'json-data': <Database size={14} />,
  'design': <Palette size={14} />,
  'text-tools': <FileText size={14} />,
  'utilities': <Cpu size={14} />,
  'security': <Lock size={14} />,
}

const POPULAR_SEARCHES = ['jwt', 'uuid', 'json', 'base64', 'qr', 'color', 'password', 'diff', 'gradient', 'token']

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped.split(/\s+/).filter(Boolean).join('|')})`, 'gi'))
  return parts.map((p, i) =>
    p.toLowerCase() === query.toLowerCase() || query.toLowerCase().split(/\s+/).some(q => p.toLowerCase() === q)
      ? <mark key={i} className="bg-brand-500/30 text-brand-200 rounded-sm px-0.5">{p}</mark>
      : p,
  )
}

function scoreTool(tool: ToolDef, query: string): number {
  const q = query.toLowerCase()
  const exactName = tool.name.toLowerCase()
  const desc = tool.description.toLowerCase()
  const kws = tool.keywords.map(k => k.toLowerCase())
  const cat = CATEGORIES.find(c => c.id === tool.category)
  const catLabel = cat?.label.toLowerCase() ?? ''

  if (exactName === q) return 100
  if (exactName.startsWith(q)) return 90
  if (exactName.includes(q)) return 75
  if (kws.some(k => k === q)) return 85
  if (kws.some(k => k.startsWith(q))) return 70
  if (kws.some(k => k.includes(q))) return 55
  if (desc.includes(q)) return 40
  if (catLabel.includes(q)) return 25
  return 0
}

export const SearchOverlay = ({ open, onClose, onSelect, recentSearches, onClearRecent }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)

  const results = useMemo(() => {
    if (!query.trim()) return []
    const scored = ALL_TOOLS.map(t => ({ tool: t, score: scoreTool(t, query) }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
    return scored.map(s => s.tool)
  }, [query])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setSelectedIdx(0)
    }
  }, [open])

  useEffect(() => {
    setSelectedIdx(0)
  }, [query])

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!open) return
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); return }
    if (e.key === 'Enter' && results[selectedIdx]) { onSelect(results[selectedIdx].id); onClose(); return }
  }, [open, results, selectedIdx, onClose, onSelect])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-xl mx-4 bg-surface-900 border border-surface-700/60 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
            role="dialog"
            aria-label="Search tools"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-700/40">
              <Search size={16} className="text-surface-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search tools…"
                className="flex-1 bg-transparent text-sm text-white placeholder-surface-500 focus:outline-none"
                aria-label="Search query"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-surface-400 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-surface-800 text-[10px] font-bold text-surface-500 border border-surface-600/40">
                ESC
              </kbd>
            </div>

            <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
              {query.trim() ? (
                results.length > 0 ? (
                  <div className="p-2 space-y-0.5">
                    {results.map((tool, i) => {
                      const cat = CATEGORIES.find(c => c.id === tool.category)!
                      return (
                        <button
                          key={tool.id}
                          onClick={() => { onSelect(tool.id); onClose() }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
                            i === selectedIdx ? 'bg-brand-500/15 ring-1 ring-brand-500/30' : 'hover:bg-surface-800/60',
                          )}
                          role="option"
                          aria-selected={i === selectedIdx}
                        >
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cat.gradientFrom, cat.gradientTo, 'bg-gradient-to-br text-white')}>
                            {CAT_ICONS[tool.category] || <Binary size={13} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white truncate">
                              {highlight(tool.name, query)}
                            </div>
                            <div className="text-xs text-surface-400 truncate">
                              {highlight(tool.description, query)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {tool.badge && (
                              <span className={cn(
                                'text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase',
                                tool.badge === 'popular' && 'bg-brand-600/20 text-brand-300 border-brand-600/30',
                                tool.badge === 'new' && 'bg-green-600/20 text-green-300 border-green-600/30',
                                tool.badge === 'advanced' && 'bg-amber-600/20 text-amber-300 border-amber-600/30',
                              )}>
                                {tool.badge}
                              </span>
                            )}
                            <ArrowRight size={13} className="text-surface-500" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <Search size={24} className="text-surface-600" />
                    <p className="text-sm text-surface-400">No tools found for "<span className="text-white">{query}</span>"</p>
                    <p className="text-xs text-surface-500">Try a different search term</p>
                  </div>
                )
              ) : (
                <div className="p-4 space-y-4">
                  {/* Popular searches */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={12} className="text-surface-500" />
                      <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Popular</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_SEARCHES.map(s => (
                        <button
                          key={s}
                          onClick={() => setQuery(s)}
                          className="px-2.5 py-1 rounded-lg bg-surface-800 border border-surface-700/40 text-xs text-surface-400 hover:text-white hover:border-surface-600 transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recent searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-surface-500" />
                          <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Recent</span>
                        </div>
                        <button onClick={onClearRecent} className="text-[10px] text-surface-500 hover:text-surface-300 transition-colors">
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map(s => (
                          <button
                            key={s}
                            onClick={() => setQuery(s)}
                            className="px-2.5 py-1 rounded-lg bg-surface-800 border border-surface-700/40 text-xs text-surface-400 hover:text-white hover:border-surface-600 transition-all"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categories quick nav */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={12} className="text-surface-500" />
                      <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Categories</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setQuery(cat.label)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-800 border border-surface-700/40 text-xs text-surface-400 hover:text-white hover:border-surface-600 transition-all"
                        >
                          <span className={cn('shrink-0', cat.accentClass)}>{CAT_ICONS[cat.id]}</span>
                          {cat.label}
                          <span className="ml-auto text-surface-500">{ALL_TOOLS.filter(t => t.category === cat.id).length}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-4 px-4 py-2.5 border-t border-surface-700/40 bg-surface-950/60">
              <div className="flex items-center gap-1 text-[10px] text-surface-500">
                <kbd className="px-1 py-0.5 rounded bg-surface-800 border border-surface-700/40 font-mono">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-surface-500">
                <kbd className="px-1 py-0.5 rounded bg-surface-800 border border-surface-700/40 font-mono">↵</kbd>
                <span>Open</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-surface-500">
                <kbd className="px-1 py-0.5 rounded bg-surface-800 border border-surface-700/40 font-mono">Esc</kbd>
                <span>Close</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
