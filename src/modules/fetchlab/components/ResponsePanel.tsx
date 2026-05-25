import { useState } from 'react'
import { Copy, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { clearResponse } from '../store/fetchlabSlice'
import { cn, formatTime, formatBytes } from '@utils/index'
import toast from 'react-hot-toast'

type RespTab = 'pretty' | 'raw' | 'headers'

const statusClass = (status: number) => {
  if (status >= 200 && status < 300) return 'bg-green-500/15 text-green-400 border border-green-500/25'
  if (status >= 300 && status < 400) return 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
  if (status >= 400) return 'bg-red-500/15 text-red-400 border border-red-500/25'
  return 'bg-red-500/15 text-red-400 border border-red-500/25'
}

function highlightJson(json: string): string {
  return json
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
      if (/:$/.test(match)) {
        return `<span style="color:#79c0ff">${match}</span>`
      }
      return `<span style="color:#a5d6ff">${match}</span>`
    })
    .replace(/\b(-?\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g, '<span style="color:#ff7b72">$1</span>')
    .replace(/\btrue\b|\bfalse\b/g, '<span style="color:#d29922">$&</span>')
    .replace(/\bnull\b/g, '<span style="color:#656d76">null</span>')
}

export const ResponsePanel = () => {
  const dispatch = useAppDispatch()
  const { response, sending } = useAppSelector((s) => s.fetchlab)
  const [activeTab, setActiveTab] = useState<RespTab>('pretty')

  const copyBody = () => {
    if (response?.body) {
      navigator.clipboard.writeText(response.body)
      toast.success('Copied to clipboard')
    }
  }

  const tabs: { id: RespTab; label: string; badge?: number }[] = [
    { id: 'pretty', label: 'Pretty' },
    { id: 'raw', label: 'Raw' },
    {
      id: 'headers',
      label: 'Headers',
      badge: response ? Object.keys(response.headers).length : undefined,
    },
  ]

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Response header */}
      <div className="flex items-center gap-2.5 px-3 py-2 border-b border-surface-700/60 flex-shrink-0">
        <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Response</span>

        {sending && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            <span className="text-[10px] text-surface-400">Sending…</span>
          </div>
        )}

        {response && !sending && (
          <>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', statusClass(response.status))}>
              {response.status} {response.statusText}
            </span>
            <span className="text-[10px] text-surface-500">{formatTime(response.duration)}</span>
            <span className="text-[10px] text-surface-500">{formatBytes(response.size)}</span>
          </>
        )}

        {response && (
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={copyBody}
              className="flex items-center gap-1 text-[10px] text-surface-400 hover:text-white border border-surface-700 px-2 py-0.5 rounded transition-colors"
            >
              <Copy size={10} /> Copy
            </button>
            <button
              onClick={() => dispatch(clearResponse())}
              className="flex items-center gap-1 text-[10px] text-surface-400 hover:text-red-400 border border-surface-700 px-2 py-0.5 rounded transition-colors"
            >
              <Trash2 size={10} /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Response tabs */}
      <div className="flex border-b border-surface-700/60 flex-shrink-0 px-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium border-b-2 transition-all',
              activeTab === tab.id
                ? 'text-brand-400 border-brand-500 font-semibold'
                : 'text-surface-400 border-transparent hover:text-white',
            )}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className="text-[9px] font-bold bg-brand-600/30 text-brand-400 px-1.5 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Response body */}
      <div className="flex-1 overflow-auto p-3 min-h-0">
        <AnimatePresence mode="wait">
          {!response && !sending ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full min-h-24"
            >
              <p className="text-xs text-surface-600">Hit Send to see the response…</p>
            </motion.div>
          ) : (
            <motion.div
              key="response"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full"
            >
              {activeTab === 'pretty' && (
                <pre
                  className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-all text-slate-300"
                  dangerouslySetInnerHTML={{
                    __html: response ? highlightJson(response.prettyBody) : '',
                  }}
                />
              )}

              {activeTab === 'raw' && (
                <pre className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-all text-slate-400">
                  {response?.body || ''}
                </pre>
              )}

              {activeTab === 'headers' && (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-surface-700">
                      <th className="text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider pb-2 pr-4 w-1/3">Header</th>
                      <th className="text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider pb-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {response &&
                      Object.entries(response.headers).map(([key, val]) => (
                        <tr key={key} className="border-b border-surface-800/40">
                          <td className="py-2 pr-4 font-mono text-cyan-400 font-semibold">{key}</td>
                          <td className="py-2 text-surface-300 break-all">{val}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
