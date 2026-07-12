import { useRef, useState, useCallback } from 'react'
import { Trash2, Plus, Upload, FileText, X, AlignJustify, Table2 } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import {
  setActiveBodyTab, updateCurrentRequest,
  addFormField, updateFormField, deleteFormField, setFormFields,
  addFormFile, updateFormFileKey, updateFormFileEnabled, deleteFormFile,
  addKVRow, updateKVRow, deleteKVRow, setKVRows,
} from '../store/fetchlabSlice'
import { Textarea } from '@components/index'
import type { BodyType, FormField } from '../dto/types/fetchlab.types'
import { cn } from '@utils/index'
import { generateId } from '@utils/index'
import toast from 'react-hot-toast'
import { formFileStore, setBinaryFile } from '../store/fetchlabFileStore'

const bodyTabs: { id: BodyType; label: string }[] = [
  { id: 'none',       label: 'None' },
  { id: 'json',       label: 'JSON' },
  { id: 'xml',        label: 'XML' },
  { id: 'text',       label: 'Text' },
  { id: 'form',       label: 'Form Data' },
  { id: 'formencode', label: 'URL-Encoded' },
  { id: 'graphql',    label: 'GraphQL' },
  { id: 'binary',     label: 'Binary' },
]

// ── Shared bulk-edit helpers ────────────────────────────────────
const rowsToBulk = (rows: { key: string; value: string }[]) =>
  rows.filter((r) => r.key).map((r) => `${r.key}: ${r.value}`).join('\n')

const bulkToRows = (text: string) => {
  if (!text.trim()) return []
  try {
    const obj = JSON.parse(text) as Record<string, string>
    if (typeof obj === 'object' && !Array.isArray(obj))
      return Object.entries(obj).map(([k, v]) => ({ id: generateId(), enabled: true, key: k, value: String(v) }))
  } catch { /**/ }
  return text.split('\n').map((line) => {
    const idx = line.includes(': ') ? line.indexOf(': ') : line.indexOf('=')
    if (idx === -1) return null
    const sep = line[idx] === ':' ? ': ' : '='
    return { id: generateId(), enabled: true, key: line.slice(0, idx).trim(), value: line.slice(idx + sep.length).trim() }
  }).filter((r): r is { id: string; enabled: boolean; key: string; value: string } => !!r && !!r.key)
}

