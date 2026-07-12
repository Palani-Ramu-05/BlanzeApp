import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Database, ArrowLeft, Plus, FolderPlus, Trash2,
  Star, Copy, Globe, ChevronRight, FileJson,
  BarChart3, List, Box, X, Activity,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import {
  fetchProject, fetchCollections, createCollection, deleteCollection,
  fetchEndpoints, createEndpoint, updateEndpoint, deleteEndpoint,
  fetchScenarios, createScenario, updateScenario, deleteScenario,
  fetchLogs, fetchAnalytics, clearLogs,
  fetchVariables, createVariable, deleteVariable,
  fetchEnvironments, toggleFavorite,
  setCurrentEndpoint, resetProjectState, fetchProjectStats,
} from '../store/apiMockServerSlice'
import type { MockProject, MockCollection, MockEndpoint, ActivePanel, KVEntry, ResponseConfig } from '../dto/types/api-mock-server.types'
import { cn } from '@utils/index'
import { ROUTES } from '@core/constants/constants'
import envConfig from '@core/config/envConfig'
import { getMockUrl } from '../services/api-mock-server.service'

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-400', POST: 'text-blue-400', PUT: 'text-orange-400',
  PATCH: 'text-violet-400', DELETE: 'text-red-400', HEAD: 'text-surface-400', OPTIONS: 'text-surface-400',
}

const METHOD_BG: Record<string, string> = {
  GET: 'bg-emerald-500/10 border-emerald-500/20', POST: 'bg-blue-500/10 border-blue-500/20',
  PUT: 'bg-orange-500/10 border-orange-500/20', PATCH: 'bg-violet-500/10 border-violet-500/20',
  DELETE: 'bg-red-500/10 border-red-500/20', HEAD: 'bg-surface-500/10 border-surface-500/20',
  OPTIONS: 'bg-surface-500/10 border-surface-500/20',
}

const STATUS_OPTIONS = [200, 201, 202, 204, 301, 302, 304, 400, 401, 403, 404, 405, 409, 422, 429, 500, 502, 503]
const DELAY_OPTIONS = [0, 250, 500, 1000, 2000, 5000, 10000]
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

function KVEditor({ entries, onChange, label }: { entries: KVEntry[]; onChange: (entries: KVEntry[]) => void; label: string }) {
  const add = () => onChange([...entries, { key: '', value: '', enabled: true }])
  const remove = (i: number) => onChange(entries.filter((_, idx) => idx !== i))
  const update = (i: number, field: keyof KVEntry, value: unknown) => {
    const next = entries.map((e, idx) => idx === i ? { ...e, [field]: value } : e)
    onChange(next)
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-surface-400">{label}</span>
        <button onClick={add} className="text-[9px] text-brand-400 hover:text-brand-300 flex items-center gap-0.5"><Plus size={8} /> Add</button>
      </div>
      {entries.map((entry, i) => (
        <div key={i} className="flex items-center gap-1">
          <input type="checkbox" checked={entry.enabled} onChange={(e) => update(i, 'enabled', e.target.checked)}
            className="w-2.5 h-2.5 accent-brand-500 cursor-pointer" />
          <input value={entry.key} onChange={(e) => update(i, 'key', e.target.value)} placeholder="Key"
            className="flex-1 min-w-0 px-1.5 py-1 bg-surface-800/60 border border-surface-700/50 rounded text-[10px] font-mono text-surface-100 placeholder:text-surface-600 outline-none focus:border-brand-500/40" />
          <input value={entry.value} onChange={(e) => update(i, 'value', e.target.value)} placeholder="Value"
            className="flex-1 min-w-0 px-1.5 py-1 bg-surface-800/60 border border-surface-700/50 rounded text-[10px] font-mono text-surface-100 placeholder:text-surface-600 outline-none focus:border-brand-500/40" />
          <button onClick={() => remove(i)} className="p-0.5 rounded text-surface-600 hover:text-red-400"><X size={10} /></button>
        </div>
      ))}
    </div>
  )
}

