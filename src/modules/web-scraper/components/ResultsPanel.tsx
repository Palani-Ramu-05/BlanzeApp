import { useState, useMemo, memo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, ChevronRight, Copy, Check, ExternalLink, Mail, Phone,
  Image as ImageIcon, Link, Globe, FileText, Search, X, Download,
  Hash, FileCode, Languages, Layout, Table, List,
  FormInput, Braces, Type, Expand, Trash2,
  Eye, RotateCcw, AlertCircle, Timer, DownloadCloud,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import {
  toggleExpandResult, expandAllResults, collapseAllResults, setSearchQuery, clearResults,
} from '../store/webscraperSlice'
import type { ScraperApiResponse, ScrapedPage, PageImage, PageLink, PageAnchor, PageForm, ScraperSummary } from '../dto/types/webscraper.types'
import { cn } from '@utils/index'
import { downloadFile, downloadImagesList, downloadEmailsList, downloadPhonesList } from '../services/webscraper.service'

const getDomain = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url } }

function useToast() {
  const [toast, setToast] = useState<string | null>(null)
  const show = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000) }, [])
  return { toast, show }
}

function ToastBar({ toast }: { toast: string | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-surface-800 border border-surface-700/60 rounded-xl text-xs text-surface-50 shadow-elevated">
          <Check size={11} className="text-emerald-400" /> {toast}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const CopyBtn = memo(({ text, size = 10, onCopy }: { text: string; size?: number; onCopy?: () => void }) => {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    onCopy?.()
    setTimeout(() => setCopied(false), 1500)
  }, [text, onCopy])
  return (
    <button onClick={copy} className="text-surface-600 hover:text-brand-400 transition-colors flex-shrink-0" title="Copy">
      {copied ? <Check size={size} className="text-emerald-400" /> : <Copy size={size} />}
    </button>
  )
})
CopyBtn.displayName = 'CopyBtn'

