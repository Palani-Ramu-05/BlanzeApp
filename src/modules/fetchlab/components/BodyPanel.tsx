import { useRef, useState } from 'react'
import { Trash2, Plus, Upload, FileText, X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import {
  setActiveBodyTab, updateCurrentRequest,
  addFormField, updateFormField, deleteFormField, setFormFields,
  addFormFile, updateFormFileKey, updateFormFileEnabled, deleteFormFile,
} from '../store/fetchlabSlice'
import { Textarea } from '@components/index'
import type { BodyType } from '../dto/types/fetchlab.types'
import { cn } from '@utils/index'
import toast from 'react-hot-toast'

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

// ─── File ref store (persists File objects outside Redux) ───
const fileStore = new Map<string, FileList>()

export const BodyPanel = () => {
  const dispatch = useAppDispatch()
  const { currentRequest, activeBodyTab } = useAppSelector((s) => s.fetchlab)
  const [formatError, setFormatError] = useState('')
  const [showFiles, setShowFiles] = useState(true)
  const binaryInputRef = useRef<HTMLInputElement>(null)
  const [binaryFileName, setBinaryFileName] = useState('')

  const beautifyJson = () => {
    try {
      const parsed = JSON.parse(currentRequest?.jsonBody || '')
      dispatch(updateCurrentRequest({ jsonBody: JSON.stringify(parsed, null, 2) }))
      setFormatError('')
    } catch {
      setFormatError('Invalid JSON — cannot format')
    }
  }

  const importFormJson = () => {
    const raw = prompt('Paste JSON object:\n{"field": "value", ...}')
    if (!raw) return
    try {
      const obj = JSON.parse(raw) as Record<string, string>
      const fields = Object.entries(obj).map(([k, v]) => ({ id: Math.random().toString(36).slice(2), enabled: true, key: k, value: String(v) }))
      dispatch(setFormFields(fields))
    } catch {
      toast.error('Invalid JSON')
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
                activeBodyTab === tab.id
                  ? 'text-white border-brand-500 font-semibold'
                  : 'text-surface-400 border-transparent hover:text-surface-200'
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
            placeholder={'<?xml version="1.0"?>\n<root></root>'} mono className="min-h-32 max-h-52" disabled={!currentRequest} />
        )}

        {/* Text */}
        {activeBodyTab === 'text' && (
          <Textarea value={currentRequest?.textBody || ''} onChange={(e) => dispatch(updateCurrentRequest({ textBody: e.target.value }))}
            placeholder="Plain text body…" mono className="min-h-32 max-h-52" disabled={!currentRequest} />
        )}

        {/* Form Data */}
        {activeBodyTab === 'form' && (
          <div>
            {/* Form Fields section */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Form Fields</span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="checkbox" checked={showFiles} onChange={(e) => setShowFiles(e.target.checked)}
                    className="w-3 h-3 accent-brand-500 cursor-pointer" />
                  <span className="text-[10px] text-surface-400">Files</span>
                </label>
                <button onClick={importFormJson}
                  className="text-[10px] text-surface-400 hover:text-brand-400 border border-surface-700 hover:border-brand-600/50 px-2 py-0.5 rounded transition-colors">
                  Import JSON
                </button>
              </div>
            </div>

            {/* Fields table */}
            <table className="w-full text-xs mb-1">
              <thead>
                <tr className="border-b border-surface-700/60">
                  <th className="w-7 pb-1.5" />
                  <th className="pb-1.5 text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider">Field Name</th>
                  <th className="pb-1.5 text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider pl-2">Value</th>
                  <th className="w-8 pb-1.5" />
                </tr>
              </thead>
              <tbody>
                {(currentRequest?.formFields || []).map((row) => (
                  <tr key={row.id} className="border-b border-surface-800/30">
                    <td className="py-1 pr-2">
                      <input type="checkbox" checked={row.enabled}
                        onChange={(e) => dispatch(updateFormField({ id: row.id, field: 'enabled', value: e.target.checked }))}
                        className="w-3.5 h-3.5 accent-brand-500 cursor-pointer" />
                    </td>
                    <td className="py-1 pr-1">
                      <input type="text" value={row.key}
                        onChange={(e) => dispatch(updateFormField({ id: row.id, field: 'key', value: e.target.value }))}
                        placeholder="field name"
                        className="w-full bg-transparent border border-transparent rounded px-2 py-1 font-mono text-xs text-slate-200 placeholder:text-surface-600 focus:bg-surface-800 focus:border-surface-600 outline-none transition-colors" />
                    </td>
                    <td className="py-1 pl-1">
                      <input type="text" value={row.value}
                        onChange={(e) => dispatch(updateFormField({ id: row.id, field: 'value', value: e.target.value }))}
                        placeholder="value"
                        className="w-full bg-transparent border border-transparent rounded px-2 py-1 font-mono text-xs text-slate-200 placeholder:text-surface-600 focus:bg-surface-800 focus:border-surface-600 outline-none transition-colors" />
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
            <button onClick={() => dispatch(addFormField())}
              className="mb-4 w-full py-1.5 text-[11px] text-surface-500 border border-dashed border-surface-700 rounded-lg hover:border-brand-500/50 hover:text-brand-400 transition-colors flex items-center justify-center gap-1">
              <Plus size={11} /> Add Field
            </button>

            {/* Files section */}
            {showFiles && (
              <div>
                <div className="border-t border-surface-700/40 pt-3 mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Files</span>
                    <span className="text-[10px] text-surface-500">Multiple files per field allowed</span>
                  </div>
                </div>

                <table className="w-full text-xs mb-1">
                  <thead>
                    <tr className="border-b border-surface-700/60">
                      <th className="w-7 pb-1.5" />
                      <th className="pb-1.5 text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider">Field Name</th>
                      <th className="pb-1.5 text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider pl-2">File(s)</th>
                      <th className="w-8 pb-1.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {(currentRequest?.formFiles || []).map((row) => (
                      <FormFileRow key={row.id} rowId={row.id} rowKey={row.key} enabled={row.enabled} />
                    ))}
                  </tbody>
                </table>
                <button onClick={() => dispatch(addFormFile())}
                  className="w-full py-1.5 text-[11px] text-surface-500 border border-dashed border-surface-700 rounded-lg hover:border-brand-500/50 hover:text-brand-400 transition-colors flex items-center justify-center gap-1">
                  <Plus size={11} /> Add File Field
                </button>
              </div>
            )}
          </div>
        )}

        {/* URL-Encoded */}
        {activeBodyTab === 'formencode' && (
          <FormEncodeTable />
        )}

        {/* GraphQL */}
        {activeBodyTab === 'graphql' && (
          <div className="space-y-3">
            <Textarea label="Query" value={currentRequest?.gqlQuery || ''}
              onChange={(e) => dispatch(updateCurrentRequest({ gqlQuery: e.target.value }))}
              placeholder="query { users { id name } }" mono className="min-h-28 max-h-44" disabled={!currentRequest} />
            <Textarea label="Variables (JSON)" value={currentRequest?.gqlVars || ''}
              onChange={(e) => dispatch(updateCurrentRequest({ gqlVars: e.target.value }))}
              placeholder={'{ "id": 1 }'} mono className="min-h-16 max-h-28" disabled={!currentRequest} />
          </div>
        )}

        {/* Binary */}
        {activeBodyTab === 'binary' && (
          <div>
            <input ref={binaryInputRef} type="file" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setBinaryFileName(file.name)
                  dispatch(updateCurrentRequest({ textBody: file.name }))
                }
              }} />
            <div className="border-2 border-dashed border-surface-700 rounded-xl p-6 text-center hover:border-surface-600 transition-colors">
              <Upload size={24} className="text-surface-500 mx-auto mb-3" />
              <button onClick={() => binaryInputRef.current?.click()}
                className="bg-surface-800 hover:bg-surface-700 border border-surface-600 text-slate-200 text-xs font-medium px-4 py-2 rounded-lg transition-colors mb-2 block mx-auto">
                Choose File
              </button>
              {binaryFileName
                ? <p className="text-xs text-cyan-400 flex items-center justify-center gap-1.5 mt-2">
                    <FileText size={12} /> {binaryFileName}
                    <button onClick={() => { setBinaryFileName(''); dispatch(updateCurrentRequest({ textBody: '' })) }}
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

// ─────────────────────────────────────────────────────────────
//  File row component (manages its own file input)
// ─────────────────────────────────────────────────────────────
function FormFileRow({ rowId, rowKey, enabled }: { rowId: string; rowKey: string; enabled: boolean }) {
  const dispatch = useAppDispatch()
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileNames, setFileNames] = useState<string[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    fileStore.set(rowId, files)
    setFileNames(Array.from(files).map((f) => f.name))
  }

  return (
    <tr className="border-b border-surface-800/30">
      <td className="py-1.5 pr-2">
        <input type="checkbox" checked={enabled}
          onChange={(e) => dispatch(updateFormFileEnabled({ id: rowId, enabled: e.target.checked }))}
          className="w-3.5 h-3.5 accent-brand-500 cursor-pointer" />
      </td>
      <td className="py-1.5 pr-2" style={{ minWidth: 100 }}>
        <input type="text" value={rowKey}
          onChange={(e) => dispatch(updateFormFileKey({ id: rowId, key: e.target.value }))}
          placeholder="field name"
          className="w-full bg-transparent border border-transparent rounded px-2 py-1 font-mono text-xs text-slate-200 placeholder:text-surface-600 focus:bg-surface-800 focus:border-surface-600 outline-none transition-colors" />
      </td>
      <td className="py-1.5 pl-1">
        <div className="flex items-center gap-2">
          <input ref={inputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
          <button onClick={() => inputRef.current?.click()}
            className="bg-surface-800 hover:bg-surface-700 border border-surface-600 text-slate-200 text-[10px] px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap flex-shrink-0">
            Choose File
          </button>
          {fileNames.length > 0
            ? <span className="text-[10px] text-cyan-400 truncate max-w-[120px]" title={fileNames.join(', ')}>
                {fileNames[0]}{fileNames.length > 1 && <span className="ml-1 bg-brand-600/30 text-brand-400 text-[9px] font-bold px-1.5 rounded-full">+{fileNames.length - 1}</span>}
              </span>
            : <span className="text-[10px] text-surface-500">Select file</span>
          }
        </div>
      </td>
      <td className="py-1.5 pl-2">
        <button onClick={() => { dispatch(deleteFormFile(rowId)); fileStore.delete(rowId) }}
          className="p-1 rounded text-surface-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <Trash2 size={11} />
        </button>
      </td>
    </tr>
  )
}

// ─────────────────────────────────────────────────────────────
//  URL-encoded table
// ─────────────────────────────────────────────────────────────
function FormEncodeTable() {
  const dispatch = useAppDispatch()
  const { currentRequest } = useAppSelector((s) => s.fetchlab)
  const rows = currentRequest?.formEncodeFields || []

  return (
    <div>
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
                  onChange={(e) => dispatch({ type: 'fetchlab/updateKVRow', payload: { target: 'formEncodeFields', id: row.id, field: 'enabled', value: e.target.checked } })}
                  className="w-3.5 h-3.5 accent-brand-500 cursor-pointer" />
              </td>
              <td className="py-1 pr-1">
                <input type="text" value={row.key}
                  onChange={(e) => dispatch({ type: 'fetchlab/updateKVRow', payload: { target: 'formEncodeFields', id: row.id, field: 'key', value: e.target.value } })}
                  placeholder="key"
                  className="w-full bg-transparent border border-transparent rounded px-2 py-1 font-mono text-xs text-slate-200 placeholder:text-surface-600 focus:bg-surface-800 focus:border-surface-600 outline-none transition-colors" />
              </td>
              <td className="py-1 pl-1">
                <input type="text" value={row.value}
                  onChange={(e) => dispatch({ type: 'fetchlab/updateKVRow', payload: { target: 'formEncodeFields', id: row.id, field: 'value', value: e.target.value } })}
                  placeholder="value"
                  className="w-full bg-transparent border border-transparent rounded px-2 py-1 font-mono text-xs text-slate-200 placeholder:text-surface-600 focus:bg-surface-800 focus:border-surface-600 outline-none transition-colors" />
              </td>
              <td className="py-1 pl-2">
                <button onClick={() => dispatch({ type: 'fetchlab/deleteKVRow', payload: { target: 'formEncodeFields', id: row.id } })}
                  className="p-1 rounded text-surface-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 size={11} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => dispatch({ type: 'fetchlab/addKVRow', payload: { target: 'formEncodeFields' } })}
        className="w-full py-1.5 text-[11px] text-surface-500 border border-dashed border-surface-700 rounded-lg hover:border-brand-500/50 hover:text-brand-400 transition-colors flex items-center justify-center gap-1">
        <Plus size={11} /> Add Field
      </button>
    </div>
  )
}

// Export fileStore so sendRequest thunk can access file data
export { fileStore }