function ResponseBuilder({ response, onChange }: { response: ResponseConfig; onChange: (r: ResponseConfig) => void }) {
  const status = response?.statusCode || 200
  const contentType = response?.contentType || 'application/json'

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-[10px] font-medium text-surface-400 mb-0.5 block">Status Code</label>
          <select value={status} onChange={(e) => onChange({ ...response, statusCode: parseInt(e.target.value) })}
            className="w-full px-2 py-1 bg-surface-800/60 border border-surface-700/50 rounded-lg text-[11px] text-surface-100 outline-none focus:border-brand-500/60">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s} - {s < 300 ? 'Success' : s < 400 ? 'Redirect' : s < 500 ? 'Client Error' : 'Server Error'}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-medium text-surface-400 mb-0.5 block">Content Type</label>
          <select value={contentType} onChange={(e) => onChange({ ...response, contentType: e.target.value })}
            className="w-full px-2 py-1 bg-surface-800/60 border border-surface-700/50 rounded-lg text-[11px] text-surface-100 outline-none focus:border-brand-500/60">
            <option value="application/json">JSON</option>
            <option value="application/xml">XML</option>
            <option value="text/plain">Text</option>
            <option value="text/html">HTML</option>
          </select>
        </div>
        <div className="w-20">
          <label className="text-[10px] font-medium text-surface-400 mb-0.5 block">Delay (ms)</label>
          <select value={response.delay} onChange={(e) => onChange({ ...response, delay: parseInt(e.target.value) })}
            className="w-full px-2 py-1 bg-surface-800/60 border border-surface-700/50 rounded-lg text-[11px] text-surface-100 outline-none focus:border-brand-500/60">
            {DELAY_OPTIONS.map((d) => <option key={d} value={d}>{d === 0 ? 'Instant' : d >= 1000 ? `${d / 1000}s` : `${d}ms`}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-medium text-surface-400 mb-0.5 block">Response Headers</label>
        <KVEditor entries={response.headers || []} onChange={(h) => onChange({ ...response, headers: h })} label="" />
      </div>

      <div>
        <label className="text-[10px] font-medium text-surface-400 mb-1 block">Response Body</label>
        <textarea value={response.body || '{}'} onChange={(e) => onChange({ ...response, body: e.target.value })}
          className="w-full h-40 px-3 py-2 bg-surface-800/80 border border-surface-700/50 rounded-lg text-[10px] font-mono text-surface-100 placeholder:text-surface-600 outline-none focus:border-brand-500/60 transition-all resize-none"
          placeholder='{ "message": "Hello World" }' spellCheck={false} />
      </div>

      <div className="flex gap-2">
        <button onClick={() => {
          try { onChange({ ...response, body: JSON.stringify(JSON.parse(response.body || '{}'), null, 2) }) }
          catch { /* ignore invalid JSON */ }
        }} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] text-surface-400 border border-surface-700/50 hover:text-surface-200 transition-all">
          <FileJson size={9} /> Format JSON
        </button>
        <button onClick={() => onChange({ ...response, body: '' })}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] text-surface-500 hover:text-red-400 transition-all">
          <Trash2 size={9} /> Clear
        </button>
      </div>
    </div>
  )
}

