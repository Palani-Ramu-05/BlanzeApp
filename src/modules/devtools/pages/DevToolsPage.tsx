import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ChevronRight, Star, Binary, Palette,
  Database, FileText, Cpu, Lock,
} from 'lucide-react'
import { cn } from '@utils/index'
import { useLocalStorage } from '@core/hooks/useLocalStorage'
import { usePageTitle } from '@core/hooks/usePageTitle'
import { CATEGORIES, ALL_TOOLS } from '../config/tools.config'
import type { CategoryId, FilterId } from '../dto/types/devtools.types'
import { DevToolsHeader } from '../components/DevToolsHeader'
import { SearchOverlay } from '../components/SearchOverlay'
import { CategoryNav } from '../components/CategoryNav'
import { ToolCard } from '../components/ToolCard'
import { PinnedTools } from '../components/PinnedTools'

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
const TypingTestTool = lazy(() => import('../components/tools/TypingTestTool').then(m => ({ default: m.TypingTestTool })))
const SpinnerWheelTool = lazy(() => import('../components/tools/SpinnerWheelTool').then(m => ({ default: m.SpinnerWheelTool })))

const TOOL_COMPONENTS: Record<string, React.LazyExoticComponent<() => React.ReactElement>> = {
  'base64': Base64Tool, 'url-encoder': URLEncoderTool, 'url-parser': URLParserTool,
  'color-converter': ColorConverterTool, 'color-palette': ColorPaletteTool,
  'gradient-maker': GradientMakerTool, 'color-mixer': ColorMixerTool,
  'uuid': UUIDTool, 'data-format': DataFormatTool, 'json-editor': JSONEditorTool,
  'diff-checker': DiffCheckerTool, 'markdown-table': MarkdownTableTool, 'lorem-ipsum': LoremIpsumTool,
  'qrcode': QRCodeTool, 'http-status': HTTPStatusTool,
  'token-generator': TokenGeneratorTool, 'password-generator': PasswordGeneratorTool, 'jwt': JWTTool,
  'typing-test': TypingTestTool, 'spinner-wheel': SpinnerWheelTool,
}

const CAT_ICONS: Record<CategoryId, React.ReactNode> = {
  'encoding': <Binary size={15} />, 'json-data': <Database size={15} />,
  'design': <Palette size={15} />, 'text-tools': <FileText size={15} />,
  'utilities': <Cpu size={15} />, 'security': <Lock size={15} />,
}

const ToolLoader = () => (
  <div className="flex items-center justify-center h-32">
    <div className="w-6 h-6 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
  </div>
)