function Section({ id, title, icon: Icon, count, color, children, defaultOpen = true }: {
  id?: string; title: string; icon: React.ElementType; count: number; color: string
  children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  if (count === 0 && !children) return null
  return (
    <div id={id} className="border border-surface-700/40 rounded-xl overflow-hidden scroll-mt-4">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 bg-surface-800/20 hover:bg-surface-800/40 transition-colors text-left"
      >
        <Icon size={11} className={color} />
        <span className="text-[11px] font-semibold text-surface-50 flex-1">{title}</span>
        {count > 0 && (
          <span className="text-[10px] font-medium text-surface-500 bg-surface-800 border border-surface-700 rounded-full px-1.5 py-px">{count}</span>
        )}
        {open ? <ChevronDown size={11} className="text-surface-500" /> : <ChevronRight size={11} className="text-surface-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="border-t border-surface-700/40">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const ItemRow = memo(({ icon: Icon, iconColor, children, copyText, actions }: {
  icon?: React.ElementType; iconColor?: string; children: React.ReactNode
  copyText?: string; actions?: React.ReactNode
}) => (
  <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg hover:bg-surface-800/30 group">
    {Icon && <Icon size={10} className={cn('flex-shrink-0', iconColor || 'text-surface-500')} />}
    <div className="flex-1 min-w-0 text-[11px] text-surface-100">{children}</div>
    {copyText && <CopyBtn text={copyText} />}
    {actions}
  </div>
))
ItemRow.displayName = 'ItemRow'

const EmptyState = memo(({ icon: Icon, title, desc, compact }: {
  icon: React.ElementType; title: string; desc?: string; compact?: boolean
}) => (
  <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-6' : 'py-12')}>
    <Icon size={compact ? 20 : 24} className="text-surface-600 mb-2" />
    <p className={cn('font-semibold text-surface-400', compact ? 'text-[11px]' : 'text-xs')}>{title}</p>
    {desc && <p className={cn('text-surface-600 mt-0.5', compact ? 'text-[10px]' : 'text-[11px]')}>{desc}</p>}
  </div>
))
EmptyState.displayName = 'EmptyState'

const StringListSection = memo(({ items, title, icon, color }: {
  items: string[]; title: string; icon: React.ElementType; color: string
}) => {
  if (!items?.length) return null
  return (
    <Section title={title} icon={icon} count={items.length} color={color}>
      <div className="py-1 space-y-px max-h-56 overflow-y-auto no-scrollbar">
        {items.map((item, i) => (
          <ItemRow key={i} copyText={item}>
            <span className="font-mono text-[10px]">{item}</span>
          </ItemRow>
        ))}
      </div>
    </Section>
  )
})
StringListSection.displayName = 'StringListSection'

const EmailsSection = memo(({ emails, onCopy }: { emails: string[]; onCopy?: () => void }) => {
  if (!emails?.length) return null
  const allText = emails.join('\n')
  return (
    <Section id="section-emails" title="Emails" icon={Mail} count={emails.length} color="text-blue-400">
      <div className="py-1 space-y-px">
        {emails.map((email, i) => (
          <ItemRow key={i} icon={Mail} iconColor="text-blue-400" copyText={email}>
              <a href={`mailto:${email}`} className="hover:text-brand-400 text-surface-100 font-mono text-[10px]">{email}</a>
          </ItemRow>
        ))}
        <div className="flex items-center gap-1.5 px-2.5 pt-1 border-t border-surface-700/30 mt-1">
          <CopyBtn text={allText} size={9} onCopy={onCopy} />
          <span className="text-[9px] text-surface-600">Copy all</span>
        </div>
      </div>
    </Section>
  )
})
EmailsSection.displayName = 'EmailsSection'

const PhonesSection = memo(({ phones, onCopy }: { phones: string[]; onCopy?: () => void }) => {
  if (!phones?.length) return null
  const allText = phones.join('\n')
  return (
    <Section id="section-phones" title="Phone Numbers" icon={Phone} count={phones.length} color="text-green-400">
      <div className="py-1 space-y-px">
        {phones.map((phone, i) => (
          <ItemRow key={i} icon={Phone} iconColor="text-green-400" copyText={phone}>
              <a href={`tel:${phone.replace(/\D/g, '')}`} className="hover:text-brand-400 text-surface-100 font-mono text-[10px]">{phone}</a>
          </ItemRow>
        ))}
        <div className="flex items-center gap-1.5 px-2.5 pt-1 border-t border-surface-700/30 mt-1">
          <CopyBtn text={allText} size={9} onCopy={onCopy} />
          <span className="text-[9px] text-surface-600">Copy all</span>
        </div>
      </div>
    </Section>
  )
})
PhonesSection.displayName = 'PhonesSection'

const ImagesSection = memo(({ images, onCopy }: { images: PageImage[]; onCopy?: () => void }) => {
  if (!images?.length) return null
  const [previewIdx, setPreviewIdx] = useState<number | null>(null)
  return (
    <Section id="section-images" title="Images" icon={ImageIcon} count={images.length} color="text-purple-400">
      <div className="p-2">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5">
          {images.slice(0, 20).map((img, i) => (
            <div key={i} className="group relative bg-surface-800 border border-surface-700/50 rounded-lg overflow-hidden aspect-video">
              <img src={img.src} alt={img.alt || 'Image'}
                className="w-full h-full object-cover cursor-pointer" loading="lazy"
                onClick={() => setPreviewIdx(i)}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <button onClick={() => window.open(img.src, '_blank')} className="text-white/80 hover:text-white"><ExternalLink size={8} /></button>
                {img.isLazyLoaded && <span className="text-[7px] text-amber-300 ml-auto">lazy</span>}
              </div>
            </div>
          ))}
        </div>
        {images.length > 20 && (
          <p className="text-center text-[9px] text-surface-600 mt-1.5">+{images.length - 20} more images</p>
        )}
        <div className="flex items-center gap-1.5 px-1 pt-1.5">
          <CopyBtn text={images.map(i => i.src).join('\n')} size={9} onCopy={onCopy} />
          <span className="text-[9px] text-surface-600">Copy all URLs</span>
        </div>
      </div>

      <AnimatePresence>
        {previewIdx !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setPreviewIdx(null)}
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="relative max-w-2xl max-h-[80vh]" onClick={e => e.stopPropagation()}
            >
              <img src={images[previewIdx].src} alt={images[previewIdx].alt || 'Preview'}
                className="max-w-full max-h-[80vh] rounded-xl object-contain" />
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <button onClick={() => window.open(images[previewIdx].src, '_blank')} className="p-1 bg-black/50 rounded-lg text-white/80 hover:text-white"><ExternalLink size={12} /></button>
                <button onClick={() => setPreviewIdx(null)} className="p-1 bg-black/50 rounded-lg text-white/80 hover:text-white"><X size={12} /></button>
              </div>
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className="text-[11px] text-white/70">{images[previewIdx].alt || 'No alt text'}</span>
                <span className="text-[11px] text-white/50">{previewIdx + 1}/{images.length}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  )
})
ImagesSection.displayName = 'ImagesSection'

const DomainBadge = memo(({ domain }: { domain: string }) => (
  <span className="inline-flex items-center text-[8px] font-mono px-1 py-px rounded bg-surface-700/40 text-surface-500 border border-surface-700/30 flex-shrink-0">
    {domain}
  </span>
))
DomainBadge.displayName = 'DomainBadge'

const LinksSection = memo(({ links, title, icon: Icon, color, onCopy }: {
  links: PageLink[]; title: string; icon: React.ElementType; color: string; onCopy?: () => void
}) => {
  if (!links?.length) return null
  const [filter, setFilter] = useState('')
  const filtered = filter ? links.filter(l => l.href.toLowerCase().includes(filter.toLowerCase()) || l.text.toLowerCase().includes(filter.toLowerCase())) : links
  const allUrls = links.map(l => l.href).join('\n')
  return (
    <Section id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`} title={title} icon={Icon} count={links.length} color={color}>
      <div className="p-2 space-y-1">
        {links.length > 3 && (
          <div className="relative">
            <Search size={9} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-surface-600 pointer-events-none" />
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter…"
              className="w-full pl-5 pr-1.5 py-0.5 bg-surface-800 border border-surface-700/50 rounded-lg text-[9px] text-surface-100 placeholder:text-surface-600 outline-none focus:border-brand-500/40 transition-colors" />
          </div>
        )}
        <div className="space-y-px max-h-44 overflow-y-auto no-scrollbar">
          {filtered.map((link, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-surface-800/30">
              <Icon size={9} className={cn(color, 'flex-shrink-0')} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <DomainBadge domain={getDomain(link.href)} />
                  <span className="text-[10px] text-surface-100 truncate">{link.href}</span>
                </div>
                {link.text && <div className="text-[8px] text-surface-600 truncate ml-1">{link.text}</div>}
              </div>
              <CopyBtn text={link.href} size={8} />
              <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-surface-600 hover:text-brand-400 transition-colors flex-shrink-0"><ExternalLink size={8} /></a>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 px-1 pt-1 border-t border-surface-700/30">
          <CopyBtn text={allUrls} size={8} onCopy={onCopy} />
          <span className="text-[8px] text-surface-600">Copy all URLs</span>
        </div>
      </div>
    </Section>
  )
})
LinksSection.displayName = 'LinksSection'

const AnchorsSection = memo(({ anchors, onCopy }: { anchors: PageAnchor[]; onCopy?: () => void }) => {
  if (!anchors?.length) return null
  const [filter, setFilter] = useState('')
  const filtered = filter ? anchors.filter(a => a.href.toLowerCase().includes(filter.toLowerCase()) || a.text.toLowerCase().includes(filter.toLowerCase())) : anchors
  return (
    <Section id="section-anchors" title="Anchors" icon={Link} count={anchors.length} color="text-cyan-400">
      <div className="p-2 space-y-1">
        {anchors.length > 3 && (
          <div className="relative">
            <Search size={9} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-surface-600 pointer-events-none" />
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter…"
              className="w-full pl-5 pr-1.5 py-0.5 bg-surface-800 border border-surface-700/50 rounded-lg text-[9px] text-surface-300 placeholder:text-surface-600 outline-none focus:border-brand-500/40 transition-colors" />
          </div>
        )}
        <div className="space-y-px max-h-44 overflow-y-auto no-scrollbar">
          {filtered.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-surface-800/30">
              <Link size={9} className="text-cyan-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-surface-100 truncate">{a.href || '\u2014'}</div>
                {a.text && <div className="text-[8px] text-surface-600 truncate">{a.text}</div>}
              </div>
              <CopyBtn text={a.href || a.text} size={8} />
              {a.href && <a href={a.href} target="_blank" rel="noopener noreferrer" className="text-surface-600 hover:text-brand-400"><ExternalLink size={8} /></a>}
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
})
AnchorsSection.displayName = 'AnchorsSection'

const HeadingsSection = memo(({ headings }: { headings: ScrapedPage['headings'] }) => {
  if (!headings) return null
  const all = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const
  const hasAny = all.some(k => (headings[k]?.length ?? 0) > 0)
  if (!hasAny) return null
  const total = all.reduce((sum, k) => sum + (headings[k]?.length ?? 0), 0)
  return (
    <Section id="section-headings" title="Headings" icon={Type} count={total} color="text-amber-400">
      <div className="py-1 space-y-1.5 max-h-64 overflow-y-auto no-scrollbar">
        {all.map(level => {
          const items = headings[level] ?? []
          if (!items.length) return null
          return (
            <div key={level}>
              <p className="text-[8px] font-bold text-surface-600 uppercase tracking-wider px-2.5 mb-0.5">{level} ({items.length})</p>
              {items.map((text, i) => (
                <ItemRow key={i} copyText={text}>
                  <span className={cn('text-surface-100', level === 'h1' ? 'text-[11px] font-semibold' : 'text-[10px]')}>{text}</span>
                </ItemRow>
              ))}
            </div>
          )
        })}
      </div>
    </Section>
  )
})
HeadingsSection.displayName = 'HeadingsSection'

const ParagraphsSection = memo(({ paragraphs, onCopy }: { paragraphs: string[]; onCopy?: () => void }) => {
  if (!paragraphs?.length) return null
  const [showAll, setShowAll] = useState(false)
  const display = showAll ? paragraphs : paragraphs.slice(0, 10)
  return (
    <Section id="section-paragraphs" title="Paragraphs" icon={FileText} count={paragraphs.length} color="text-amber-400">
      <div className="py-1 space-y-1">
        {display.map((p, i) => (
          <ItemRow key={i} copyText={p}>
            <p className="text-[10px] text-surface-200 leading-relaxed line-clamp-2">{p}</p>
          </ItemRow>
        ))}
        {paragraphs.length > 10 && (
          <button onClick={() => setShowAll(v => !v)} className="text-[9px] text-brand-400 hover:text-brand-300 px-2.5 py-0.5">
            {showAll ? 'Show less' : `Show all ${paragraphs.length}`}
          </button>
        )}
        <div className="flex items-center gap-1.5 px-2.5 pt-1 border-t border-surface-700/30 mt-1">
          <CopyBtn text={paragraphs.join('\n\n')} size={9} onCopy={onCopy} />
          <span className="text-[9px] text-surface-600">Copy all</span>
        </div>
      </div>
    </Section>
  )
})
ParagraphsSection.displayName = 'ParagraphsSection'

const MetaSection = memo(({ page }: { page: ScrapedPage }) => {
  const items: { label: string; value: string; icon?: React.ElementType; color?: string }[] = []
  if (page.title) items.push({ label: 'Page Title', value: page.title, icon: Type, color: 'text-surface-100' })
  if (page.meta?.title) items.push({ label: 'Meta Title', value: page.meta.title })
  if (page.meta?.description) items.push({ label: 'Meta Description', value: page.meta.description })
  if (page.language) items.push({ label: 'Language', value: page.language, icon: Languages, color: 'text-sky-400' })
  if (page.canonical) items.push({ label: 'Canonical', value: page.canonical })
  if (page.robots) items.push({ label: 'Robots', value: page.robots })
  if (page.favicon) items.push({ label: 'Favicon', value: page.favicon })

  const hasOG = page.openGraph && Object.keys(page.openGraph).length > 0
  const hasTwitter = page.twitterCards && Object.keys(page.twitterCards).length > 0
  const count = items.length + (hasOG ? 1 : 0) + (hasTwitter ? 1 : 0)
  if (count === 0) return null

  return (
    <Section id="section-meta" title="Meta & SEO" icon={Globe} count={count} color="text-cyan-400" defaultOpen>
      <div className="py-1 space-y-px">
        {items.map(item => (
          <ItemRow key={item.label} icon={item.icon || Copy} iconColor={item.color} copyText={item.value}>
            <span className="text-[9px] text-surface-500 w-16 inline-block flex-shrink-0 font-medium">{item.label}</span>
            <span className="text-[10px] text-surface-100 break-all">{item.value}</span>
          </ItemRow>
        ))}

        {hasOG && (
          <div className="border-t border-surface-700/30 mt-1 pt-1 px-2.5">
            <p className="text-[8px] font-bold text-surface-600 uppercase tracking-wider mb-0.5">Open Graph</p>
            {Object.entries(page.openGraph).map(([k, v]) => (
              <div key={k} className="flex items-start gap-1.5 py-px">
                <span className="text-[9px] text-purple-400 w-20 flex-shrink-0 truncate font-mono">{k}</span>
                <span className="text-[10px] text-surface-100 flex-1 break-all">{v}</span>
                <CopyBtn text={v} size={8} />
              </div>
            ))}
          </div>
        )}

        {hasTwitter && (
          <div className="border-t border-surface-700/30 mt-1 pt-1 px-2.5">
            <p className="text-[8px] font-bold text-surface-600 uppercase tracking-wider mb-0.5">Twitter Cards</p>
            {Object.entries(page.twitterCards).map(([k, v]) => (
              <div key={k} className="flex items-start gap-1.5 py-px">
                <span className="text-[9px] text-sky-400 w-20 flex-shrink-0 truncate font-mono">{k}</span>
                <span className="text-[10px] text-surface-100 flex-1 break-all">{v}</span>
                <CopyBtn text={v} size={8} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  )
})
MetaSection.displayName = 'MetaSection'

const FormsSection = memo(({ forms }: { forms: PageForm[] }) => {
  if (!forms?.length) return null
  return (
    <Section id="section-forms" title="Forms" icon={FormInput} count={forms.length} color="text-indigo-400">
      <div className="py-1 space-y-1.5">
        {forms.map((form, i) => (
          <div key={i} className="px-2.5 py-1.5 mx-2 bg-surface-800/30 rounded-xl">
            <div className="flex items-center gap-1.5 text-[9px] text-surface-500 mb-0.5">
              <span className="font-mono">{form.method || 'GET'}</span>
              <span className="truncate text-[10px]">{form.action || '(no action)'}</span>
              <CopyBtn text={JSON.stringify(form, null, 2)} size={8} />
            </div>
            {form.inputs?.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                {form.inputs.map((input, j) => (
                  <div key={j} className="text-[9px] bg-surface-900/40 rounded-md px-1.5 py-0.5">
                    <span className="text-surface-500">{input.type || 'text'}</span>
                    {input.name && <span className="text-surface-200 ml-0.5 font-mono">{input.name}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  )
})
FormsSection.displayName = 'FormsSection'

const TablesSection = memo(({ tables }: { tables: unknown[] }) => {
  if (!tables?.length) return null
  return (
    <Section id="section-tables" title="Tables" icon={Table} count={tables.length} color="text-orange-400">
      <div className="py-1 space-y-px">
        {tables.map((table, i) => (
          <ItemRow key={i} copyText={typeof table === 'object' ? JSON.stringify(table, null, 2) : String(table)}>
            <span className="font-mono text-[10px] truncate block">{typeof table === 'object' ? JSON.stringify(table).slice(0, 100) : String(table).slice(0, 100)}</span>
          </ItemRow>
        ))}
      </div>
    </Section>
  )
})
TablesSection.displayName = 'TablesSection'

const ButtonsSection = memo(({ buttons }: { buttons: string[] }) => (
  <StringListSection items={buttons} title="Buttons" icon={Code} color="text-pink-400" />
))
ButtonsSection.displayName = 'ButtonsSection'

const ListsSection = memo(({ lists }: { lists: string[][] }) => {
  if (!lists?.length) return null
  const total = lists.reduce((s, l) => s + l.length, 0)
  return (
    <Section id="section-lists" title="Lists" icon={List} count={total} color="text-teal-400">
      <div className="py-1 space-y-1.5 max-h-56 overflow-y-auto no-scrollbar">
        {lists.map((list, i) => (
          <div key={i} className="mx-2.5 bg-surface-800/30 rounded-xl p-1.5">
            <p className="text-[8px] text-surface-600 font-mono mb-0.5">List #{i + 1} ({list.length} items)</p>
            <div className="space-y-px">
              {list.map((item, j) => (
                <div key={j} className="flex items-start gap-1.5 text-[10px] text-surface-200">
                  <span className="text-surface-600 flex-shrink-0">{j + 1}.</span>
                  <span className="line-clamp-1">{item || '(empty)'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
})
ListsSection.displayName = 'ListsSection'

const ScriptsSection = memo(({ scripts }: { scripts: string[] }) => (
  <StringListSection items={scripts} title="Scripts" icon={FileCode} color="text-yellow-400" />
))
ScriptsSection.displayName = 'ScriptsSection'

const StylesheetsSection = memo(({ stylesheets }: { stylesheets: string[] }) => (
  <StringListSection items={stylesheets} title="Stylesheets" icon={Braces} color="text-blue-400" />
))
StylesheetsSection.displayName = 'StylesheetsSection'

const SchemaSection = memo(({ schema }: { schema: unknown[] }) => {
  if (!schema?.length) return null
  const texts = schema.map(s => typeof s === 'object' ? JSON.stringify(s, null, 2) : String(s))
  return (
    <Section id="section-schema" title="Schema Markup" icon={Hash} count={schema.length} color="text-violet-400">
      <div className="py-1 space-y-px">
        {texts.map((text, i) => (
          <ItemRow key={i} copyText={text}>
            <pre className="text-[9px] text-surface-200 font-mono line-clamp-3">{text.slice(0, 300)}</pre>
          </ItemRow>
        ))}
      </div>
    </Section>
  )
})
SchemaSection.displayName = 'SchemaSection'

const PlainTextSection = memo(({ text, onCopy }: { text: string; onCopy?: () => void }) => {
  if (!text) return null
  const [expanded, setExpanded] = useState(false)
  return (
    <Section id="section-plaintext" title="Plain Text" icon={FileText} count={1} color="text-surface-400" defaultOpen={false}>
      <div className="p-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <button onClick={() => setExpanded(v => !v)} className="text-[9px] text-brand-400 hover:text-brand-300">{expanded ? 'Collapse' : 'Expand'}</button>
          <CopyBtn text={text} size={9} onCopy={onCopy} />
          <span className="text-[9px] text-surface-600">Copy</span>
          <span className="text-[9px] text-surface-600 ml-auto">{text.length.toLocaleString()} chars</span>
        </div>
        <pre className={cn('text-[10px] text-surface-200 font-mono leading-relaxed whitespace-pre-wrap', expanded ? '' : 'line-clamp-6')}>{text}</pre>
      </div>
    </Section>
  )
})
PlainTextSection.displayName = 'PlainTextSection'

const HtmlPreviewSection = memo(({ html, url }: { html: string; url: string }) => {
  if (!html) return null
  const [fullscreen, setFullscreen] = useState(false)
  const [key, setKey] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const baseInjectedHtml = useMemo(() => {
    const baseTag = `<base href="${url}">`
    const headEnd = html.indexOf('</head>')
    return headEnd > 0 ? html.slice(0, headEnd) + baseTag + html.slice(headEnd) : baseTag + html
  }, [html, url])

  return (
    <Section id="section-html" title="HTML Preview" icon={Eye} count={1} color="text-rose-400" defaultOpen={false}>
      <div className="p-2">
        <div className="flex items-center gap-1.5 mb-1.5">
          <button onClick={() => setKey(k => k + 1)} className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md border border-surface-700 text-surface-500 hover:text-white hover:border-surface-600 transition-colors">
            <RotateCcw size={8} /> Reload
          </button>
          <button onClick={() => setFullscreen(v => !v)} className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md border border-surface-700 text-surface-500 hover:text-white hover:border-surface-600 transition-colors">
            {fullscreen ? <Minimize2 size={8} /> : <Expand size={8} />} {fullscreen ? 'Exit' : 'Full'}
          </button>
          <button onClick={() => window.open('data:text/html,' + encodeURIComponent(html), '_blank')} className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md border border-surface-700 text-surface-500 hover:text-white hover:border-surface-600 transition-colors">
            <ExternalLink size={8} /> Open
          </button>
          <CopyBtn text={html} size={8} />
          <span className="text-[9px] text-surface-600">Copy HTML</span>
          <button onClick={() => downloadFile(html, `page-${Date.now()}.html`, 'text/html')} className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md border border-surface-700 text-surface-500 hover:text-white hover:border-surface-600 transition-colors ml-auto">
            <Download size={8} /> HTML
          </button>
        </div>
        <div className={cn('border border-surface-700/50 rounded-xl overflow-hidden bg-white', fullscreen ? 'fixed inset-3 z-50' : '')}>
          <iframe key={key} ref={iframeRef} srcDoc={baseInjectedHtml} sandbox="allow-same-origin" title="HTML Preview"
            className={cn('w-full', fullscreen ? 'h-[calc(100vh-6rem)]' : 'h-64')} />
        </div>
      </div>
    </Section>
  )
})
HtmlPreviewSection.displayName = 'HtmlPreviewSection'

function Minimize2({ size, className }: { size?: number; className?: string }) {
  return (
    <svg width={size || 12} height={size || 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  )
}

function Code({ size, className }: { size?: number; className?: string }) {
  return (
    <svg width={size || 12} height={size || 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  )
}

const StatsGrid = memo(({ page }: { page: ScrapedPage }) => {
  const stats: { label: string; value: string | number; icon: React.ElementType; color: string }[] = []
  const s = page.statistics
  if (s?.wordCount) stats.push({ label: 'Words', value: s.wordCount.toLocaleString(), icon: FileText, color: 'text-blue-400' })
  if (s?.imageCount) stats.push({ label: 'Images', value: s.imageCount, icon: ImageIcon, color: 'text-purple-400' })
  if (s?.linkCount) stats.push({ label: 'Links', value: s.linkCount, icon: Link, color: 'text-cyan-400' })
  if (page.emails?.length) stats.push({ label: 'Emails', value: page.emails.length, icon: Mail, color: 'text-blue-400' })
  if (page.phoneNumbers?.length) stats.push({ label: 'Phones', value: page.phoneNumbers.length, icon: Phone, color: 'text-green-400' })
  if (page.language) stats.push({ label: 'Language', value: page.language, icon: Languages, color: 'text-sky-400' })
  if (!stats.length) return null
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-2">
      {stats.map(s => (
        <div key={s.label} className="bg-gradient-to-b from-surface-800/50 to-surface-800/20 border border-surface-700/30 rounded-xl px-2 py-1.5 text-center">
          <div className="w-5 h-5 rounded-lg bg-surface-800/60 border border-surface-700/40 flex items-center justify-center mx-auto mb-1">
            <s.icon size={10} className={s.color} />
          </div>
          <p className="text-[11px] font-bold text-surface-50 leading-tight">{String(s.value)}</p>
          <p className="text-[8px] text-surface-500 uppercase tracking-wider mt-px">{s.label}</p>
        </div>
      ))}
    </div>
  )
})
StatsGrid.displayName = 'StatsGrid'

const SummaryStrip = memo(({ summary }: { summary: ScraperSummary | null }) => {
  if (!summary) return null
  const items = [
    { label: 'Pages', value: summary.pagesScraped ?? '-', color: 'text-surface-100' },
    { label: 'Emails', value: summary.totalEmails ?? '-', color: 'text-blue-400' },
    { label: 'Phones', value: summary.totalPhoneNumbers ?? '-', color: 'text-green-400' },
    { label: 'Images', value: summary.totalImages ?? '-', color: 'text-purple-400' },
    { label: 'Internal', value: summary.totalInternalLinks ?? '-', color: 'text-cyan-400' },
    { label: 'External', value: summary.totalExternalLinks ?? '-', color: 'text-violet-400' },
    { label: 'Words', value: summary.totalWordCount?.toLocaleString() ?? '-', color: 'text-blue-400' },
  ]
  return (
    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-surface-700/30 overflow-x-auto no-scrollbar">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-1 text-[9px] flex-shrink-0">
          <span className={cn('font-semibold', item.color)}>{item.value}</span>
          <span className="text-surface-600">{item.label}</span>
        </div>
      ))}
    </div>
  )
})
SummaryStrip.displayName = 'SummaryStrip'

function SectionNav({ page, onCopy }: { page: ScrapedPage; onCopy: () => void }) {
  const sections: { id: string; label: string; icon: React.ElementType; count: number; color: string }[] = []
  if (page.emails?.length) sections.push({ id: 'section-emails', label: 'Emails', icon: Mail, count: page.emails.length, color: 'text-blue-400' })
  if (page.phoneNumbers?.length) sections.push({ id: 'section-phones', label: 'Phones', icon: Phone, count: page.phoneNumbers.length, color: 'text-green-400' })
  if (page.images?.length) sections.push({ id: 'section-images', label: 'Images', icon: ImageIcon, count: page.images.length, color: 'text-purple-400' })
  if (page.internalLinks?.length) sections.push({ id: 'section-internal-links', label: 'Internal', icon: Link, count: page.internalLinks.length, color: 'text-blue-400' })
  if (page.externalLinks?.length) sections.push({ id: 'section-external-links', label: 'External', icon: Globe, count: page.externalLinks.length, color: 'text-violet-400' })
  if (page.anchors?.length) sections.push({ id: 'section-anchors', label: 'Anchors', icon: Link, count: page.anchors.length, color: 'text-cyan-400' })
  const headingsTotal = Object.values(page.headings || {}).reduce((s, v) => s + v.length, 0)
  if (headingsTotal > 0) sections.push({ id: 'section-headings', label: 'Headings', icon: Type, count: headingsTotal, color: 'text-amber-400' })
  if (page.paragraphs?.length) sections.push({ id: 'section-paragraphs', label: 'Paragraphs', icon: FileText, count: page.paragraphs.length, color: 'text-amber-400' })
  const metaCount = (page.title ? 1 : 0) + (page.meta?.title ? 1 : 0) + (page.meta?.description ? 1 : 0) + (page.language ? 1 : 0) +
    (page.canonical ? 1 : 0) + (page.robots ? 1 : 0) + (page.favicon ? 1 : 0) +
    (page.openGraph && Object.keys(page.openGraph).length > 0 ? 1 : 0) +
    (page.twitterCards && Object.keys(page.twitterCards).length > 0 ? 1 : 0)
  if (metaCount > 0) sections.push({ id: 'section-meta', label: 'Meta', icon: Globe, count: metaCount, color: 'text-cyan-400' })
  if (page.forms?.length) sections.push({ id: 'section-forms', label: 'Forms', icon: FormInput, count: page.forms.length, color: 'text-indigo-400' })
  if (page.tables?.length) sections.push({ id: 'section-tables', label: 'Tables', icon: Table, count: page.tables.length, color: 'text-orange-400' })
  if (page.lists?.length) sections.push({ id: 'section-lists', label: 'Lists', icon: List, count: page.lists.reduce((s, l) => s + l.length, 0), color: 'text-teal-400' })
  if (page.buttons?.length) sections.push({ id: 'section-buttons', label: 'Buttons', icon: Code, count: page.buttons.length, color: 'text-pink-400' })
  if (page.scripts?.length) sections.push({ id: 'section-scripts', label: 'Scripts', icon: FileCode, count: page.scripts.length, color: 'text-yellow-400' })
  if (page.stylesheets?.length) sections.push({ id: 'section-stylesheets', label: 'Stylesheets', icon: Braces, count: page.stylesheets.length, color: 'text-blue-400' })
  if (page.schemaMarkup?.length) sections.push({ id: 'section-schema', label: 'Schema', icon: Hash, count: page.schemaMarkup.length, color: 'text-violet-400' })
  if (page.plainText) sections.push({ id: 'section-plaintext', label: 'Text', icon: FileText, count: 1, color: 'text-surface-400' })
  if (page.html) sections.push({ id: 'section-html', label: 'HTML', icon: Eye, count: 1, color: 'text-rose-400' })

  if (sections.length === 0) return null

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    onCopy()
  }

  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar pb-2 mb-1 border-b border-surface-700/20">
      {sections.map(s => (
        <button key={s.id} onClick={() => scrollTo(s.id)}
          className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md border border-surface-700/50 text-surface-400 hover:text-white hover:border-surface-600 whitespace-nowrap transition-colors flex-shrink-0">
          <s.icon size={9} className={s.color} />
          {s.count > 0 && <span className="font-semibold text-surface-50">{s.count}</span>}
          <span>{s.label}</span>
        </button>
      ))}
    </div>
  )
}

const PageContent = memo(({ page, onCopy }: { page: ScrapedPage; onCopy: () => void }) => {
  const toast = useToast()
  const handleCopy = useCallback(() => toast.show('Copied'), [toast])

  return (
    <div className="space-y-1.5">
      {page.title && (
        <div className="flex items-start gap-1.5 px-1">
          <Type size={11} className="text-surface-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-surface-50">{page.title}</p>
            <p className="text-[10px] text-surface-500 font-mono truncate">{page.url}</p>
          </div>
          <CopyBtn text={page.title} size={10} onCopy={handleCopy} />
        </div>
      )}

      <SectionNav page={page} onCopy={handleCopy} />

      <StatsGrid page={page} />

      <EmailsSection emails={page.emails} onCopy={handleCopy} />
      <PhonesSection phones={page.phoneNumbers} onCopy={handleCopy} />
      <ImagesSection images={page.images} onCopy={handleCopy} />
      <LinksSection links={page.internalLinks} title="Internal Links" icon={Link} color="text-blue-400" onCopy={handleCopy} />
      <LinksSection links={page.externalLinks} title="External Links" icon={Globe} color="text-violet-400" onCopy={handleCopy} />
      <AnchorsSection anchors={page.anchors} onCopy={handleCopy} />
      <MetaSection page={page} />
      <HeadingsSection headings={page.headings} />
      <ParagraphsSection paragraphs={page.paragraphs} onCopy={handleCopy} />
      <FormsSection forms={page.forms} />
      <TablesSection tables={page.tables} />
      <ButtonsSection buttons={page.buttons} />
      <ListsSection lists={page.lists} />
      <ScriptsSection scripts={page.scripts} />
      <StylesheetsSection stylesheets={page.stylesheets} />
      <SchemaSection schema={page.schemaMarkup} />
      <PlainTextSection text={page.plainText} onCopy={handleCopy} />
      <HtmlPreviewSection html={page.html} url={page.url} />
      <ToastBar toast={toast.toast} />
    </div>
  )
})
PageContent.displayName = 'PageContent'

const MultiPageContent = memo(({ pages, onCopy }: { pages: ScrapedPage[]; onCopy: () => void }) => {
  const [currentPage, setCurrentPage] = useState(0)
  const page = pages[currentPage]
  if (!page) return null
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1 px-1 pb-1.5 border-b border-surface-700/30 overflow-x-auto no-scrollbar">
        {pages.map((p, i) => (
          <button key={i} onClick={() => setCurrentPage(i)}
            className={cn(
              'text-[9px] px-2 py-0.5 rounded-md border transition-colors whitespace-nowrap',
              i === currentPage ? 'border-brand-600/40 bg-brand-600/10 text-brand-400' : 'border-surface-700 text-surface-500 hover:text-surface-100',
            )}
          >
            {i + 1}. {p.title?.slice(0, 18) || p.url.slice(0, 18)}
          </button>
        ))}
      </div>
      <PageContent page={page} onCopy={onCopy} />
    </div>
  )
})
MultiPageContent.displayName = 'MultiPageContent'

const ResultCard = memo(({ response, index: idx, onCopy }: { response: ScraperApiResponse; index: number; onCopy: () => void }) => {
  const dispatch = useAppDispatch()
  const expanded = useAppSelector(s => s.webScraper.expandedResultIds.includes(String(idx)))
  const data = response.data
  const isError = response.error
  const totalPages = data?.pages?.length ?? 0
  const hostname = data?.url ? getDomain(data.url) : ''
  const duration = useMemo(() => {
    if (!data?.summary?.durationMs) return null
    const ms = data.summary.durationMs
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }, [data?.summary?.durationMs])

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="border border-surface-700/50 rounded-2xl overflow-hidden bg-surface-900/60 backdrop-blur-sm"
    >
      <button onClick={() => dispatch(toggleExpandResult(String(idx)))}
        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-800/30 transition-colors text-left"
      >
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', isError ? 'bg-red-400' : 'bg-emerald-400')} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-surface-500 font-mono truncate">{hostname}</span>
            {duration && (
              <span className="flex items-center gap-0.5 text-[9px] text-surface-600 flex-shrink-0"><Timer size={8} />{duration}</span>
            )}
          </div>
          <div className="text-[10px] text-surface-100 truncate">{data?.url || 'Unknown URL'}</div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {totalPages > 1 && (
            <span className="text-[9px] text-surface-500 border border-surface-700 rounded-full px-1.5 py-px">{totalPages} pages</span>
          )}
          <span className={cn('text-[9px] font-semibold px-1.5 py-px rounded-full', isError ? 'text-red-400 bg-red-500/10' : 'text-emerald-400 bg-emerald-500/10')}>
            {isError ? response.message?.slice(0, 20) || 'Error' : 'Success'}
          </span>
          {expanded ? <ChevronDown size={11} className="text-surface-500" /> : <ChevronRight size={11} className="text-surface-500" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="border-t border-surface-700/40 px-3 py-3 space-y-2">
              {isError ? (
                <div className="flex items-start gap-2 px-2.5 py-2 rounded-xl border border-red-500/20 bg-red-500/5 text-[11px] text-red-300">
                  <AlertCircle size={11} className="flex-shrink-0 mt-px" />
                  <div>
              <p className="font-semibold mb-px text-red-300">Scraping Failed</p>
              <p className="opacity-80 text-red-300/80">{response.message}</p>
                  </div>
                </div>
              ) : data ? (
                <>
                  <SummaryStrip summary={data.summary} />
                  {data.pages.length === 1 ? (
                    <PageContent page={data.pages[0]} onCopy={onCopy} />
                  ) : (
                    <MultiPageContent pages={data.pages} onCopy={onCopy} />
                  )}
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})
ResultCard.displayName = 'ResultCard'

const SECTIONS_CONFIG = [
  { key: 'images', label: 'Images', icon: ImageIcon },
  { key: 'emails', label: 'Emails', icon: Mail },
  { key: 'phones', label: 'Phones', icon: Phone },
] as const

export function ResultsPanel({ onExport }: { onExport: (f: 'json' | 'csv' | 'txt' | 'html' | 'md') => void }) {
  const dispatch = useAppDispatch()
  const { responses, searchQuery, expandedResultIds } = useAppSelector(s => s.webScraper)
  const [exportOpen, setExportOpen] = useState(false)
  const toast = useToast()

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return responses
    const q = searchQuery.toLowerCase()
    return responses.filter(r => {
      const d = r.data
      if (!d) return false
      if (d.url.toLowerCase().includes(q)) return true
      return d.pages?.some(p =>
        p.title?.toLowerCase().includes(q) ||
        p.emails?.some(e => e.toLowerCase().includes(q)) ||
        (p.paragraphs || []).some(para => para.toLowerCase().includes(q))
      )
    })
  }, [responses, searchQuery])

  const allExpanded = expandedResultIds.length === responses.length && responses.length > 0
  const pages = responses.flatMap(r => r.data?.pages ?? [])

  const exportFormats = ['json', 'csv', 'txt', 'md', 'html'] as const

  if (responses.length === 0) {
    return <EmptyState icon={Search} title="No results yet" desc="Configure and click Start" compact />
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-surface-50">
          Results
          <span className="ml-1.5 text-[10px] font-normal text-surface-500">{responses.length} response{responses.length > 1 ? 's' : ''}</span>
        </span>

        <div className="relative flex-1 min-w-[140px]">
          <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-surface-600 pointer-events-none" />
          <input value={searchQuery} onChange={e => dispatch(setSearchQuery(e.target.value))}
            placeholder="Search results…"
            className="w-full pl-6 pr-6 py-1 bg-surface-800/60 border border-surface-700/60 rounded-lg text-[10px] text-surface-50 placeholder:text-surface-600 outline-none focus:border-brand-500/50 focus:shadow-glow-sm transition-colors"
          />
          {searchQuery && (
            <button onClick={() => dispatch(setSearchQuery(''))} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-surface-600 hover:text-white">
              <X size={10} />
            </button>
          )}
        </div>

        <button onClick={() => dispatch(allExpanded ? collapseAllResults() : expandAllResults())}
          className="flex items-center gap-1 text-[10px] px-2 py-1 border border-surface-700 rounded-lg text-surface-400 hover:text-white hover:border-surface-600 transition-colors">
          <Expand size={10} /> {allExpanded ? 'Collapse' : 'Expand'}
        </button>

        <button onClick={() => dispatch(clearResults())}
          className="flex items-center gap-1 text-[10px] px-2 py-1 border border-surface-700 rounded-lg text-surface-500 hover:text-red-400 hover:border-red-500/40 transition-colors">
          <Trash2 size={10} /> Clear
        </button>

        <div className="flex items-center gap-1">
          {SECTIONS_CONFIG.map(({ key, label, icon: Icon }) => {
            const hasItems = key === 'images' ? pages.some(p => (p.images?.length ?? 0) > 0)
              : key === 'emails' ? pages.some(p => (p.emails?.length ?? 0) > 0)
              : pages.some(p => (p.phoneNumbers?.length ?? 0) > 0)
            if (!hasItems) return null
            const handler = key === 'images' ? () => downloadImagesList(pages)
              : key === 'emails' ? () => downloadEmailsList(pages)
              : () => downloadPhonesList(pages)
            return (
              <button key={key} onClick={() => { handler(); toast.show(`Downloading ${label}`) }}
                className="flex items-center gap-1 text-[9px] px-1.5 py-1 border border-surface-700 rounded-lg text-surface-400 hover:text-white hover:border-surface-600 transition-colors">
                <Icon size={9} /> {label}
              </button>
            )
          })}
        </div>

        <div className="relative">
          <button onClick={() => setExportOpen(v => !v)}
            className="flex items-center gap-1 text-[10px] px-2 py-1 border border-surface-700 rounded-lg text-surface-400 hover:text-white hover:border-brand-600/50 hover:bg-brand-600/5 transition-all font-semibold">
            <DownloadCloud size={10} /> Export
          </button>
          <AnimatePresence>
            {exportOpen && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="absolute right-0 top-full mt-1 bg-surface-800 border border-surface-700/60 rounded-xl p-1 shadow-xl z-10 min-w-[90px]"
                onMouseLeave={() => setExportOpen(false)}
              >
                {exportFormats.map(fmt => (
                  <button key={fmt} onClick={() => { onExport(fmt); setExportOpen(false); toast.show(`Exporting as ${fmt.toUpperCase()}`) }}
                    className="w-full text-left px-2 py-1 text-[10px] text-surface-100 hover:bg-surface-700/60 rounded-lg transition-colors uppercase font-semibold">
                    .{fmt}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <EmptyState icon={AlertCircle} title="No matching results" desc="Try adjusting your search" compact />
          </motion.div>
        ) : (
          <div className="space-y-2">
            {filtered.map((response, i) => (
              <ResultCard key={`${response.data?.url || i}-${i}`} response={response} index={i} onCopy={() => toast.show('Copied')} />
            ))}
          </div>
        )}
      </AnimatePresence>

      <ToastBar toast={toast.toast} />
    </div>
  )
}