function ScenarioPanel({ endpointUuid }: { endpointUuid: string }) {
  const dispatch = useAppDispatch()
  const { scenarios } = useAppSelector((s) => s.apiMockServer)
  const [editing, setEditing] = useState<string | null>(null)
  const [newScenario, setNewScenario] = useState(false)

  useEffect(() => { dispatch(fetchScenarios(endpointUuid)) }, [dispatch, endpointUuid])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-surface-400">Scenarios ({scenarios.length})</span>
        <button onClick={() => setNewScenario(true)} className="text-[9px] text-brand-400 hover:text-brand-300 flex items-center gap-0.5">
          <Plus size={8} /> Add Scenario
        </button>
      </div>

      {scenarios.length === 0 && !newScenario && (
        <p className="text-[10px] text-surface-600 text-center py-3">No scenarios. Create one to define conditional responses.</p>
      )}

      {scenarios.map((s) => (
        <div key={s.uuid} className="bg-surface-800/40 border border-surface-700/40 rounded-xl p-2 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-surface-200">{s.name}</span>
              {s.isDefault && <span className="text-[8px] bg-brand-500/15 text-brand-400 px-1 py-0.5 rounded font-medium">Default</span>}
              <span className="text-[9px] text-surface-500">{s.probability}%</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => dispatch(deleteScenario(s.uuid))} className="p-0.5 text-surface-600 hover:text-red-400"><Trash2 size={9} /></button>
            </div>
          </div>
          <ResponseBuilder response={s.response} onChange={(r) => dispatch(updateScenario({ uuid: s.uuid, data: { response: r } }))} />
        </div>
      ))}

      {newScenario && (
        <div className="bg-surface-800/60 border border-brand-500/30 rounded-xl p-2 space-y-2">
          <input placeholder="Scenario name (e.g., Success)"
            className="w-full px-2 py-1 bg-surface-800 border border-surface-700/50 rounded text-[10px] text-surface-100 placeholder:text-surface-600 outline-none focus:border-brand-500/60"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                dispatch(createScenario({
                  endpointUuid, name: (e.target as HTMLInputElement).value.trim(), isDefault: scenarios.length === 0, probability: 100,
                  response: { statusCode: 200, headers: [], cookies: [], body: '{}', contentType: 'application/json', delay: 0 },
                }))
                setNewScenario(false)
              }
            }} autoFocus />
        </div>
      )}
    </div>
  )
}