export const DevToolsPage = () => {
  usePageTitle('DevTools')
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterId>('all')
  const [searchOpen, setSearchOpen] = useState(false)
  const [recentTools, setRecentTools] = useLocalStorage<string[]>('dt_recent', [])
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('dt_recent_searches', [])
  const [favorites, setFavorites] = useLocalStorage<string[]>('dt_favorites', [])

  const filteredTools = useMemo(() => {
    let list = ALL_TOOLS

    if (activeCategory) list = list.filter(t => t.category === activeCategory)

    switch (filter) {
      case 'popular': list = list.filter(t => t.badge === 'popular'); break
      case 'new': list = list.filter(t => t.badge === 'new'); break
      case 'favorites': list = list.filter(t => favorites.includes(t.id)); break
      case 'recent': list = list.filter(t => recentTools.includes(t.id)); break
      case 'advanced': list = list.filter(t => t.badge === 'advanced'); break
    }
    return list
  }, [activeCategory, filter, favorites, recentTools])

  const openTool = useCallback((id: string) => {
    setActiveTool(id)
    setRecentTools([id, ...recentTools.filter(r => r !== id)].slice(0, 8))
  }, [setRecentTools, recentTools])

  const toggleFavorite = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorites(
      favorites.includes(id) ? favorites.filter(f => f !== id) : [id, ...favorites],
    )
  }, [setFavorites, favorites])

  const handleSearchSelect = useCallback((id: string) => {
    openTool(id)
  }, [openTool])

  const handleSearchOpen = useCallback(() => setSearchOpen(true), [])
  const handleSearchClose = useCallback(() => setSearchOpen(false), [])

  const handleCategoryChange = useCallback((id: CategoryId | null) => {
    setActiveCategory(id)
    setFilter('all')
    setActiveTool(null)
  }, [])

  const handleFilterChange = useCallback((f: FilterId) => {
    setFilter(f)
    setActiveCategory(null)
    setActiveTool(null)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const activeCat = activeCategory ? CATEGORIES.find(c => c.id === activeCategory) : null
  const activeToolDef = activeTool ? ALL_TOOLS.find(t => t.id === activeTool) : null
  const ActiveComponent = activeTool ? TOOL_COMPONENTS[activeTool] : null

  const showHomeView = !activeTool

  return (
    <div className="h-full flex flex-col overflow-hidden bg-surface-950">
      <style>{`
        :root {
          --cat-encoding: #38bdf8;
          --cat-json-data: #34d399;
          --cat-design: #f472b6;
          --cat-text-tools: #fbbf24;
          --cat-utilities: #a78bfa;
          --cat-security: #fb7185;
        }
      `}</style>

      <SearchOverlay
        open={searchOpen}
        onClose={handleSearchClose}
        onSelect={handleSearchSelect}
        recentSearches={recentSearches}
        onClearRecent={() => setRecentSearches([])}
      />

      {showHomeView ? (
        <>
          <DevToolsHeader
            totalTools={ALL_TOOLS.length}
            filter={filter}
            onFilterChange={handleFilterChange}
            onSearchOpen={handleSearchOpen}
          />

          <CategoryNav active={activeCategory} onChange={handleCategoryChange} />

          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="p-4 md:p-5 space-y-5">
              {/* Pinned Tools (compact, only when showing all) */}
              {!activeCategory && filter === 'all' && (
                <PinnedTools favorites={favorites} onOpen={openTool} onToggleFav={toggleFavorite} />
              )}

              {/* Category section header */}
              {activeCategory && activeCat && (
                <div className="flex items-center gap-3">
                  <div className={cn('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shadow', activeCat.gradientFrom, activeCat.gradientTo)}>
                    {CAT_ICONS[activeCategory]}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">{activeCat.label}</h2>
                    <p className="text-[11px] text-surface-400">{activeCat.description}</p>
                  </div>
                </div>
              )}

              {/* Results count for filter mode */}
              {!activeCategory && filter !== 'all' && (
                <div className="text-xs text-surface-500">
                  Showing <span className="font-semibold text-white">{filteredTools.length}</span>{' '}
                  {filter} tool{filteredTools.length !== 1 ? 's' : ''}
                </div>
              )}

              {/* Tools Grid */}
              {filteredTools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {filteredTools.map((tool, i) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      isFav={favorites.includes(tool.id)}
                      onOpen={openTool}
                      onToggleFav={toggleFavorite}
                      index={i}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-surface-800 flex items-center justify-center">
                    <Star size={18} className="text-surface-500" />
                  </div>
                  <p className="text-sm font-bold text-white">
                    {filter === 'favorites' ? 'No favorited tools yet' : 'No tools found'}
                  </p>
                  <p className="text-xs text-surface-400">
                    {filter === 'favorites'
                      ? 'Click the star icon on any tool to pin it here'
                      : 'Try a different category or filter'}
                  </p>
                  {filter === 'favorites' && (
                    <button onClick={() => setFilter('all')} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                      Browse all tools
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ── Tool View ── */
        <AnimatePresence mode="wait">
          <motion.div
            key={`tool-${activeTool}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col"
          >
            <div className="flex-shrink-0 flex items-center gap-3 px-6 py-3 border-b border-surface-800/60 bg-surface-900/40">
              <button
                onClick={() => setActiveTool(null)}
                className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-white transition-colors group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                Back
              </button>
              <span className="text-surface-600">/</span>
              <span className={cn('text-xs font-semibold', activeCat?.accentClass ?? 'text-surface-400')}>
                {activeCat?.label ?? 'Tool'}
              </span>
              <ChevronRight size={12} className="text-surface-600" />
              <span className="text-xs font-semibold text-white">{activeToolDef?.name}</span>
              <div className="flex-1" />
              <button
                onClick={e => activeTool && toggleFavorite(activeTool, e)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors border',
                  activeTool && favorites.includes(activeTool)
                    ? 'text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20'
                    : 'text-surface-400 border-surface-700/40 bg-surface-800/60 hover:text-amber-400',
                )}
              >
                <Star size={12} fill={activeTool && favorites.includes(activeTool) ? 'currentColor' : 'none'} />
                {activeTool && favorites.includes(activeTool) ? 'Favorited' : 'Favorite'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6">
              <Suspense fallback={<ToolLoader />}>
                {ActiveComponent && <ActiveComponent />}
              </Suspense>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
