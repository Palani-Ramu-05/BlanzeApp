import { useState, useMemo, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wrench, Search, Star, Clock, ChevronRight, ArrowLeft,
  Binary, Palette, Database, FileText, Cpu, Lock,
  Zap, TrendingUp, X,
} from 'lucide-react'
import { cn } from '@utils/index'
import { useLocalStorage } from '@core/hooks/useLocalStorage'
import { usePageTitle } from '@core/hooks/usePageTitle'
import { CATEGORIES, ALL_TOOLS } from '../config/tools.config'
import type { CategoryId } from '../dto/types/devtools.types'

// Lazy-loaded tool components
const Base64Tool = lazy(() => import('../components/tools/Base64Tool').then(m => ({ default: m.Base64Tool })))
const URLEncoderTool = lazy(() => import('../components/tools/URLEncoderTool').then(m => ({ default: m.URLEncoderTool })))
const URLParserTool = lazy(() => import('../components/tools/URLParserTool').then(m => ({ default: m.URLParserTool })))
const ColorConverterTool = lazy(() => import('../components/tools/ColorConverterTool').then(m => ({ default: m.ColorConverterTool })))
const ColorPaletteTool = lazy(() => import('../components/tools/ColorPaletteTool').then(m => ({ default: m.ColorPaletteTool })))
const GradientMakerTool = lazy(() => import('../components/tools/GradientMakerTool').then(m => ({ default: m.GradientMakerTool })))
const ColorMixerTool = lazy(() => import('../components/tools/ColorMixerTool').then(m => ({ default: m.ColorMixerTool })))
const UUIDTool = lazy(() => import('../components/tools/UUIDTool').then(m => ({ default: m.UUIDTool })))
const DataFormatTool = lazy(() => import('../components/tools/DataFormatTool').then(m => ({ default: m.DataFormatTool })))
const JSONEditorTool = lazy(() => import('../components/tools/JSONEditorTool').then(m => ({ default: m.JSONEditorTool })))
const DiffCheckerTool = lazy(() => import('../components/tools/DiffCheckerTool').then(m => ({ default: m.DiffCheckerTool })))
const MarkdownTableTool = lazy(() => import('../components/tools/MarkdownTableTool').then(m => ({ default: m.MarkdownTableTool })))
const LoremIpsumTool = lazy(() => import('../components/tools/LoremIpsumTool').then(m => ({ default: m.LoremIpsumTool })))
const QRCodeTool = lazy(() => import('../components/tools/QRCodeTool').then(m => ({ default: m.QRCodeTool })))
const HTTPStatusTool = lazy(() => import('../components/tools/HTTPStatusTool').then(m => ({ default: m.HTTPStatusTool })))
const TokenGeneratorTool = lazy(() => import('../components/tools/TokenGeneratorTool').then(m => ({ default: m.TokenGeneratorTool })))
const PasswordGeneratorTool = lazy(() => import('../components/tools/PasswordGeneratorTool').then(m => ({ default: m.PasswordGeneratorTool })))
const JWTTool = lazy(() => import('../components/tools/JWTTool').then(m => ({ default: m.JWTTool })))

const TOOL_COMPONENTS: Record<string, React.LazyExoticComponent<() => React.ReactElement>> = {
  'base64': Base64Tool,
  'url-encoder': URLEncoderTool,
  'url-parser': URLParserTool,
  'color-converter': ColorConverterTool,
  'color-palette': ColorPaletteTool,
  'gradient-maker': GradientMakerTool,
  'color-mixer': ColorMixerTool,
  'uuid': UUIDTool,
  'data-format': DataFormatTool,
  'json-editor': JSONEditorTool,
  'diff-checker': DiffCheckerTool,
  'markdown-table': MarkdownTableTool,
  'lorem-ipsum': LoremIpsumTool,
  'qrcode': QRCodeTool,
  'http-status': HTTPStatusTool,
  'token-generator': TokenGeneratorTool,
  'password-generator': PasswordGeneratorTool,
  'jwt': JWTTool,
}

const CATEGORY_ICONS: Record<CategoryId, React.ReactNode> = {
  'encode-decode': <Binary size={15} />,
  'ui-design': <Palette size={15} />,
  'data': <Database size={15} />,
  'text': <FileText size={15} />,
  'utility': <Cpu size={15} />,
  'cryptography': <Lock size={15} />,
}

