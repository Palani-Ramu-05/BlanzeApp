import { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Copy, Trash2, Download, Save, Maximize2, Minimize2,
  ChevronDown, X, Info,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { clearResponse } from '../store/fetchlabSlice'
import { cn, formatTime, formatBytes } from '@utils/index'
import { JsonViewer } from './JsonViewer'
import toast from 'react-hot-toast'

// ── Response body format tabs ─────────────────────────────────
type BodyFormat = 'json' | 'xml' | 'html' | 'yaml' | 'js' | 'markdown' | 'raw' | 'hex' | 'base64' | 'preview'
type RespTab   = 'body' | 'cookies' | 'headers' | 'statuscode' | 'network'

// ── Helpers ───────────────────────────────────────────────────
const statusClass = (status: number) => {
  if (status >= 200 && status < 300) return 'bg-green-500/15 text-green-400 border-green-500/25'
  if (status >= 300 && status < 400) return 'bg-amber-500/15 text-amber-400 border-amber-500/25'
  if (status >= 400)                 return 'bg-red-500/15 text-red-400 border-red-500/25'
  return 'bg-red-500/15 text-red-400 border-red-500/25'
}

const HTTP_STATUS_DESCRIPTIONS: Record<number, string> = {
  100: 'Continue', 101: 'Switching Protocols', 200: 'OK', 201: 'Created', 204: 'No Content',
  301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified', 400: 'Bad Request',
  401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed',
  408: 'Request Timeout', 409: 'Conflict', 410: 'Gone', 422: 'Unprocessable Entity',
  429: 'Too Many Requests', 500: 'Internal Server Error', 502: 'Bad Gateway',
  503: 'Service Unavailable', 504: 'Gateway Timeout',
}

function toHex(str: string): string {
  const bytes = new TextEncoder().encode(str)
  const lines: string[] = []
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16)
    const hex = Array.from(chunk).map((b) => b.toString(16).padStart(2, '0')).join(' ')
    const ascii = Array.from(chunk).map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('')
    lines.push(`${i.toString(16).padStart(8, '0')}  ${hex.padEnd(47)}  ${ascii}`)
  }
  return lines.join('\n')
}

function jsonToYaml(obj: unknown, indent = 0): string {
  const pad = '  '.repeat(indent)
  if (obj === null)             return 'null'
  if (typeof obj === 'boolean') return String(obj)
  if (typeof obj === 'number')  return String(obj)
  if (typeof obj === 'string')  return obj.includes('\n') ? `|\n${obj.split('\n').map((l) => pad + '  ' + l).join('\n')}` : obj
  if (Array.isArray(obj))
    return obj.length === 0 ? '[]' : '\n' + obj.map((item) => `${pad}- ${jsonToYaml(item, indent + 1)}`).join('\n')
  if (typeof obj === 'object') {
    const entries = Object.entries(obj as object)
    if (!entries.length) return '{}'
    return '\n' + entries.map(([k, v]) => {
      const val = jsonToYaml(v, indent + 1)
      return `${pad}${k}: ${val}`
    }).join('\n')
  }
  return String(obj)
}

const LS_KEY = (id: string) => `fl2_resp_${id}`

// ── Preview Table ─────────────────────────────────────────────
function CellValue({ v }: { v: unknown }) {
  if (v === null) return <span className="text-surface-500 italic">null</span>
  if (typeof v === 'boolean') return <span className="text-amber-300">{String(v)}</span>
  if (typeof v === 'number')  return <span className="text-orange-300">{String(v)}</span>
  if (typeof v === 'object')  return <span className="text-surface-500 italic text-[10px]">[{Array.isArray(v) ? `Array(${(v as unknown[]).length})` : 'Object'}]</span>
  return <>{String(v)}</>
}

