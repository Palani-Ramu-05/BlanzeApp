import { useEffect, useState, useCallback } from 'react'
import { Trash2, AlignJustify, Table2 } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { addKVRow, updateKVRow, deleteKVRow, setKVRows } from '../store/fetchlabSlice'
import { cn } from '@utils/index'
import { generateId } from '@utils/index'
import type { KVRow } from '../dto/types/fetchlab.types'

type KVTarget = 'params' | 'headers' | 'formEncodeFields'

interface Props { target: KVTarget }

// Serialize rows to bulk-edit format
const rowsToBulk = (rows: KVRow[]) =>
  rows.filter((r) => r.key).map((r) => `${r.key}: ${r.value}`).join('\n')

// Parse bulk text back to rows
const bulkToRows = (text: string): KVRow[] => {
  if (!text.trim()) return []
  // Try JSON first
  try {
    const obj = JSON.parse(text) as Record<string, string>
    if (typeof obj === 'object' && !Array.isArray(obj)) {
      return Object.entries(obj).map(([k, v]) => ({ id: generateId(), enabled: true, key: k, value: String(v) }))
    }
  } catch { /**/ }
  // Fall back to key: value or key=value lines
  return text.split('\n')
    .map((line) => {
      const sep = line.includes(': ') ? ': ' : '='
      const idx = line.indexOf(sep)
      if (idx === -1) return null
      return { id: generateId(), enabled: true, key: line.slice(0, idx).trim(), value: line.slice(idx + sep.length).trim() }
    })
    .filter((r): r is KVRow => !!r && !!r.key)
}

export const KVTable = ({ target }: Props) => {
  const dispatch = useAppDispatch()
  const { currentRequest } = useAppSelector((s) => s.fetchlab)
  const rows = currentRequest?.[target] || []

  const [bulkMode, setBulkMode] = useState(false)
  const [bulkText, setBulkText] = useState('')

  // Ensure at least one empty row exists
  useEffect(() => {
    if (currentRequest && rows.length === 0) dispatch(addKVRow({ target }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRequest?.id, target])

  const enterBulk = () => {
    setBulkText(rowsToBulk(rows))
    setBulkMode(true)
  }

  const exitBulk = (apply: boolean) => {
    if (apply) {
      const parsed = bulkToRows(bulkText)
      parsed.push({ id: generateId(), enabled: true, key: '', value: '' })
      dispatch(setKVRows({ target, rows: parsed }))
    }
    setBulkMode(false)
  }

  const handleKeyChange = useCallback((id: string, value: string) => {
    dispatch(updateKVRow({ target, id, field: 'key', value }))
    const isLast = rows.at(-1)?.id === id
    if (isLast && value) dispatch(addKVRow({ target }))
  }, [dispatch, rows, target])

  const handleValueChange = useCallback((id: string, value: string) => {
    dispatch(updateKVRow({ target, id, field: 'value', value }))
    const isLast = rows.at(-1)?.id === id
    if (isLast && value) dispatch(addKVRow({ target }))
  }, [dispatch, rows, target])

  const encode = (id: string, value: string) => {
    dispatch(updateKVRow({ target, id, field: 'value', value: encodeURIComponent(value) }))
  }
  const decode = (id: string, value: string) => {
    try { dispatch(updateKVRow({ target, id, field: 'value', value: decodeURIComponent(value) })) } catch { /**/ }
  }

  return (
    <div className="p-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">
          {target === 'params' ? 'Query Parameters' : target === 'headers' ? 'Request Headers' : 'URL-Encoded Fields'}
        </span>
        <button
          onClick={bulkMode ? () => exitBulk(true) : enterBulk}
          className="flex items-center gap-1 text-[10px] font-medium text-surface-400 hover:text-brand-400 border border-surface-700 hover:border-brand-600/50 px-2 py-0.5 rounded-lg transition-colors"
        >
          {bulkMode ? <><Table2 size={11} /> Table View</> : <><AlignJustify size={11} /> Bulk Edit</>}
        </button>
      </div>

      {bulkMode ? (
        <div className="space-y-2">
          <p className="text-[10px] text-surface-500">Paste key: value pairs (one per line) or a JSON object</p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={'Authorization: Bearer token\nContent-Type: application/json\n\n// or JSON:\n{"key": "value"}'}
            className="w-full h-40 bg-surface-800/60 border border-surface-700/60 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-surface-600 outline-none focus:border-brand-500 transition-colors resize-none"
          />
          <div className="flex gap-2">
            <button onClick={() => exitBulk(true)} className="px-3 py-1.5 text-[11px] font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors">Apply</button>
            <button onClick={() => exitBulk(false)} className="px-3 py-1.5 text-[11px] font-medium text-surface-400 hover:text-white border border-surface-700 rounded-lg transition-colors">Cancel</button>
          </div>
        </div>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-700/60">
              <th className="w-7 pb-2" />
              <th className="pb-2 text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider w-[38%]">Key</th>
              <th className="pb-2 text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider pl-2">Value</th>
              <th className="w-16 pb-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-surface-800/30 group">
                <td className="py-1 pr-2">
                  <input type="checkbox" checked={row.enabled}
                    onChange={(e) => dispatch(updateKVRow({ target, id: row.id, field: 'enabled', value: e.target.checked }))}
                    className="w-3.5 h-3.5 accent-brand-500 cursor-pointer" />
                </td>
                <td className="py-1 pr-1">
                  <input type="text" value={row.key}
                    onChange={(e) => handleKeyChange(row.id, e.target.value)}
                    placeholder="key"
                    className={cn('w-full bg-transparent border border-transparent rounded-md px-2 py-1.5',
                      'font-mono text-xs text-slate-200 placeholder:text-surface-600',
                      'focus:bg-surface-800 focus:border-surface-600 outline-none transition-colors',
                    )} />
                </td>
                <td className="py-1 pl-1">
                  <input type="text" value={row.value}
                    onChange={(e) => handleValueChange(row.id, e.target.value)}
                    placeholder="value"
                    className={cn('w-full bg-transparent border border-transparent rounded-md px-2 py-1.5',
                      'font-mono text-xs text-slate-200 placeholder:text-surface-600',
                      'focus:bg-surface-800 focus:border-surface-600 outline-none transition-colors',
                    )} />
                </td>
                <td className="py-1 pl-1">
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => encode(row.id, row.value)}
                      className="text-[9px] px-1.5 py-0.5 rounded text-surface-500 hover:text-sky-400 hover:bg-sky-500/10 transition-colors font-mono" title="URL Encode value">↑enc</button>
                    <button onClick={() => decode(row.id, row.value)}
                      className="text-[9px] px-1.5 py-0.5 rounded text-surface-500 hover:text-sky-400 hover:bg-sky-500/10 transition-colors font-mono" title="URL Decode value">↓dec</button>
                    <button onClick={() => dispatch(deleteKVRow({ target, id: row.id }))}
                      className="p-1 rounded text-surface-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
