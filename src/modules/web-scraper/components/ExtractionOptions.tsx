import { useState, useMemo, memo } from 'react'
import { Search, X, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { toggleExtractionOption, setAllExtractionOptions } from '../store/webscraperSlice'
import { cn } from '@utils/index'
import {
  EXTRACTION_OPTION_DEFS, GROUP_LABELS, GROUP_ORDER,
  buildDefaultOptions, ALL_EXTRACTION_OPTIONS,
  type ExtractionOption, type ExtractionOptionsMap,
} from '../dto/types/webscraper.types'

const PRESETS: { label: string; desc: string; get: () => ExtractionOptionsMap }[] = [
  { label: 'All', desc: 'Everything', get: buildDefaultOptions },
  { label: 'Contact', desc: 'Emails + Phones', get: () => {
    const o = Object.fromEntries(ALL_EXTRACTION_OPTIONS.map(k => [k, false])) as ExtractionOptionsMap;
    ['emails', 'phoneNumbers'].forEach(k => o[k as ExtractionOption] = true); return o
  }},
  { label: 'SEO', desc: 'Meta + OG + Twitter', get: () => {
    const o = Object.fromEntries(ALL_EXTRACTION_OPTIONS.map(k => [k, false])) as ExtractionOptionsMap;
    ['documentTitle', 'metaTitle', 'metaDescription', 'metaKeywords', 'canonical', 'favicon', 'robots', 'openGraph', 'twitterCards', 'language'].forEach(k => o[k as ExtractionOption] = true); return o
  }},
  { label: 'Content', desc: 'Text + Headings', get: () => {
    const o = Object.fromEntries(ALL_EXTRACTION_OPTIONS.map(k => [k, false])) as ExtractionOptionsMap;
    ['headings', 'paragraphs', 'lists', 'buttons', 'wordCount'].forEach(k => o[k as ExtractionOption] = true); return o
  }},
  { label: 'Links', desc: 'All link types', get: () => {
    const o = Object.fromEntries(ALL_EXTRACTION_OPTIONS.map(k => [k, false])) as ExtractionOptionsMap;
    ['internalLinks', 'externalLinks', 'anchors'].forEach(k => o[k as ExtractionOption] = true); return o
  }},
]

const OptionCheckbox = memo(({ opt, checked }: { opt: typeof EXTRACTION_OPTION_DEFS[0]; checked: boolean }) => {
  const dispatch = useAppDispatch()
  return (
    <label
      onClick={() => dispatch(toggleExtractionOption(opt.id))}
      className={cn(
        'flex items-center gap-1.5 px-1.5 py-0.5 rounded cursor-pointer transition-colors select-none group',
        checked ? 'bg-brand-500/8 text-surface-50' : 'text-surface-500 hover:bg-surface-800/30 hover:text-surface-100',
      )}
    >
      <div className={cn(
        'w-3 h-3 rounded-sm border flex items-center justify-center flex-shrink-0 transition-colors',
        checked ? 'bg-brand-500 border-brand-500 shadow-glow-sm shadow-brand-500/20' : 'border-surface-600 bg-surface-800/60 group-hover:border-surface-500',
      )}>
        {checked && <Check size={7} className="text-white" />}
      </div>
      <span className="text-[11px]">{opt.label}</span>
    </label>
  )
})
OptionCheckbox.displayName = 'OptionCheckbox'

export function ExtractionOptions() {
  const dispatch = useAppDispatch()
  const options = useAppSelector(s => s.webScraper.extractionOptions)
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const selectedCount = useMemo(() => Object.values(options).filter(Boolean).length, [options])
  const totalCount = ALL_EXTRACTION_OPTIONS.length
  const allSelected = selectedCount === totalCount

  const toggleGroup = (g: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(g)) next.delete(g)
      else next.add(g)
      return next
    })
  }

  const groups = useMemo(() => GROUP_ORDER
    .map(g => ({
      key: g,
      label: GROUP_LABELS[g] || g,
      options: EXTRACTION_OPTION_DEFS.filter(o => o.group === g),
    }))
    .filter(g => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return g.label.toLowerCase().includes(q) || g.options.some(o => o.label.toLowerCase().includes(q))
    })
  , [search])

  return (
    <div className="border border-surface-700/40 rounded-xl overflow-hidden">
      <button onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-surface-800/20 hover:bg-surface-800/40 transition-colors text-left"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-surface-50">Options</span>
          <span className="text-[10px] text-surface-500 bg-surface-800 border border-surface-700 rounded-full px-1.5 py-0.5">
            {selectedCount}/{totalCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {PRESETS.map(p => (
              <button key={p.label} onClick={e => { e.stopPropagation(); dispatch(setAllExtractionOptions(p.get() as ExtractionOptionsMap)) }}
                className={cn(
                  'text-[9px] font-medium px-1.5 py-0.5 rounded-md border transition-colors',
                  selectedCount === Object.values(p.get()).filter(Boolean).length && selectedCount > 0 && selectedCount < totalCount
                    ? 'border-brand-600/40 text-brand-400 bg-brand-600/5'
                    : 'border-surface-700 text-surface-500 hover:border-surface-600 hover:text-surface-300',
                )}
                title={p.desc}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={e => { e.stopPropagation(); dispatch(setAllExtractionOptions(buildDefaultOptions())) }}
              className={cn(
                'text-[9px] font-medium px-1.5 py-0.5 rounded-md border transition-colors',
                allSelected ? 'border-surface-600 text-surface-400' : 'border-brand-600/40 text-brand-400 hover:bg-brand-600/10',
              )}
            >
              {allSelected ? 'All' : 'Select'}
            </button>
            {allSelected && (
              <button onClick={e => { e.stopPropagation(); dispatch(setAllExtractionOptions(
                Object.fromEntries(ALL_EXTRACTION_OPTIONS.map(k => [k, false])) as ExtractionOptionsMap
              ))}}
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-md border border-surface-700 text-surface-500 hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          {collapsed ? <ChevronRight size={12} className="text-surface-500" /> : <ChevronDown size={12} className="text-surface-500" />}
        </div>
      </button>

      {!collapsed && (
        <div className="p-2.5 border-t border-surface-700/40 space-y-2">
          <div className="relative">
            <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-surface-600 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filter…"
              className="w-full pl-6 pr-6 py-1 bg-surface-800/40 border border-surface-700/50 rounded-lg text-[11px] text-surface-100 placeholder:text-surface-600 outline-none focus:border-brand-500/40 focus:shadow-glow-sm transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-surface-600 hover:text-white">
                <X size={10} />
              </button>
            )}
          </div>

          <div className="space-y-1">
            {groups.map(group => {
              if (group.options.length === 0) return null
              const isCollapsed = collapsedGroups.has(group.key)
              const groupSelected = group.options.filter(o => options[o.id]).length
              return (
                <div key={group.key} className="border border-surface-700/40 rounded-xl overflow-hidden">
                  <button onClick={() => toggleGroup(group.key)}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-800/20 hover:bg-surface-800/40 transition-colors text-left"
                  >
                    {isCollapsed ? <ChevronRight size={10} className="text-surface-500" /> : <ChevronDown size={10} className="text-surface-500" />}
                    <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">{group.label}</span>
                    <span className="text-[9px] text-surface-600 ml-auto">{groupSelected}/{group.options.length}</span>
                  </button>
                  {!isCollapsed && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-px p-1 bg-surface-900/30">
                      {group.options.map(opt => (
                        <OptionCheckbox key={opt.id} opt={opt} checked={!!options[opt.id]} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