function PreviewTable({ data }: { data: unknown }) {
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
    const keys = Object.keys(data[0] as object)
    return (
      <div className="overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-surface-900/95 z-10">
            <tr>
              <th className="text-right text-[10px] font-bold text-surface-600 px-3 py-2 border-b border-surface-700 w-10 select-none">#</th>
              {keys.map((k) => (
                <th key={k} className="text-left text-[10px] font-bold text-surface-400 uppercase tracking-wider px-3 py-2 border-b border-surface-700 whitespace-nowrap">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data as Record<string, unknown>[]).map((row, i) => (
              <tr key={i} className="border-b border-surface-800/40 hover:bg-surface-800/30">
                <td className="text-right px-3 py-2 text-surface-600 text-[10px] font-mono select-none">{i}</td>
                {keys.map((k) => (
                  <td key={k} className="px-3 py-2 font-mono text-slate-300 max-w-[200px] truncate" title={String(row[k] ?? '')}>
                    <CellValue v={row[k]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-3 py-2 border-t border-surface-700/40">
          <span className="text-[10px] text-surface-500">{(data as unknown[]).length} rows · {keys.length} columns</span>
        </div>
      </div>
    )
  }

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const entries = Object.entries(data as object)
    return (
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 bg-surface-900/95">
          <tr>
            <th className="text-left text-[10px] font-bold text-surface-400 uppercase px-3 py-2 border-b border-surface-700 w-1/3">Key</th>
            <th className="text-left text-[10px] font-bold text-surface-400 uppercase px-3 py-2 border-b border-surface-700">Value</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([k, v]) => (
            <tr key={k} className="border-b border-surface-800/40 hover:bg-surface-800/30">
              <td className="px-3 py-2 font-mono text-sky-300 font-semibold">{k}</td>
              <td className="px-3 py-2 font-mono text-slate-300 break-all"><CellValue v={v} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return <p className="text-xs text-surface-500 px-3 py-4">Preview only available for JSON arrays or objects.</p>
}

// ── Full Screen Modal ──────────────────────────────────────────
function FullScreenModal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-surface-950/95 backdrop-blur-sm flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-surface-700/60 flex-shrink-0">
        <span className="text-xs font-semibold text-white">Response — Full Screen</span>
        <button onClick={onClose} className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 font-mono text-[12px] leading-relaxed">
        {children}
      </div>
    </motion.div>
  )
}

// ── Main Panel ────────────────────────────────────────────────
export const ResponsePanel = () => {
  const dispatch = useAppDispatch()
  const { response, sending, currentId } = useAppSelector((s) => s.fetchlab)

  const [activeTab, setActiveTab]         = useState<RespTab>('body')
  const [bodyFormat, setBodyFormat]       = useState<BodyFormat>('json')
  const [fullScreen, setFullScreen]       = useState(false)
  const [savedMsg, setSavedMsg]           = useState('')
  const formatDropRef = useRef<HTMLSelectElement>(null)

  // ── Parsed JSON ──
  const parsedJson = useMemo(() => {
    if (!response?.body) return null
    try { return JSON.parse(response.body) } catch { return null }
  }, [response?.body])

  // ── Detect best format ──
  const autoFormat: BodyFormat = useMemo(() => {
    if (!response?.body) return 'raw'
    if (parsedJson !== null) return 'json'
    const ct = response.headers['content-type'] || ''
    if (ct.includes('xml')) return 'xml'
    if (ct.includes('html')) return 'html'
    return 'raw'
  }, [response, parsedJson])

  const effectiveFormat = bodyFormat === 'json' && parsedJson === null ? 'raw' : bodyFormat

  // ── Rendered body ──
  const renderedBody = useMemo(() => {
    if (!response?.body) return null
    const body = response.body

    switch (effectiveFormat) {
      case 'json':
        return parsedJson !== null ? <JsonViewer data={parsedJson} /> : <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap break-all">{body}</pre>
      case 'xml':
      case 'html':
      case 'js':
      case 'markdown':
      case 'raw':
        return <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap break-all">{body}</pre>
      case 'yaml': {
        const yamlStr = parsedJson !== null ? `---${jsonToYaml(parsedJson)}` : body
        return <pre className="text-[11px] font-mono text-green-300 whitespace-pre-wrap break-all">{yamlStr}</pre>
      }
      case 'hex':
        return <pre className="text-[11px] font-mono text-amber-300 whitespace-pre-wrap">{toHex(body)}</pre>
      case 'base64': {
        const b64 = btoa(unescape(encodeURIComponent(body)))
        return <pre className="text-[11px] font-mono text-sky-300 whitespace-pre-wrap break-all">{b64}</pre>
      }
      case 'preview':
        return <PreviewTable data={parsedJson} />
      default:
        return <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap break-all">{body}</pre>
    }
  }, [response, effectiveFormat, parsedJson])

  // ── Cookies ──
  const cookies = useMemo(() => {
    if (!response?.headers) return []
    const setCookie = response.headers['set-cookie'] || ''
    if (!setCookie) return []
    return setCookie.split(',').map((c, i) => {
      const parts = c.trim().split(';')
      const [nameVal, ...rest] = parts
      const [name, value] = (nameVal || '').split('=')
      const attrs: Record<string, string> = {}
      rest.forEach((p) => { const [k, v] = p.trim().split('='); attrs[k.trim().toLowerCase()] = v || 'true' })
      const result: { id: number; name: string; value: string; domain?: string; path?: string; expires?: string; httponly?: string; secure?: string; samesite?: string } = { id: i, name: name?.trim() || '', value: value || '', ...attrs }
      return result
    })
  }, [response?.headers])

  // ── Save to localStorage ──
  const handleSaveResponse = () => {
    if (!response) return
    const key = LS_KEY(currentId || 'global')
    localStorage.setItem(key, JSON.stringify({ timestamp: new Date().toISOString(), response }))
    setSavedMsg('Saved!')
    setTimeout(() => setSavedMsg(''), 2000)
    toast.success('Response saved to local storage')
  }

  // ── Save to file ──
  const handleSaveToFile = () => {
    if (!response?.body) return
    const extMap: Record<BodyFormat, string> = {
      json: 'json', xml: 'xml', html: 'html', yaml: 'yaml', js: 'js',
      markdown: 'md', raw: 'txt', hex: 'txt', base64: 'txt', preview: 'txt',
    }
    const ext = extMap[effectiveFormat] || 'txt'
    let content = response.body
    if (effectiveFormat === 'yaml' && parsedJson !== null) content = `---${jsonToYaml(parsedJson)}`
    if (effectiveFormat === 'base64') content = btoa(unescape(encodeURIComponent(response.body)))
    if (effectiveFormat === 'hex') content = toHex(response.body)
    const blob = new Blob([content], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `response.${ext}`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success(`Saved as response.${ext}`)
  }

  const handleCopy = () => {
    if (response?.body) {
      navigator.clipboard.writeText(response.body)
      toast.success('Copied to clipboard')
    }
  }

  const handleClearResponse = () => {
    dispatch(clearResponse())
    if (currentId) localStorage.removeItem(LS_KEY(currentId))
  }

  const respTabs: { id: RespTab; label: string; badge?: number | string }[] = [
    { id: 'body',       label: 'Body' },
    { id: 'cookies',    label: 'Cookies',    badge: cookies.length || undefined },
    { id: 'headers',    label: 'Headers',    badge: response ? Object.keys(response.headers).length : undefined },
    { id: 'statuscode', label: 'Status Code' },
    { id: 'network',    label: 'Network' },
  ]

  const bodyFormats: { id: BodyFormat; label: string }[] = [
    { id: 'json',     label: 'JSON' },
    { id: 'xml',      label: 'XML' },
    { id: 'html',     label: 'HTML' },
    { id: 'yaml',     label: 'YAML' },
    { id: 'js',       label: 'JavaScript' },
    { id: 'markdown', label: 'Markdown' },
    { id: 'raw',      label: 'Raw' },
    { id: 'hex',      label: 'Hex' },
    { id: 'base64',   label: 'Base64' },
    { id: 'preview',  label: 'Preview' },
  ]

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* ── Top bar: tabs on left, status + actions on right ── */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-surface-700/60 flex-shrink-0 bg-surface-900/40">
          <span className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">Response</span>

          <div className="flex items-center gap-2">
            {sending && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                <span className="text-[10px] text-surface-400">Sending…</span>
              </div>
            )}

            {response && !sending && (
              <div className="flex items-center gap-2">
                <span className={cn('text-[11px] font-bold px-2.5 py-0.5 rounded-full border', statusClass(response.status))}>
                  {response.status} {response.statusText}
                </span>
                <span className="text-[10px] text-surface-500 font-mono">{formatTime(response.duration)}</span>
                <span className="text-[10px] text-surface-500 font-mono">{formatBytes(response.size)}</span>
              </div>
            )}

            {response && (
              <div className="flex items-center gap-1 ml-1">
                <button onClick={handleSaveResponse} title="Save response to local storage"
                  className="flex items-center gap-1 text-[10px] text-surface-400 hover:text-brand-400 border border-surface-700 hover:border-brand-600/50 px-2 py-0.5 rounded transition-colors">
                  <Save size={10} /> {savedMsg || 'Save'}
                </button>
                <button onClick={handleSaveToFile} title="Save response to file"
                  className="flex items-center gap-1 text-[10px] text-surface-400 hover:text-white border border-surface-700 px-2 py-0.5 rounded transition-colors">
                  <Download size={10} /> File
                </button>
                <button onClick={handleCopy} title="Copy response body"
                  className="flex items-center gap-1 text-[10px] text-surface-400 hover:text-white border border-surface-700 px-2 py-0.5 rounded transition-colors">
                  <Copy size={10} />
                </button>
                <button onClick={handleClearResponse} title="Clear response"
                  className="flex items-center gap-1 text-[10px] text-surface-400 hover:text-red-400 border border-surface-700 px-2 py-0.5 rounded transition-colors">
                  <Trash2 size={10} />
                </button>
                <button onClick={() => setFullScreen(true)} title="Full screen"
                  className="flex items-center gap-1 text-[10px] text-surface-400 hover:text-white border border-surface-700 px-2 py-0.5 rounded transition-colors">
                  <Maximize2 size={10} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Section tabs: Body / Cookies / Headers / Status Code / Network ── */}
        <div className="flex items-center border-b border-surface-700/60 flex-shrink-0 px-2">
          {respTabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium border-b-2 transition-all',
                activeTab === tab.id ? 'text-brand-400 border-brand-500 font-semibold' : 'text-surface-400 border-transparent hover:text-white',
              )}>
              {tab.label}
              {tab.badge !== undefined && tab.badge !== 0 && (
                <span className="text-[9px] font-bold bg-brand-600/30 text-brand-400 px-1.5 rounded-full">{tab.badge}</span>
              )}
            </button>
          ))}

          {/* Body format selector (only visible on Body tab) */}
          {activeTab === 'body' && response && (
            <div className="ml-auto flex items-center gap-1.5 pr-1">
              <select ref={formatDropRef} value={bodyFormat} onChange={(e) => setBodyFormat(e.target.value as BodyFormat)}
                className="bg-surface-800 border border-surface-700 rounded-lg px-2 py-0.5 text-[10px] text-slate-300 outline-none focus:border-brand-500 cursor-pointer appearance-none">
                {bodyFormats.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
              <ChevronDown size={11} className="text-surface-500 -ml-5 pointer-events-none" />
            </div>
          )}
        </div>

        {/* ── Content area ── */}
        <div className="flex-1 overflow-auto p-3 min-h-0">
          <AnimatePresence mode="wait">
            {!response && !sending ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full min-h-24">
                <p className="text-xs text-surface-600">Hit Send to see the response…</p>
              </motion.div>
            ) : (
              <motion.div key="response" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-full">

                {/* Body tab */}
                {activeTab === 'body' && (
                  <div>
                    {bodyFormat !== 'preview' && (
                      <div className="mb-2 flex items-center gap-1.5">
                        {autoFormat !== bodyFormat && (
                          <button onClick={() => setBodyFormat(autoFormat)}
                            className="text-[10px] text-amber-400 hover:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded transition-colors">
                            Auto-detected: {autoFormat.toUpperCase()} — click to use
                          </button>
                        )}
                        {effectiveFormat === 'json' && parsedJson === null && (
                          <span className="text-[10px] text-red-400 flex items-center gap-1"><Info size={10} /> Invalid JSON — showing raw</span>
                        )}
                      </div>
                    )}
                    {renderedBody}
                  </div>
                )}

                {/* Cookies tab */}
                {activeTab === 'cookies' && (
                  cookies.length === 0
                    ? <p className="text-xs text-surface-500 py-4">No cookies in response headers.</p>
                    : <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-surface-700">
                            {['Name', 'Value', 'Domain', 'Path', 'Expires', 'Flags'].map((h) => (
                              <th key={h} className="text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider pb-2 pr-4">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {cookies.map((c) => (
                            <tr key={c.id} className="border-b border-surface-800/40">
                              <td className="py-2 pr-4 font-mono text-cyan-400">{c.name}</td>
                              <td className="py-2 pr-4 text-slate-300 break-all max-w-[200px] truncate">{c.value}</td>
                              <td className="py-2 pr-4 text-slate-400">{c.domain || '—'}</td>
                              <td className="py-2 pr-4 text-slate-400">{c.path || '/'}</td>
                              <td className="py-2 pr-4 text-slate-400">{c.expires || '—'}</td>
                              <td className="py-2 text-surface-400 text-[10px]">
                                {[c.httponly && 'HttpOnly', c.secure && 'Secure', c.samesite && `SameSite=${c.samesite}`].filter(Boolean).join(', ') || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                )}

                {/* Headers tab */}
                {activeTab === 'headers' && (
                  response
                    ? <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-surface-700">
                            <th className="text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider pb-2 pr-4 w-1/3">Header</th>
                            <th className="text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider pb-2">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(response.headers).map(([key, val]) => (
                            <tr key={key} className="border-b border-surface-800/40">
                              <td className="py-2 pr-4 font-mono text-cyan-400 font-semibold">{key}</td>
                              <td className="py-2 text-surface-300 break-all">{val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    : <p className="text-xs text-surface-500">No headers.</p>
                )}

                {/* Status Code tab */}
                {activeTab === 'statuscode' && response && (
                  <div className="space-y-3">
                    <div className={cn('inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg border', statusClass(response.status))}>
                      <span className="text-lg font-bold">{response.status}</span>
                      <div>
                        <p className="text-xs font-semibold">{response.statusText || HTTP_STATUS_DESCRIPTIONS[response.status] || 'Unknown'}</p>
                        <p className="text-[10px] opacity-70">
                          {response.status < 200 ? 'Informational' :
                           response.status < 300 ? '2xx Success' :
                           response.status < 400 ? '3xx Redirection' :
                           response.status < 500 ? '4xx Client Error' : '5xx Server Error'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['Response Time', formatTime(response.duration)],
                        ['Response Size', formatBytes(response.size)],
                        ['Content-Type', response.headers['content-type'] || '—'],
                        ['Content-Encoding', response.headers['content-encoding'] || '—'],
                        ['Cache-Control', response.headers['cache-control'] || '—'],
                        ['CORS', response.headers['access-control-allow-origin'] || '—'],
                      ].map(([label, value]) => (
                        <div key={label} className="bg-surface-800/50 border border-surface-700/40 rounded-lg px-2.5 py-1.5">
                          <p className="text-[10px] text-surface-500 uppercase tracking-wider mb-0.5">{label}</p>
                          <p className="text-[11px] text-slate-200 font-mono truncate" title={String(value)}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Network tab */}
                {activeTab === 'network' && response && (
                  <div className="space-y-3">
                    {response.requestSnapshot ? (
                      <>
                        <div className="bg-surface-800/50 border border-surface-700/40 rounded-lg p-3">
                          <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-2">Request</p>
                          <p className="text-xs font-mono">
                            <span className="text-amber-300">{response.requestSnapshot.method}</span>
                            {' '}
                            <span className="text-sky-300">{response.requestSnapshot.url}</span>
                          </p>
                        </div>
                        <div className="bg-surface-800/50 border border-surface-700/40 rounded-lg p-3">
                          <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-2">Request Headers</p>
                          {Object.entries(response.requestSnapshot.headers).length > 0
                            ? <table className="w-full text-xs">
                                <tbody>
                                  {Object.entries(response.requestSnapshot.headers).map(([k, v]) => (
                                    <tr key={k} className="border-b border-surface-800/40">
                                      <td className="py-1 pr-4 font-mono text-cyan-400 w-1/3">{k}</td>
                                      <td className="py-1 text-slate-300 break-all">{v}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            : <p className="text-xs text-surface-500">No custom headers</p>
                          }
                        </div>
                        {response.requestSnapshot.body && (
                          <div className="bg-surface-800/50 border border-surface-700/40 rounded-lg p-3">
                            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-2">Request Body</p>
                            <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-all">{response.requestSnapshot.body}</pre>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-surface-500">Network snapshot not available for this response. Send a new request to capture it.</p>
                    )}
                    <div className="bg-surface-800/50 border border-surface-700/40 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-2">Timing</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-surface-400 w-24">Total</span>
                          <div className="flex-1 bg-surface-700 rounded-full h-1.5">
                            <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: '100%' }} />
                          </div>
                          <span className="text-xs font-mono text-slate-300 w-16 text-right">{formatTime(response.duration)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Full Screen Modal */}
      <AnimatePresence>
        {fullScreen && response && (
          <FullScreenModal onClose={() => setFullScreen(false)}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', statusClass(response.status))}>
                  {response.status} {response.statusText}
                </span>
                <span className="text-xs text-surface-500">{formatTime(response.duration)}</span>
                <span className="text-xs text-surface-500">{formatBytes(response.size)}</span>
              </div>
              <div className="flex items-center gap-2">
                <select value={bodyFormat} onChange={(e) => setBodyFormat(e.target.value as BodyFormat)}
                  className="bg-surface-800 border border-surface-700 rounded-lg px-2 py-0.5 text-[10px] text-slate-300 outline-none">
                  {bodyFormats.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
                <button onClick={() => { navigator.clipboard.writeText(response.body); toast.success('Copied') }}
                  className="flex items-center gap-1 text-[10px] text-surface-400 hover:text-white border border-surface-700 px-2 py-0.5 rounded transition-colors">
                  <Copy size={10} /> Copy
                </button>
                <button onClick={() => setFullScreen(false)}
                  className="flex items-center gap-1 text-[10px] text-surface-400 hover:text-white border border-surface-700 px-2 py-0.5 rounded transition-colors">
                  <Minimize2 size={10} /> Exit
                </button>
              </div>
            </div>
            {renderedBody}
          </FullScreenModal>
        )}
      </AnimatePresence>
    </>
  )
}