const BADGE_COLORS = {
  popular: 'bg-brand-600/20 text-brand-300 border-brand-600/30',
  new: 'bg-green-600/20 text-green-300 border-green-600/30',
  advanced: 'bg-amber-600/20 text-amber-300 border-amber-600/30',
}

const ToolLoader = () => (
  <div className="flex items-center justify-center h-32">
    <div className="w-6 h-6 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
  </div>
)

export const DevToolsPage = () => {
  usePageTitle('DevTools')
  const [activeCategory, setActiveCategory] = useState<CategoryId>('encode-decode')
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [recentTools, setRecentTools] = useLocalStorage<string[]>('dt_recent', [])
  const [favorites, setFavorites] = useLocalStorage<string[]>('dt_favorites', [])

  const openTool = (id: string) => {
    setActiveTool(id)
    setSearch('')
    setRecentTools([id, ...recentTools.filter(r => r !== id)].slice(0, 8))
  }

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorites(
      favorites.includes(id) ? favorites.filter(f => f !== id) : [id, ...favorites],
    )
  }

  const activeCat = CATEGORIES.find(c => c.id === activeCategory)!
  const filteredTools = useMemo(() => {
    const base = search
      ? ALL_TOOLS.filter(t =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.keywords.some(k => k.includes(search.toLowerCase()))
        )
      : ALL_TOOLS.filter(t => t.category === activeCategory)
    return base
  }, [search, activeCategory])

  const activeTooLDef = activeTool ? ALL_TOOLS.find(t => t.id === activeTool) : null
  const ActiveComponent = activeTool ? TOOL_COMPONENTS[activeTool] : null

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Sticky header ─────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-surface-800/60">
        {/* Page title row */}
        <div className="relative overflow-hidden px-6 pt-5 pb-4">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-900/20 via-transparent to-violet-900/15 pointer-events-none" />
          <div className="absolute top-0 left-1/4 w-64 h-24 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Wrench size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">DevTools</h1>
                <p className="text-xs text-surface-400">{ALL_TOOLS.length} tools across 6 categories</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setActiveTool(null) }}
                placeholder="Search tools…"
                className="w-full pl-9 pr-9 py-2 text-sm rounded-xl bg-surface-800 border border-surface-700/60 text-white placeholder-surface-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/50 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category tabs */}
        {!search && (
          <div className="px-6 pb-0 overflow-x-auto no-scrollbar">
            <div className="flex gap-1 min-w-max pb-0">
              {CATEGORIES.map(cat => (
                <motion.button
                  key={cat.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setActiveCategory(cat.id); setActiveTool(null) }}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap',
                    activeCategory === cat.id
                      ? 'text-white border-brand-500 bg-brand-500/10'
                      : 'text-surface-400 border-transparent hover:text-surface-200 hover:bg-surface-800/60',
                  )}
                >
                  <span className={cn(activeCategory === cat.id ? cat.accentClass : '')}>{CATEGORY_ICONS[cat.id]}</span>
                  {cat.label}
                  <span className={cn(
                    'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                    activeCategory === cat.id ? 'bg-brand-500/20 text-brand-300' : 'bg-surface-700/60 text-surface-500',
                  )}>
                    {ALL_TOOLS.filter(t => t.category === cat.id).length}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Content area ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          {activeTool && ActiveComponent ? (
            /* Tool panel */
            <motion.div
              key={`tool-${activeTool}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              {/* Tool header */}
              <div className="flex-shrink-0 flex items-center gap-3 px-6 py-3 border-b border-surface-800/60 bg-surface-900/40">
                <button
                  onClick={() => setActiveTool(null)}
                  className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-white transition-colors group"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                  Back
                </button>
                <span className="text-surface-600">/</span>
                <span className={cn('text-xs font-semibold', activeCat.accentClass)}>{activeCat.label}</span>
                <ChevronRight size={12} className="text-surface-600" />
                <span className="text-xs font-semibold text-white">{activeTooLDef?.name}</span>
                <div className="flex-1" />
                <button
                  onClick={e => activeTool && toggleFavorite(activeTool, e)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors border',
                    favorites.includes(activeTool!)
                      ? 'text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20'
                      : 'text-surface-400 border-surface-700/40 bg-surface-800/60 hover:text-amber-400',
                  )}
                >
                  <Star size={12} fill={favorites.includes(activeTool!) ? 'currentColor' : 'none'} />
                  {favorites.includes(activeTool!) ? 'Favorited' : 'Favorite'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar p-6">
                <Suspense fallback={<ToolLoader />}>
                  <ActiveComponent />
                </Suspense>
              </div>
            </motion.div>
          ) : (
            /* Grid view */
            <motion.div
              key={`grid-${activeCategory}-${search}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="p-6 space-y-6"
            >
              {/* Recent tools */}
              {!search && recentTools.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={13} className="text-surface-400" />
                    <span className="text-xs font-bold text-surface-400 uppercase tracking-wider">Recently Used</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentTools.slice(0, 6).map(id => {
                      const t = ALL_TOOLS.find(x => x.id === id)
                      if (!t) return null
                      const cat = CATEGORIES.find(c => c.id === t.category)!
                      return (
                        <motion.button
                          key={id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => openTool(id)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-800 border border-surface-700/60 hover:border-brand-600/40 hover:bg-brand-600/5 transition-all"
                        >
                          <span className={cn('text-[11px]', cat.accentClass)}>{CATEGORY_ICONS[t.category]}</span>
                          <span className="text-xs font-semibold text-surface-300">{t.name}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Favorites */}
              {!search && favorites.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={13} className="text-amber-400" />
                    <span className="text-xs font-bold text-surface-400 uppercase tracking-wider">Favorites</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {favorites.map(id => {
                      const t = ALL_TOOLS.find(x => x.id === id)
                      if (!t) return null
                      const cat = CATEGORIES.find(c => c.id === t.category)!
                      return (
                        <motion.button
                          key={id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => openTool(id)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-all"
                        >
                          <span className={cn('text-[11px]', cat.accentClass)}>{CATEGORY_ICONS[t.category]}</span>
                          <span className="text-xs font-semibold text-amber-200">{t.name}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Category header */}
              {!search && (
                <div className="flex items-center gap-3">
                  <div className={cn('w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center text-white', activeCat.gradientFrom, activeCat.gradientTo)}>
                    {CATEGORY_ICONS[activeCategory]}
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white">{activeCat.label}</h2>
                    <p className="text-xs text-surface-400">{activeCat.description}</p>
                  </div>
                </div>
              )}
              {search && (
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-brand-400" />
                  <span className="text-sm text-white font-semibold">{filteredTools.length} result{filteredTools.length !== 1 ? 's' : ''} for "{search}"</span>
                </div>
              )}

              {/* Tools grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredTools.map((tool, i) => {
                  const cat = CATEGORIES.find(c => c.id === tool.category)!
                  const isFav = favorites.includes(tool.id)
                  return (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.22 }}
                      whileHover={{ y: -2 }}
                      onClick={() => openTool(tool.id)}
                      className={cn(
                        'relative group rounded-xl border border-surface-700/60 bg-surface-900/60 p-4 cursor-pointer',
                        'hover:border-brand-600/40 hover:bg-surface-800/80 transition-all hover:shadow-lg hover:shadow-brand-900/20',
                      )}
                    >
                      {/* Top accent line */}
                      <div className={cn('absolute top-0 left-4 right-4 h-px bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity', cat.gradientFrom, cat.gradientTo)} />

                      <div className="flex items-start justify-between mb-3">
                        <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0', cat.gradientFrom, cat.gradientTo, 'opacity-90')}>
                          {CATEGORY_ICONS[tool.category]}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {tool.badge && (
                            <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase', BADGE_COLORS[tool.badge])}>
                              {tool.badge}
                            </span>
                          )}
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={e => toggleFavorite(tool.id, e)}
                            className={cn(
                              'w-6 h-6 flex items-center justify-center rounded-lg transition-colors',
                              isFav ? 'text-amber-400' : 'text-surface-600 hover:text-amber-400',
                            )}
                          >
                            <Star size={12} fill={isFav ? 'currentColor' : 'none'} />
                          </motion.button>
                        </div>
                      </div>

                      <p className="text-sm font-bold text-white mb-1">{tool.name}</p>
                      <p className="text-xs text-surface-400 leading-relaxed line-clamp-2">{tool.description}</p>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {tool.keywords.slice(0, 3).map(kw => (
                            <span key={kw} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-surface-800 text-surface-500 border border-surface-700/40">
                              {kw}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Open <ChevronRight size={11} />
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {filteredTools.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-surface-800 flex items-center justify-center">
                    <Search size={22} className="text-surface-500" />
                  </div>
                  <p className="text-sm font-bold text-white">No tools found</p>
                  <p className="text-xs text-surface-400">Try a different search term</p>
                  <button onClick={() => setSearch('')} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                    Clear search
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
