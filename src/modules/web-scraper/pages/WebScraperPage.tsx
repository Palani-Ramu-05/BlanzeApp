import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, Zap, List, X, Plus, Play, Square, Trash2, AlertCircle, Upload, RotateCcw,
  Network, Link,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import {
  setActiveTab, setSingleURL, setBulkURLEntries, addBulkURLEntry,
  removeBulkURLEntry, clearBulkURLEntries, setScrapeMode,
} from '../store/webscraperSlice'
import { ExtractionOptions } from '../components/ExtractionOptions'
import { ProgressPanel } from '../components/ProgressPanel'
import { ResultsPanel } from '../components/ResultsPanel'
import { useWebScraper } from '../hooks/useWebScraper'
import { validateURL } from '../services/webscraper.service'
import { cn } from '@utils/index'

const BULK_MAX = 5

function SingleURLInput({ compact, err }: { compact?: boolean; err: string | null }) {
  const dispatch = useAppDispatch()
  const url = useAppSelector(s => s.webScraper.singleURL)

  const onChange = (v: string) => dispatch(setSingleURL(v))

  return (
    <div className="relative flex-1 min-w-0">
      <Globe size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
      <input
        value={url}
        onChange={e => onChange(e.target.value)}
        placeholder="https://example.com"
        className={cn(
          'w-full pl-7 pr-2.5 py-1.5 bg-surface-800/60 border rounded-lg text-[11px] text-surface-50 placeholder:text-surface-600 outline-none transition-all font-mono',
          err ? 'border-red-500/50 focus:border-red-500 focus:shadow-glow-sm focus:shadow-red-500/10' : 'border-surface-700/60 focus:border-brand-500/60 focus:shadow-glow-sm',
        )}
      />
    </div>
  )
}