export const BodyPanel = () => {
  const dispatch = useAppDispatch()
  const { currentRequest, activeBodyTab } = useAppSelector((s) => s.fetchlab)
  const [formatError, setFormatError] = useState('')
  const [binaryFileName, setBinaryFileName] = useState('')
  const binaryInputRef = useRef<HTMLInputElement>(null)

  const beautifyJson = () => {
    try {
      const parsed = JSON.parse(currentRequest?.jsonBody || '')
      dispatch(updateCurrentRequest({ jsonBody: JSON.stringify(parsed, null, 2) }))
      setFormatError('')
    } catch {
      setFormatError('Invalid JSON — cannot format')
    }
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div className="border-b border-surface-700/60 overflow-x-auto no-scrollbar">
        <div className="flex px-3 pt-1">
          {bodyTabs.map((tab) => (
            <button key={tab.id} onClick={() => dispatch(setActiveBodyTab(tab.id))}
              className={cn('px-3 py-2 text-[11px] font-medium border-b-2 transition-all whitespace-nowrap',
                activeBodyTab === tab.id ? 'text-white border-brand-500 font-semibold' : 'text-surface-400 border-transparent hover:text-surface-200'
              )}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3">
        {/* None */}
        {activeBodyTab === 'none' && (
          <p className="text-xs text-surface-500 py-2">No request body will be sent.</p>
        )}

        {/* JSON */}
        {activeBodyTab === 'json' && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button onClick={beautifyJson}
                className="text-[10px] text-brand-400 hover:text-brand-300 border border-brand-600/30 hover:border-brand-500/60 px-2.5 py-1 rounded-lg transition-colors">
                Format JSON
              </button>
              {formatError && <span className="text-[10px] text-red-400">{formatError}</span>}
            </div>
            <Textarea value={currentRequest?.jsonBody || ''} onChange={(e) => dispatch(updateCurrentRequest({ jsonBody: e.target.value }))}
              placeholder={'{\n  "key": "value"\n}'} mono className="min-h-32 max-h-52" disabled={!currentRequest} />
          </div>
        )}

        {/* XML */}
        {activeBodyTab === 'xml' && (
          <Textarea value={currentRequest?.xmlBody || ''} onChange={(e) => dispatch(updateCurrentRequest({ xmlBody: e.target.value }))}
            placeholder={'<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <key>value</key>\n</root>'} mono className="min-h-32 max-h-52" disabled={!currentRequest} />
        )}

        {/* Text */}
        {activeBodyTab === 'text' && (
          <Textarea value={currentRequest?.textBody || ''} onChange={(e) => dispatch(updateCurrentRequest({ textBody: e.target.value }))}
            placeholder="Plain text body…" mono className="min-h-32 max-h-52" disabled={!currentRequest} />
        )}

        {/* Form Data */}
        {activeBodyTab === 'form' && <FormDataPanel />}

        {/* URL-Encoded */}
        {activeBodyTab === 'formencode' && <FormEncodePanel />}

        {/* GraphQL */}
        {activeBodyTab === 'graphql' && (
          <div className="space-y-3">
            <Textarea label="Query" value={currentRequest?.gqlQuery || ''}
              onChange={(e) => dispatch(updateCurrentRequest({ gqlQuery: e.target.value }))}
              placeholder="query {\n  users {\n    id\n    name\n  }\n}" mono className="min-h-28 max-h-44" disabled={!currentRequest} />
            <Textarea label="Variables (JSON)" value={currentRequest?.gqlVars || ''}
              onChange={(e) => dispatch(updateCurrentRequest({ gqlVars: e.target.value }))}
              placeholder={'{\n  "id": 1\n}'} mono className="min-h-16 max-h-28" disabled={!currentRequest} />
          </div>
        )}

        {/* Binary */}
        {activeBodyTab === 'binary' && (
          <div>
            <input ref={binaryInputRef} type="file" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setBinaryFile(file)
                  setBinaryFileName(file.name)
                  dispatch(updateCurrentRequest({ textBody: file.name }))
                }
              }} />
            <div className="border-2 border-dashed border-surface-700 rounded-xl p-6 text-center hover:border-surface-600 transition-colors">
              <Upload size={24} className="text-surface-500 mx-auto mb-3" />
              <button onClick={() => binaryInputRef.current?.click()}
                className="bg-surface-800 hover:bg-surface-700 border border-surface-600 text-surface-200 text-xs font-medium px-4 py-2 rounded-lg transition-colors mb-2 block mx-auto">
                Choose File
              </button>
              {binaryFileName
                ? <p className="text-xs text-cyan-400 flex items-center justify-center gap-1.5 mt-2">
                    <FileText size={12} /> {binaryFileName}
                    <button onClick={() => { setBinaryFile(null); setBinaryFileName(''); dispatch(updateCurrentRequest({ textBody: '' })) }}
                      className="text-surface-500 hover:text-red-400 ml-1"><X size={11} /></button>
                  </p>
                : <p className="text-xs text-surface-500">No file selected</p>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Form Data Panel ────────────────────────────────────────────
function FormDataPanel() {
  const dispatch = useAppDispatch()
  const { currentRequest } = useAppSelector((s) => s.fetchlab)
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkText, setBulkText] = useState('')

  const rows = currentRequest?.formFields || []

  const importJson = () => {
    const raw = prompt('Paste JSON object:\n{"field": "value", ...}')
    if (!raw) return
    try {
      const obj = JSON.parse(raw) as Record<string, string>
      const fields = Object.entries(obj).map(([k, v]) => ({ id: generateId(), enabled: true, key: k, value: String(v), fieldType: 'text' as const }))
      dispatch(setFormFields(fields))
    } catch { toast.error('Invalid JSON') }
  }

  const handleKeyChange = useCallback((id: string, value: string) => {
    dispatch(updateFormField({ id, field: 'key', value }))
    const isLast = rows.at(-1)?.id === id
    if (isLast && value) dispatch(addFormField())
  }, [dispatch, rows])

  const handleValueChange = useCallback((id: string, value: string) => {
    dispatch(updateFormField({ id, field: 'value', value }))
    const isLast = rows.at(-1)?.id === id
    if (isLast && value) dispatch(addFormField())
  }, [dispatch, rows])

  const enterBulk = () => {
    setBulkText(rowsToBulk(rows))
    setBulkMode(true)
  }
  const exitBulk = (apply: boolean) => {
    if (apply) {
      const parsed = bulkToRows(bulkText).map((r) => ({ ...r, fieldType: 'text' as const }))
      parsed.push({ id: generateId(), enabled: true, key: '', value: '', fieldType: 'text' })
      dispatch(setFormFields(parsed as FormField[]))
    }
    setBulkMode(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Form Fields</span>
        <div className="flex items-center gap-2">
          <button onClick={importJson}
            className="text-[10px] text-surface-400 hover:text-brand-400 border border-surface-700 hover:border-brand-600/50 px-2 py-0.5 rounded transition-colors">
            Import JSON
          </button>
          <button
            onClick={bulkMode ? () => exitBulk(true) : enterBulk}
            className="flex items-center gap-1 text-[10px] text-surface-400 hover:text-brand-400 border border-surface-700 hover:border-brand-600/50 px-2 py-0.5 rounded-lg transition-colors">
            {bulkMode ? <><Table2 size={10} /> Table</> : <><AlignJustify size={10} /> Bulk Edit</>}
          </button>
        </div>
      </div>

      {bulkMode ? (
        <div className="space-y-2 mb-3">
          <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)}
            placeholder={'field1: value1\nfield2: value2\n\n// or JSON:\n{"field": "value"}'}
            className="w-full h-32 bg-surface-800/60 border border-surface-700/60 rounded-lg px-3 py-2 text-xs font-mono text-surface-200 placeholder:text-surface-600 outline-none focus:border-brand-500 transition-colors resize-none" />
          <div className="flex gap-2">
            <button onClick={() => exitBulk(true)} className="px-3 py-1.5 text-[11px] font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors">Apply</button>
            <button onClick={() => exitBulk(false)} className="px-3 py-1.5 text-[11px] font-medium text-surface-400 hover:text-white border border-surface-700 rounded-lg transition-colors">Cancel</button>
          </div>
        </div>
      ) : (
        <table className="w-full text-xs mb-1">
          <thead>
            <tr className="border-b border-surface-700/60">
              <th className="w-6 pb-1.5" />
              <th className="pb-1.5 text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider w-24">Type</th>
              <th className="pb-1.5 text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider">Key</th>
              <th className="pb-1.5 text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider pl-2">Value / File</th>
              <th className="w-7 pb-1.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-surface-800/30">
                <td className="py-1 pr-2">
                  <input type="checkbox" checked={row.enabled}
                    onChange={(e) => dispatch(updateFormField({ id: row.id, field: 'enabled', value: e.target.checked }))}
                    className="w-3.5 h-3.5 accent-brand-500 cursor-pointer" />
                </td>
                <td className="py-1 pr-2">
                  <select
                    value={row.fieldType || 'text'}
                    onChange={(e) => dispatch(updateFormField({ id: row.id, field: 'fieldType', value: e.target.value }))}
                    className="bg-surface-800 border border-surface-700 rounded px-1.5 py-1 text-[10px] text-surface-300 outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="text">Text</option>
                    <option value="file">File</option>
                  </select>
                </td>
                <td className="py-1 pr-1">
                  <input type="text" value={row.key}
                    onChange={(e) => handleKeyChange(row.id, e.target.value)}
                    placeholder="field name"
                    className="w-full bg-transparent border border-transparent rounded px-2 py-1 font-mono text-xs text-surface-200 placeholder:text-surface-600 focus:bg-surface-800 focus:border-surface-600 outline-none transition-colors" />
                </td>
                <td className="py-1 pl-1">
                  {row.fieldType === 'file'
                    ? <FormFieldFileInput rowId={row.id} />
                    : <input type="text" value={row.value}
                        onChange={(e) => handleValueChange(row.id, e.target.value)}
                        placeholder="value"
                        className="w-full bg-transparent border border-transparent rounded px-2 py-1 font-mono text-xs text-surface-200 placeholder:text-surface-600 focus:bg-surface-800 focus:border-surface-600 outline-none transition-colors" />
                  }
                </td>
                <td className="py-1 pl-2">
                  <button onClick={() => dispatch(deleteFormField(row.id))}
                    className="p-1 rounded text-surface-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={11} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!bulkMode && (
        <button onClick={() => dispatch(addFormField())}
          className="w-full py-1.5 text-[11px] text-surface-500 border border-dashed border-surface-700 rounded-lg hover:border-brand-500/50 hover:text-brand-400 transition-colors flex items-center justify-center gap-1">
          <Plus size={11} /> Add Field
        </button>
      )}
    </div>
  )
}

function FormFieldFileInput({ rowId }: { rowId: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [names, setNames] = useState<string[]>([])

  return (
    <div className="flex items-center gap-2">
      <input ref={inputRef} type="file" multiple className="hidden"
        onChange={(e) => {
          const files = e.target.files
          if (files) {
            formFileStore.set(rowId, files)
            setNames(Array.from(files).map((f) => f.name))
          }
        }} />
      <button onClick={() => inputRef.current?.click()}
        className="bg-surface-800 border border-surface-600 text-surface-200 text-[10px] px-2.5 py-1 rounded-lg hover:bg-surface-700 transition-colors whitespace-nowrap">
        Choose File
      </button>
      {names.length > 0
        ? <span className="text-[10px] text-cyan-400 truncate max-w-[100px]" title={names.join(', ')}>
            {names[0]}{names.length > 1 && <span className="ml-1 bg-brand-600/30 text-brand-400 text-[9px] font-bold px-1.5 rounded-full">+{names.length - 1}</span>}
          </span>
        : <span className="text-[10px] text-surface-500">No file</span>
      }
    </div>
  )
}

// ── URL-Encoded Panel ──────────────────────────────────────────
function FormEncodePanel() {
  const dispatch = useAppDispatch()
  const { currentRequest } = useAppSelector((s) => s.fetchlab)
  const rows = currentRequest?.formEncodeFields || []
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkText, setBulkText] = useState('')

  const handleKeyChange = useCallback((id: string, value: string) => {
    dispatch(updateKVRow({ target: 'formEncodeFields', id, field: 'key', value }))
    const isLast = rows.at(-1)?.id === id
    if (isLast && value) dispatch(addKVRow({ target: 'formEncodeFields' }))
  }, [dispatch, rows])

  const handleValueChange = useCallback((id: string, value: string) => {
    dispatch(updateKVRow({ target: 'formEncodeFields', id, field: 'value', value }))
    const isLast = rows.at(-1)?.id === id
    if (isLast && value) dispatch(addKVRow({ target: 'formEncodeFields' }))
  }, [dispatch, rows])

  const exitBulk = (apply: boolean) => {
    if (apply) {
      const parsed = bulkToRows(bulkText)
      parsed.push({ id: generateId(), enabled: true, key: '', value: '' })
      dispatch(setKVRows({ target: 'formEncodeFields', rows: parsed }))
    }
    setBulkMode(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">URL-Encoded Fields</span>
        <button onClick={bulkMode ? () => exitBulk(true) : () => { setBulkText(rowsToBulk(rows)); setBulkMode(true) }}
          className="flex items-center gap-1 text-[10px] text-surface-400 hover:text-brand-400 border border-surface-700 px-2 py-0.5 rounded-lg transition-colors">
          {bulkMode ? <><Table2 size={10} /> Table</> : <><AlignJustify size={10} /> Bulk Edit</>}
        </button>
      </div>
      {bulkMode ? (
        <div className="space-y-2">
          <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)}
            placeholder={'key1: value1\nkey2: value2'}
            className="w-full h-32 bg-surface-800/60 border border-surface-700/60 rounded-lg px-3 py-2 text-xs font-mono text-surface-200 placeholder:text-surface-600 outline-none focus:border-brand-500 transition-colors resize-none" />
          <div className="flex gap-2">
            <button onClick={() => exitBulk(true)} className="px-3 py-1.5 text-[11px] font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors">Apply</button>
            <button onClick={() => exitBulk(false)} className="px-3 py-1.5 text-[11px] font-medium text-surface-400 hover:text-white border border-surface-700 rounded-lg transition-colors">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <table className="w-full text-xs mb-1">
            <thead>
              <tr className="border-b border-surface-700/60">
                <th className="w-7 pb-1.5" />
                <th className="pb-1.5 text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider">Key</th>
                <th className="pb-1.5 text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider pl-2">Value</th>
                <th className="w-8 pb-1.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-surface-800/30">
                  <td className="py-1 pr-2">
                    <input type="checkbox" checked={row.enabled}
                      onChange={(e) => dispatch(updateKVRow({ target: 'formEncodeFields', id: row.id, field: 'enabled', value: e.target.checked }))}
                      className="w-3.5 h-3.5 accent-brand-500 cursor-pointer" />
                  </td>
                  <td className="py-1 pr-1">
                    <input type="text" value={row.key} onChange={(e) => handleKeyChange(row.id, e.target.value)} placeholder="key"
                      className="w-full bg-transparent border border-transparent rounded px-2 py-1 font-mono text-xs text-surface-200 placeholder:text-surface-600 focus:bg-surface-800 focus:border-surface-600 outline-none transition-colors" />
                  </td>
                  <td className="py-1 pl-1">
                    <input type="text" value={row.value} onChange={(e) => handleValueChange(row.id, e.target.value)} placeholder="value"
                      className="w-full bg-transparent border border-transparent rounded px-2 py-1 font-mono text-xs text-surface-200 placeholder:text-surface-600 focus:bg-surface-800 focus:border-surface-600 outline-none transition-colors" />
                  </td>
                  <td className="py-1 pl-2">
                    <button onClick={() => dispatch(deleteKVRow({ target: 'formEncodeFields', id: row.id }))}
                      className="p-1 rounded text-surface-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => dispatch(addKVRow({ target: 'formEncodeFields' }))}
            className="w-full py-1.5 text-[11px] text-surface-500 border border-dashed border-surface-700 rounded-lg hover:border-brand-500/50 hover:text-brand-400 transition-colors flex items-center justify-center gap-1">
            <Plus size={11} /> Add Field
          </button>
        </>
      )}
    </div>
  )
}
