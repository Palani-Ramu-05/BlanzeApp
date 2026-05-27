import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, Globe, Hash, Layers, Plus, Trash2, Copy } from 'lucide-react'
import { ToolWrapper, StyledInput, CopyButton, ToolButton } from '../ToolShared'
import { cn } from '@utils/index'
import toast from 'react-hot-toast'

interface QParam { key: string; value: string }

export const URLParserTool = () => {
  const [url, setUrl] = useState('https://example.com/path?foo=bar&baz=qux#section')
  const [activeTab, setActiveTab] = useState<'params' | 'detail'>('params')
  const [params, setParams] = useState<QParam[]>([])
  const [paramsEdited, setParamsEdited] = useState(false)

  const parsed = useMemo(() => {
    try {
      const u = new URL(url)
      const rawParams: QParam[] = []
      u.searchParams.forEach((v, k) => rawParams.push({ key: k, value: v }))
      if (!paramsEdited) setParams(rawParams)
      return {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || 'None',
        pathname: u.pathname,
        search: u.search,
        hash: u.hash || 'None',
        origin: u.origin,
        valid: true,
      }
    } catch {
      return { protocol: '', hostname: '', port: '', pathname: '', search: '', hash: '', origin: '', valid: false }
    }
  }, [url, paramsEdited])

  const builtUrl = useMemo(() => {
    if (!parsed.valid || !paramsEdited) return url
    try {
      const u = new URL(url)
      u.search = ''
      params.filter(p => p.key).forEach(p => u.searchParams.set(p.key, p.value))
      return u.toString()
    } catch { return url }
  }, [url, params, parsed.valid, paramsEdited])

  const addParam = () => { setParams(p => [...p, { key: '', value: '' }]); setParamsEdited(true) }
  const removeParam = (i: number) => { setParams(p => p.filter((_, idx) => idx !== i)); setParamsEdited(true) }
  const updateParam = (i: number, field: 'key' | 'value', val: string) => {
    setParams(p => p.map((row, idx) => idx === i ? { ...row, [field]: val } : row))
    setParamsEdited(true)
  }

  const copyAsJson = () => {
    const obj = Object.fromEntries(params.map(p => [p.key, p.value]))
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2))
    toast.success('Copied as JSON')
  }

  const detailItems = [
    { icon: <Link size={13} />, label: 'Protocol', value: parsed.protocol, color: 'text-sky-400' },
    { icon: <Globe size={13} />, label: 'Domain', value: parsed.hostname, color: 'text-emerald-400' },
    { icon: <Layers size={13} />, label: 'Port', value: parsed.port, color: 'text-amber-400' },
    { icon: <Layers size={13} />, label: 'Path', value: parsed.pathname, color: 'text-violet-400' },
    { icon: <Layers size={13} />, label: 'Query', value: parsed.search || 'None', color: 'text-pink-400' },
    { icon: <Hash size={13} />, label: 'Fragment', value: parsed.hash, color: 'text-rose-400' },
  ]

  return (
    <ToolWrapper className="max-w-3xl">
      <StyledInput
        label="URL"
        value={url}
        onChange={e => { setUrl(e.target.value); setParamsEdited(false) }}
        placeholder="https://example.com/path?query=value#hash"
        mono
        actions={<CopyButton value={paramsEdited ? builtUrl : url} />}
      />

      {paramsEdited && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 py-2 bg-brand-500/10 border border-brand-500/20 rounded-xl text-xs text-brand-300">
          Modified URL: <span className="font-mono text-white">{builtUrl}</span>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface-800 rounded-xl border border-surface-700/40 w-fit">
        {([['params', 'Params'], ['detail', 'Detail']] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-brand-600 text-white' : 'text-surface-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'params' ? (
          <motion.div key="params" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {params.length === 0 && !parsed.valid ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <span className="text-xs text-red-400">Invalid URL — cannot parse parameters</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-3 py-2 bg-surface-800/60 rounded-xl border border-surface-700/40">
                  <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Keys</span>
                  <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">= Values</span>
                  <span />
                </div>
                {params.map((p, i) => (
                  <motion.div key={i} layout className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <input value={p.key} onChange={e => updateParam(i, 'key', e.target.value)}
                      className="px-3 py-2 text-sm font-mono rounded-xl bg-surface-900 border border-surface-700/60 text-sky-300 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-colors" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-surface-500">=</span>
                      <input value={p.value} onChange={e => updateParam(i, 'value', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm font-mono rounded-xl bg-surface-900 border border-surface-700/60 text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-colors" />
                    </div>
                    <button onClick={() => removeParam(i)} className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                  <ToolButton variant="ghost" size="sm" icon={<Plus size={12} />} onClick={addParam}>Add param</ToolButton>
                  {params.length > 0 && <ToolButton variant="ghost" size="sm" icon={<Copy size={12} />} onClick={copyAsJson}>Copy as JSON</ToolButton>}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5">
            {detailItems.map(item => (
              <div key={item.label} className="grid grid-cols-[80px_1fr] gap-3 items-center px-4 py-2.5 bg-surface-900 border border-surface-700/40 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className={cn('flex-shrink-0', item.color)}>{item.icon}</span>
                  <span className="text-xs font-semibold text-surface-400">{item.label}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('text-sm font-mono', item.value === 'None' ? 'text-surface-600 italic' : 'text-white')}>{item.value}</span>
                  {item.value !== 'None' && <CopyButton value={item.value} />}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </ToolWrapper>
  )
}