function BulkURLInput() {
  const dispatch = useAppDispatch()
  const entries = useAppSelector(s => s.webScraper.bulkURLEntries)
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteValue, setPasteValue] = useState('')

  const handleChange = (i: number, value: string) => {
    const next = [...entries]
    next[i] = value
    dispatch(setBulkURLEntries(next))
    const err = value.trim() ? validateURL(value) : null
    setErrors(prev => {
      const updated = { ...prev }
      if (err) updated[i] = err
      else delete updated[i]
      return updated
    })
  }

  const handleRemove = (i: number) => {
    dispatch(removeBulkURLEntry(i))
    setErrors(prev => {
      const updated = { ...prev }
      delete updated[i]
      return updated
    })
  }

  const handlePaste = () => {
    const urls = pasteValue.split('\n').map(l => l.trim()).filter(Boolean)
    const next = [...entries]
    for (const url of urls) {
      if (next.length >= BULK_MAX) break
      if (!next.includes(url)) next.push(url)
    }
    dispatch(setBulkURLEntries(next))
    setPasteValue('')
    setPasteOpen(false)
  }

  return (
    <div className="space-y-1.5 pt-2 border-t border-surface-700/40 mt-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-surface-500">{entries.length}/{BULK_MAX} URLs</span>
        <div className="flex items-center gap-1">
          {entries.length < BULK_MAX && (
            <button onClick={() => dispatch(addBulkURLEntry(''))}
              className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md border border-surface-700 text-surface-400 hover:text-white hover:border-surface-600 transition-colors">
              <Plus size={9} /> Add
            </button>
          )}
          <button onClick={() => { setPasteOpen(v => !v); setPasteValue('') }}
            className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md border border-surface-700 text-surface-400 hover:text-white hover:border-surface-600 transition-colors">
            <Upload size={9} /> Paste
          </button>
          {entries.length > 0 && (
            <button onClick={() => { dispatch(clearBulkURLEntries()); setErrors({}) }}
              className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md border border-surface-700 text-surface-500 hover:text-red-400 hover:border-red-500/40 transition-colors">
              <RotateCcw size={9} /> Clear
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {pasteOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
          >
            <div className="space-y-1.5 bg-surface-800/40 border border-surface-700/40 rounded-xl p-2">
              <textarea value={pasteValue} onChange={e => setPasteValue(e.target.value)}
                placeholder="Paste URLs (one per line)" rows={2}
                className="w-full bg-surface-800 border border-surface-700/50 rounded-lg px-2 py-1 text-[11px] text-surface-100 placeholder:text-surface-600 outline-none focus:border-brand-500/40 transition-colors resize-none font-mono"
              />
              <button onClick={handlePaste} disabled={!pasteValue.trim()}
                className="text-[9px] px-2 py-1 rounded-md bg-brand-600/20 border border-brand-600/30 text-brand-400 hover:bg-brand-600/30 disabled:opacity-40 transition-colors">
                Add URLs
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1">
        {entries.map((entry, i) => (
          <div key={i}>
            <div className="flex items-center gap-1">
              <div className="relative flex-1">
                <Link size={9} className="absolute left-2 top-1/2 -translate-y-1/2 text-surface-600 pointer-events-none" />
                <input value={entry} onChange={e => handleChange(i, e.target.value)}
                  placeholder={`URL ${i + 1}`}
                    className={cn(
                      'w-full pl-6 pr-2 py-1 bg-surface-800/60 border rounded-md text-[11px] text-surface-100 placeholder:text-surface-600 outline-none transition-all font-mono',
                      errors[i] ? 'border-red-500/50' : 'border-surface-700/60 focus:border-brand-500/60 focus:shadow-glow-sm',
                    )}
                />
              </div>
              {entries.length > 1 && (
                <button onClick={() => handleRemove(i)}
                  className="p-1 rounded text-surface-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <X size={10} />
                </button>
              )}
            </div>
            {errors[i] && <p className="text-[9px] text-red-400 mt-0.5 ml-1">{errors[i]}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function ScrapeModeSelector() {
  const dispatch = useAppDispatch()
  const mode = useAppSelector(s => s.webScraper.scrapeMode)

  return (
    <div className="flex bg-surface-800/60 border border-surface-700/50 rounded-md p-px gap-px flex-shrink-0">
      {[
        { value: 'single', label: 'Single', icon: Zap },
        { value: 'entireWebsite', label: 'Full Site', icon: Network },
      ].map(opt => (
        <button key={opt.value}
          onClick={() => dispatch(setScrapeMode(opt.value as 'single' | 'entireWebsite'))}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-all',
            mode === opt.value
              ? 'bg-brand-600/30 text-brand-300 border border-brand-600/30'
              : 'text-surface-400 hover:text-surface-50',
        )}
        >
          <opt.icon size={10} />{opt.label}
        </button>
      ))}
    </div>
  )
}

export default function WebScraperPage() {
  const dispatch = useAppDispatch()
  const { activeTab, singleURL, bulkURLEntries, isRunning, responses, extractionOptions } = useAppSelector(s => s.webScraper)
  const { start, stop, clear, exportAs } = useWebScraper()
  const [singleErr, setSingleErr] = useState<string | null>(null)

  const hasResults = responses.length > 0
  const selectedCount = Object.values(extractionOptions).filter(Boolean).length
  const canStart = !isRunning && selectedCount > 0 && (
    activeTab === 'single'
      ? !!singleURL.trim() && !validateURL(singleURL)
      : bulkURLEntries.some(u => u.trim()) && bulkURLEntries.every(u => !u.trim() || !validateURL(u))
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (canStart) start(); else if (isRunning) stop()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [canStart, isRunning, start, stop])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center shadow-glow-sm shadow-brand-600/20">
            <Globe size={14} className="text-surface-50" />
          </div>
          <div>
            <h1 className="text-base font-black text-surface-50 tracking-tight">Web Scraper</h1>
            <p className="text-[10px] text-surface-500">Extract structured data from any public webpage</p>
          </div>
        </div>
        {hasResults && !isRunning && (
          <button onClick={clear}
            className="flex items-center gap-1 text-[10px] text-surface-500 hover:text-red-400 border border-surface-700 hover:border-red-500/40 px-2 py-1.5 rounded-lg transition-all">
            <Trash2 size={11} /> Clear
          </button>
        )}
      </div>

      <div className="bg-surface-900/60 border border-surface-700/50 rounded-2xl p-3 backdrop-blur-sm shadow-elevated">
        <div className="flex items-center gap-1.5">
          <div className="flex bg-surface-800/60 border border-surface-700/50 rounded-md p-px gap-px flex-shrink-0">
            {[
              { id: 'single', label: 'Single', icon: Globe },
              { id: 'bulk', label: 'Bulk', icon: List },
            ].map(tab => (
              <button key={tab.id}
                onClick={() => dispatch(setActiveTab(tab.id as 'single' | 'bulk'))}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-all',
                  activeTab === tab.id
                    ? 'bg-brand-600/30 text-brand-300 border border-brand-600/30'
                    : 'text-surface-400 hover:text-white',
                )}
              >
                <tab.icon size={10} />{tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'single' && <ScrapeModeSelector />}

          {activeTab === 'single' ? (
            <SingleURLInput compact err={singleErr} />
          ) : (
            <span className="text-[10px] text-surface-500 px-1">{bulkURLEntries.length}/{BULK_MAX} URLs</span>
          )}

          {!isRunning ? (
            <motion.button whileHover={{ scale: canStart ? 1.01 : 1 }} whileTap={{ scale: 0.98 }}
              onClick={start} disabled={!canStart}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all flex-shrink-0',
                canStart
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-glow-sm'
                  : 'bg-surface-800 border border-surface-700 text-surface-600 cursor-not-allowed',
              )}
            >
              <Play size={11} fill="currentColor" /> Start
            </motion.button>
          ) : (
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={stop}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-red-600/20 border border-red-600/30 text-red-400 hover:bg-red-600/30 transition-all flex-shrink-0"
            >
              <Square size={10} fill="currentColor" /> Stop
            </motion.button>
          )}

          <span className="text-[10px] text-surface-600 flex-shrink-0">
            {canStart || isRunning ? '⌘↵' : ''}
          </span>
        </div>

        {activeTab === 'single' && singleErr && (
          <p className="flex items-center gap-1 text-[10px] text-red-400 mt-1.5 ml-1">
            <AlertCircle size={9} />{singleErr}
          </p>
        )}

        {activeTab === 'bulk' && (
          <AnimatePresence mode="wait">
            <motion.div key="bulk" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }}>
              <BulkURLInput />
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <div className="bg-surface-900/60 border border-surface-700/50 rounded-2xl p-3 backdrop-blur-sm shadow-elevated">
        <ExtractionOptions />
      </div>

      <AnimatePresence>
        {(isRunning || hasResults) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-surface-900/60 border border-surface-700/50 rounded-2xl p-3 backdrop-blur-sm shadow-elevated"
          >
            <ProgressPanel />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasResults && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-surface-900/60 border border-surface-700/50 rounded-2xl p-3 backdrop-blur-sm shadow-elevated"
          >
            <ResultsPanel onExport={exportAs} />
          </motion.div>
        )}
      </AnimatePresence>

      {!hasResults && !isRunning && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-xl border border-surface-700/40 bg-surface-800/20 text-[10px] text-surface-500">
          <AlertCircle size={10} className="flex-shrink-0 mt-0.5 text-surface-600" />
          <p>Enter a URL, configure options, and click <strong className="text-surface-400">Start</strong>.</p>
        </div>
      )}
    </div>
  )
}