function LogPanel({ projectUuid }: { projectUuid: string }) {
  const dispatch = useAppDispatch()
  const { logs } = useAppSelector((s) => s.apiMockServer)

  useEffect(() => { dispatch(fetchLogs({ projectUuid })) }, [dispatch, projectUuid])

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-surface-400">Request Logs ({logs.length})</span>
        <button onClick={() => dispatch(clearLogs(projectUuid))} className="text-[9px] text-surface-500 hover:text-red-400 flex items-center gap-0.5">
          <Trash2 size={8} /> Clear
        </button>
      </div>
      {logs.length === 0 ? (
        <p className="text-[10px] text-surface-600 text-center py-3">No requests logged yet. Send a request to your mock API.</p>
      ) : (
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.uuid} className="flex items-center gap-2 px-2 py-1.5 bg-surface-800/30 border border-surface-700/30 rounded-lg">
              <span className={cn('text-[9px] font-bold font-mono w-10', METHOD_COLORS[log.method] || 'text-surface-400')}>{log.method}</span>
              <span className={cn('text-[9px] font-mono w-8 text-center', log.statusCode < 300 ? 'text-emerald-400' : log.statusCode < 500 ? 'text-orange-400' : 'text-red-400')}>{log.statusCode}</span>
              <span className="flex-1 text-[9px] text-surface-400 font-mono truncate">{log.url}</span>
              <span className="text-[8px] text-surface-600">{log.responseTime}ms</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AnalyticsPanel({ projectUuid }: { projectUuid: string }) {
  const dispatch = useAppDispatch()
  const { analytics } = useAppSelector((s) => s.apiMockServer)

  useEffect(() => { dispatch(fetchAnalytics(projectUuid)) }, [dispatch, projectUuid])

  const summary = analytics?.summary
  const methods = analytics?.methodDistribution || []

  return (
    <div className="space-y-3">
      {summary ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface-800/40 border border-surface-700/40 rounded-xl p-2.5">
              <p className="text-[9px] text-surface-500">Total Requests</p>
              <p className="text-lg font-bold text-surface-50">{summary.totalRequests}</p>
            </div>
            <div className="bg-surface-800/40 border border-surface-700/40 rounded-xl p-2.5">
              <p className="text-[9px] text-surface-500">Avg Response</p>
              <p className="text-lg font-bold text-surface-50">{Math.round(summary.averageResponseTime)}ms</p>
            </div>
            <div className="bg-surface-800/40 border border-surface-700/40 rounded-xl p-2.5">
              <p className="text-[9px] text-surface-500">Errors</p>
              <p className="text-lg font-bold text-red-400">{summary.errorCount}</p>
            </div>
            <div className="bg-surface-800/40 border border-surface-700/40 rounded-xl p-2.5">
              <p className="text-[9px] text-surface-500">Error Rate</p>
              <p className="text-lg font-bold text-surface-50">{summary.totalRequests > 0 ? Math.round((summary.errorCount / summary.totalRequests) * 100) : 0}%</p>
            </div>
          </div>
          {methods.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-surface-400 mb-1">Method Distribution</p>
              <div className="space-y-1">
                {methods.map((m: any) => (
                  <div key={m._id} className="flex items-center gap-2">
                    <span className={cn('text-[9px] font-bold font-mono w-12', METHOD_COLORS[m._id] || 'text-surface-400')}>{m._id}</span>
                    <div className="flex-1 h-2 bg-surface-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500/50 rounded-full" style={{ width: `${(m.count / Math.max(...methods.map((x: any) => x.count))) * 100}%` }} />
                    </div>
                    <span className="text-[9px] text-surface-500 w-8 text-right">{m.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-[10px] text-surface-600 text-center py-3">No analytics data yet.</p>
      )}
    </div>
  )
}

function VariablesPanel({ projectUuid }: { projectUuid: string }) {
  const dispatch = useAppDispatch()
  const { variables } = useAppSelector((s) => s.apiMockServer)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  useEffect(() => { dispatch(fetchVariables(projectUuid)) }, [dispatch, projectUuid])

  const addVar = () => {
    if (newKey.trim()) {
      dispatch(createVariable({ projectUuid, key: newKey.trim(), value: newValue.trim(), type: 'static', fakerType: '', description: '' }))
      setNewKey('')
      setNewValue('')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="Variable name"
          className="flex-1 px-2 py-1 bg-surface-800/60 border border-surface-700/50 rounded text-[10px] text-surface-100 placeholder:text-surface-600 outline-none focus:border-brand-500/60 font-mono"
          onKeyDown={(e) => e.key === 'Enter' && addVar()} />
        <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Value"
          className="flex-1 px-2 py-1 bg-surface-800/60 border border-surface-700/50 rounded text-[10px] text-surface-100 placeholder:text-surface-600 outline-none focus:border-brand-500/60 font-mono"
          onKeyDown={(e) => e.key === 'Enter' && addVar()} />
        <button onClick={addVar} disabled={!newKey.trim()} className="px-2 py-1 rounded text-[10px] bg-brand-600/20 text-brand-400 disabled:opacity-40"><Plus size={10} /></button>
      </div>
      <p className="text-[9px] text-surface-600">Use <code className="text-surface-400 bg-surface-800 px-1 rounded">{'{{variableName}}'}</code> in response bodies</p>
      {variables.map((v) => (
        <div key={v.uuid} className="flex items-center gap-1.5 px-2 py-1 bg-surface-800/30 border border-surface-700/30 rounded-lg">
          <span className="text-[10px] font-mono text-brand-400 font-medium">{'{{'}{v.key}{'}}'}</span>
          <span className="text-[9px] text-surface-500">=</span>
          <span className="flex-1 text-[10px] text-surface-300 truncate">{v.value}</span>
          <span className={cn('text-[8px] px-1 py-0.5 rounded', v.type === 'dynamic' ? 'text-blue-400 bg-blue-500/10' : v.type === 'faker' ? 'text-violet-400 bg-violet-500/10' : 'text-surface-400 bg-surface-700/50')}>{v.type}</span>
          <button onClick={() => dispatch(deleteVariable(v.uuid))} className="p-0.5 text-surface-600 hover:text-red-400"><X size={8} /></button>
        </div>
      ))}
    </div>
  )
}

function EndpointList({
  endpoints, selectedUuid, onSelect, onCreate, onDelete, project,
}: {
  endpoints: MockEndpoint[]; selectedUuid: string | null; onSelect: (ep: MockEndpoint) => void; onCreate: () => void; onDelete: (uuid: string) => void; project: MockProject
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-[10px] font-medium text-surface-500">Endpoints ({endpoints.length})</span>
        <button onClick={onCreate} className="flex items-center gap-0.5 text-[9px] text-brand-400 hover:text-brand-300">
          <Plus size={9} /> New
        </button>
      </div>
      {endpoints.length === 0 ? (
        <p className="text-[10px] text-surface-600 text-center py-4">No endpoints yet. Click <strong className="text-surface-400">New</strong> to create one.</p>
      ) : (
        endpoints.map((ep) => (
          <div key={ep.uuid} onClick={() => onSelect(ep)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all group border border-transparent',
              selectedUuid === ep.uuid
                ? 'bg-brand-500/10 border-brand-500/20'
                : 'hover:bg-surface-800/60 hover:border-surface-700/40',
            )}
          >
            <span className={cn('text-[9px] font-bold font-mono w-10', METHOD_COLORS[ep.method] || 'text-surface-400')}>{ep.method}</span>
            <span className="flex-1 text-[10px] text-surface-300 font-mono truncate">{ep.path}</span>
            <span className="text-[9px] text-surface-600 opacity-0 group-hover:opacity-100">{ep.statusCode}</span>
            <button onClick={(e) => { e.stopPropagation(); onDelete(ep.uuid) }}
              className="p-0.5 text-surface-600 hover:text-red-400 opacity-0 group-hover:opacity-100">
              <Trash2 size={9} />
            </button>
          </div>
        ))
      )}
    </div>
  )
}

function NewEndpointModal({ open, onClose, projectUuid, collectionUuid }: { open: boolean; onClose: () => void; projectUuid: string; collectionUuid: string }) {
  const dispatch = useAppDispatch()
  const [method, setMethod] = useState('GET')
  const [path, setPath] = useState('/')
  const [description, setDescription] = useState('')

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-surface-900 border border-surface-700/60 rounded-2xl p-5 w-full max-w-md shadow-dropdown mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-bold text-surface-50 mb-1">New Endpoint</h2>
        <p className="text-[11px] text-surface-500 mb-4">Configure a new mock endpoint</p>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="w-24">
              <label className="text-[10px] font-medium text-surface-400 mb-1 block">Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)}
                className="w-full px-2 py-1.5 bg-surface-800 border border-surface-700/60 rounded-lg text-[11px] text-surface-100 outline-none focus:border-brand-500/60">
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-medium text-surface-400 mb-1 block">Path</label>
              <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/users"
                className="w-full px-3 py-1.5 bg-surface-800 border border-surface-700/60 rounded-lg text-[11px] text-surface-50 placeholder:text-surface-600 outline-none focus:border-brand-500/60 font-mono" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-medium text-surface-400 mb-1 block">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="List all users"
              className="w-full px-3 py-1.5 bg-surface-800 border border-surface-700/60 rounded-lg text-[11px] text-surface-50 placeholder:text-surface-600 outline-none focus:border-brand-500/60" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-surface-700/40">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-[11px] text-surface-400 hover:text-surface-200 transition-all">Cancel</button>
          <button onClick={() => {
            dispatch(createEndpoint({
              projectUuid, collectionUuid, method, path: path.startsWith('/') ? path : `/${path}`, description,
              response: { statusCode: 200, headers: [], cookies: [], body: JSON.stringify({ message: 'Hello from mock!' }, null, 2), contentType: 'application/json', delay: 0 },
            }))
            onClose()
          }} disabled={!path.trim()}
            className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400 disabled:opacity-40 transition-all shadow-glow-sm">
            Create Endpoint
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function CollectionSidebar({
  collections, selectedCollection, onSelectCollection, onCreateCollection, onDeleteCollection,
}: {
  collections: MockCollection[]; selectedCollection: string | null; onSelectCollection: (c: MockCollection) => void;
  onCreateCollection: (name: string) => void; onDeleteCollection: (uuid: string) => void
}) {
  const [newColName, setNewColName] = useState('')
  const [showNewCol, setShowNewCol] = useState(false)

  const handleCreate = () => {
    if (newColName.trim()) { onCreateCollection(newColName.trim()); setNewColName(''); setShowNewCol(false) }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-medium text-surface-500">Collections</span>
        <button onClick={() => setShowNewCol(true)} className="text-[9px] text-brand-400 hover:text-brand-300"><FolderPlus size={11} /></button>
      </div>

      {showNewCol && (
        <div className="flex items-center gap-1 px-1">
          <input value={newColName} onChange={(e) => setNewColName(e.target.value)} placeholder="Collection name" autoFocus
            className="flex-1 px-2 py-1 bg-surface-800 border border-brand-500/30 rounded text-[10px] text-surface-100 placeholder:text-surface-600 outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') { setShowNewCol(false); setNewColName('') }
            }} />
        </div>
      )}

      {collections.length === 0 && !showNewCol && (
        <p className="text-[10px] text-surface-600 text-center py-2">No collections</p>
      )}

      {collections.map((col) => (
        <div key={col.uuid} onClick={() => onSelectCollection(col)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all group',
            selectedCollection === col.uuid ? 'bg-brand-500/10 text-brand-300' : 'text-surface-400 hover:bg-surface-800/60 hover:text-surface-200',
          )}
        >
          <ChevronRight size={10} className="flex-shrink-0" />
          <span className="flex-1 text-[10px] truncate">{col.name}</span>
          <span className="text-[8px] text-surface-600 opacity-0 group-hover:opacity-100">{col.sortOrder}</span>
          <button onClick={(e) => { e.stopPropagation(); onDeleteCollection(col.uuid) }}
            className="p-0.5 text-surface-600 hover:text-red-400 opacity-0 group-hover:opacity-100">
            <Trash2 size={8} />
          </button>
        </div>
      ))}
    </div>
  )
}

export default function ApiMockServerProjectPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { project, collections, endpoints, currentEndpoint, activePanel, scenarios, variables } = useAppSelector((s) => s.apiMockServer)
  const [selectedCollectionUuid, setSelectedCollectionUuid] = useState<string | null>(null)
  const [showNewEndpoint, setShowNewEndpoint] = useState(false)
  const [rightTab, setRightTab] = useState<ActivePanel>('response')

  useEffect(() => {
    if (uuid) {
      dispatch(fetchProject(uuid))
      dispatch(fetchCollections(uuid))
      dispatch(fetchEndpoints({ projectUuid: uuid }))
      dispatch(fetchVariables(uuid))
      dispatch(fetchEnvironments(uuid))
      dispatch(fetchProjectStats(uuid))
    }
    return () => { dispatch(resetProjectState()) }
  }, [dispatch, uuid])

  const handleSelectCollection = (col: MockCollection) => {
    setSelectedCollectionUuid(col.uuid)
    if (uuid) dispatch(fetchEndpoints({ projectUuid: uuid, collectionUuid: col.uuid }))
  }

  const handleSelectEndpoint = (ep: MockEndpoint) => {
    dispatch(setCurrentEndpoint(ep))
    dispatch(fetchScenarios(ep.uuid))
  }

  const handleCreateCollection = (name: string) => {
    if (uuid) dispatch(createCollection({ projectUuid: uuid, name }))
  }

  const handleDeleteCollection = (colUuid: string) => {
    dispatch(deleteCollection(colUuid))
    if (selectedCollectionUuid === colUuid) {
      setSelectedCollectionUuid(null)
      if (uuid) dispatch(fetchEndpoints({ projectUuid: uuid }))
    }
  }

  const [localResponse, setLocalResponse] = useState<ResponseConfig | null>(null)
  const saveResponse = useCallback(() => {
    if (currentEndpoint && localResponse) {
      dispatch(updateEndpoint({ uuid: currentEndpoint.uuid, data: { response: localResponse } }))
    }
  }, [currentEndpoint, localResponse, dispatch])

  useEffect(() => {
    if (currentEndpoint) {
      setLocalResponse(currentEndpoint.response || { statusCode: 200, headers: [], cookies: [], body: '{}', contentType: 'application/json', delay: 0 })
    }
  }, [currentEndpoint])

  const mockUrl = project ? getMockUrl(project) : ''

  const filteredEndpoints = selectedCollectionUuid
    ? endpoints.filter((ep) => ep.collectionUuid === selectedCollectionUuid)
    : endpoints

  if (!project) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-surface-500 text-sm">Loading project...</div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(ROUTES.API_MOCK_SERVER)} className="p-1 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800 transition-all">
            <ArrowLeft size={14} />
          </button>
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center">
            <Database size={12} className="text-surface-50" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-surface-50">{project.name}</h1>
            <p className="text-[9px] text-surface-500 font-mono">{mockUrl}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => navigator.clipboard.writeText(mockUrl)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] text-surface-400 border border-surface-700/50 hover:text-surface-200 transition-all">
            <Copy size={9} /> Copy URL
          </button>
          <button onClick={() => dispatch(toggleFavorite(project.uuid))}
            className={cn('p-1.5 rounded-lg border transition-all', project.isFavorite ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' : 'text-surface-500 border-surface-700/50 hover:text-surface-200')}>
            <Star size={11} className={project.isFavorite ? 'fill-yellow-400' : ''} />
          </button>
          <button onClick={() => window.open(mockUrl, '_blank')}
            className="p-1.5 rounded-lg border border-surface-700/50 text-surface-500 hover:text-surface-200 transition-all">
            <Globe size={11} />
          </button>
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="flex-1 flex gap-2 min-h-0">
        {/* Left Panel - Collections */}
        <div className="w-48 flex-shrink-0 bg-surface-900/60 border border-surface-700/50 rounded-2xl p-2.5 overflow-y-auto">
          <CollectionSidebar
            collections={collections}
            selectedCollection={selectedCollectionUuid}
            onSelectCollection={handleSelectCollection}
            onCreateCollection={handleCreateCollection}
            onDeleteCollection={handleDeleteCollection}
          />
          <div className="h-px bg-surface-700/30 my-2" />
          <EndpointList
            endpoints={filteredEndpoints}
            selectedUuid={currentEndpoint?.uuid || null}
            onSelect={handleSelectEndpoint}
            onCreate={() => {
              if (collections.length > 0) setShowNewEndpoint(true)
            }}
            onDelete={(epUuid) => dispatch(deleteEndpoint(epUuid))}
            project={project}
          />
        </div>

        {/* Center Panel - Endpoint Detail */}
        <div className="flex-1 bg-surface-900/60 border border-surface-700/50 rounded-2xl p-3 overflow-y-auto min-w-0">
          {currentEndpoint ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={cn('text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border', METHOD_BG[currentEndpoint.method] || 'bg-surface-500/10', METHOD_COLORS[currentEndpoint.method] || 'text-surface-400')}>
                  {currentEndpoint.method}
                </span>
                <span className="text-[11px] font-mono text-surface-100 font-medium">{currentEndpoint.path}</span>
                <span className="text-[9px] text-surface-600">v{currentEndpoint.version}</span>
              </div>
              <p className="text-[10px] text-surface-500">{currentEndpoint.description || 'No description'}</p>

              {/* Tab bar */}
              <div className="flex gap-px bg-surface-800/60 border border-surface-700/50 rounded-lg p-px">
                {[
                  { id: 'response' as ActivePanel, label: 'Response', icon: FileJson },
                  { id: 'scenarios' as ActivePanel, label: 'Scenarios', icon: List },
                  { id: 'logs' as ActivePanel, label: 'Logs', icon: Activity },
                  { id: 'analytics' as ActivePanel, label: 'Analytics', icon: BarChart3 },
                  { id: 'variables' as ActivePanel, label: 'Variables', icon: Box },
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setRightTab(tab.id)}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1.5 rounded text-[9px] font-semibold transition-all flex-1 justify-center',
                      rightTab === tab.id ? 'bg-brand-600/20 text-brand-300' : 'text-surface-500 hover:text-surface-200',
                    )}
                  >
                    <tab.icon size={10} /> {tab.label}
                  </button>
                ))}
              </div>

              {/* Panel content */}
              {rightTab === 'response' && localResponse && (
                <div className="space-y-2">
                  <ResponseBuilder response={localResponse} onChange={setLocalResponse} />
                  <div className="flex justify-end">
                    <button onClick={saveResponse}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400 transition-all shadow-glow-sm">
                      Save Response
                    </button>
                  </div>
                </div>
              )}
              {rightTab === 'scenarios' && <ScenarioPanel endpointUuid={currentEndpoint.uuid} />}
              {rightTab === 'logs' && <LogPanel projectUuid={project.uuid} />}
              {rightTab === 'analytics' && <AnalyticsPanel projectUuid={project.uuid} />}
              {rightTab === 'variables' && <VariablesPanel projectUuid={project.uuid} />}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-surface-500">
              <FileJson size={24} className="text-surface-700 mb-2" />
              <p className="text-sm font-medium text-surface-400">Select an endpoint</p>
              <p className="text-[10px] text-surface-600">Choose an endpoint from the sidebar to edit its response</p>
            </div>
          )}
        </div>

        {/* Right Panel - Preview & Info */}
        <div className="w-64 flex-shrink-0 bg-surface-900/60 border border-surface-700/50 rounded-2xl p-3 overflow-y-auto">
          {currentEndpoint ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-surface-400">Preview</span>
                <button onClick={() => {
                  const fullUrl = `${mockUrl}${currentEndpoint.path}`
                  navigator.clipboard.writeText(`curl -X ${currentEndpoint.method} "${fullUrl}" -H "Content-Type: application/json"`)
                }} className="text-[9px] text-brand-400 hover:text-brand-300 flex items-center gap-0.5">
                  <Copy size={8} /> cURL
                </button>
              </div>

              <div className="bg-surface-800/60 border border-surface-700/40 rounded-xl p-2.5 space-y-1.5">
                <span className="text-[9px] font-medium text-surface-500">Generated URL</span>
                <div className="flex items-center gap-1 bg-surface-800/80 rounded-lg px-2 py-1.5 border border-surface-700/30">
                  <span className="text-[9px] font-mono text-surface-100 truncate">{mockUrl}{currentEndpoint.path}</span>
                  <button onClick={() => navigator.clipboard.writeText(`${mockUrl}${currentEndpoint.path}`)}
                    className="p-0.5 text-surface-600 hover:text-brand-400 flex-shrink-0"><Copy size={8} /></button>
                </div>
              </div>

              <div className="bg-surface-800/60 border border-surface-700/40 rounded-xl p-2.5">
                <span className="text-[9px] font-medium text-surface-500 block mb-1">Response Preview</span>
                <pre className="text-[9px] font-mono text-surface-300 bg-surface-800/80 rounded-lg p-2 border border-surface-700/30 overflow-x-auto max-h-40 whitespace-pre-wrap">
                  {(() => {
                    try { return JSON.stringify(JSON.parse(currentEndpoint.response?.body || '{}'), null, 2) }
                    catch { return currentEndpoint.response?.body || '{}' }
                  })()}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-surface-800/40 border border-surface-700/40 rounded-lg p-2">
                  <p className="text-[8px] text-surface-500">Status</p>
                  <p className={cn('text-[10px] font-bold font-mono', currentEndpoint.response?.statusCode < 300 ? 'text-emerald-400' : currentEndpoint.response?.statusCode < 500 ? 'text-orange-400' : 'text-red-400')}>
                    {currentEndpoint.response?.statusCode || 200}
                  </p>
                </div>
                <div className="bg-surface-800/40 border border-surface-700/40 rounded-lg p-2">
                  <p className="text-[8px] text-surface-500">Delay</p>
                  <p className="text-[10px] font-bold font-mono text-surface-200">{currentEndpoint.response?.delay || 0}ms</p>
                </div>
                <div className="bg-surface-800/40 border border-surface-700/40 rounded-lg p-2">
                  <p className="text-[8px] text-surface-500">Type</p>
                  <p className="text-[9px] font-mono text-surface-300 truncate">{currentEndpoint.response?.contentType || 'application/json'}</p>
                </div>
                <div className="bg-surface-800/40 border border-surface-700/40 rounded-lg p-2">
                  <p className="text-[8px] text-surface-500">Body Size</p>
                  <p className="text-[10px] font-bold font-mono text-surface-200">{(currentEndpoint.response?.body?.length || 0)}B</p>
                </div>
              </div>

              {currentEndpoint.tags && currentEndpoint.tags.length > 0 && (
                <div>
                  <p className="text-[9px] font-medium text-surface-500 mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {currentEndpoint.tags.map((tag) => (
                      <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-surface-500">
              <Globe size={24} className="text-surface-700 mb-2" />
              <p className="text-sm font-medium text-surface-400">No Selection</p>
              <p className="text-[10px] text-surface-600 text-center">Select an endpoint to see its preview and details</p>
            </div>
          )}
        </div>
      </div>

      <NewEndpointModal
        open={showNewEndpoint}
        onClose={() => setShowNewEndpoint(false)}
        projectUuid={project.uuid}
        collectionUuid={selectedCollectionUuid || collections[0]?.uuid || ''}
      />
    </div>
  )
}
