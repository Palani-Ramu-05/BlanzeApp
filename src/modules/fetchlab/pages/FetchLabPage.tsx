import { useEffect, useRef, useState, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import {
  loadFetchLabFromSupabase, setActiveMainTab, sendRequest,
  saveCurrentRequest, closeTab, switchTab, findItem,
} from '../store/fetchlabSlice'
import { FetchLabSidebar }   from '../components/FetchLabSidebar'
import { FetchLabRequestBar } from '../components/FetchLabRequestBar'
import { KVTable }            from '../components/KVTable'
import { AuthPanel }          from '../components/AuthPanel'
import { BodyPanel }          from '../components/BodyPanel'
import { ResponsePanel }      from '../components/ResponsePanel'
import { FetchLabEnvModal }   from '../components/FetchLabEnvModal'
import { CodeSnippetDrawer }  from '../components/CodeSnippetDrawer'
import { Tabs } from '@components/index'
import { usePageTitle } from '@core/hooks/usePageTitle'
import { Zap, GripHorizontal, X, Settings, Code2, Save } from 'lucide-react'
import { cn } from '@utils/index'
import type { FetchRequest } from '../dto/types/fetchlab.types'

const mainTabs = [
  { id: 'query',   label: 'Params' },
  { id: 'headers', label: 'Headers' },
  { id: 'auth',    label: 'Authorization' },
  { id: 'body',    label: 'Body' },
]

const MIN_PANEL_H = 80
const MAX_PANEL_H = 750
const DEFAULT_PANEL_H = 280

const methodColors: Record<string, string> = {
  GET:     'text-green-400',
  POST:    'text-amber-400',
  PUT:     'text-brand-400',
  DELETE:  'text-red-400',
  PATCH:   'text-purple-400',
  HEAD:    'text-cyan-400',
  OPTIONS: 'text-orange-400',
}

const methodDot: Record<string, string> = {
  GET:     'bg-green-400',
  POST:    'bg-amber-400',
  PUT:     'bg-brand-400',
  DELETE:  'bg-red-400',
  PATCH:   'bg-purple-400',
  HEAD:    'bg-cyan-400',
  OPTIONS: 'bg-orange-400',
}

export const FetchLabPage = () => {
  usePageTitle('FetchLab')
  const dispatch = useAppDispatch()
  const {
    currentRequest, activeMainTab,
    openTabIds, activeTabId, items, tabRequests,
  } = useAppSelector((s) => s.fetchlab)

  const [envOpen, setEnvOpen]       = useState(false)
  const [snippetOpen, setSnippetOpen] = useState(false)

  useEffect(() => {
    dispatch(loadFetchLabFromSupabase())
  }, [dispatch])

  // ── Resizable panel ──
  const [panelH, setPanelH] = useState(DEFAULT_PANEL_H)
  const draggingRef  = useRef(false)
  const startYRef    = useRef(0)
  const startHRef    = useRef(DEFAULT_PANEL_H)

  const onResizerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    draggingRef.current = true
    startYRef.current = e.clientY
    startHRef.current = panelH
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return
      setPanelH(Math.max(MIN_PANEL_H, Math.min(MAX_PANEL_H, startHRef.current + ev.clientY - startYRef.current)))
    }
    const onMouseUp = () => {
      draggingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [panelH])

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); dispatch(sendRequest()) }
      if ((e.ctrlKey || e.metaKey) && e.key === 's')     { e.preventDefault(); dispatch(saveCurrentRequest()) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [dispatch])

  return (
    <div className="flex h-full overflow-hidden gap-2 p-2">
      <FetchLabSidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-surface-900/60 border border-surface-700/50 rounded-2xl">

        {/* ── Tab bar + action icons ─────────────────── */}
        <div className="flex items-stretch bg-surface-800/40 border-b border-surface-700/40 flex-shrink-0 min-h-[36px] rounded-t-2xl">
          {/* Scrollable tabs */}
          <div className="flex overflow-x-auto no-scrollbar flex-1 min-w-0">
            {openTabIds.length === 0 ? (
              <div className="flex items-center px-4">
                <span className="text-[10px] text-surface-600 italic">No open tabs — select a request</span>
              </div>
            ) : (
              openTabIds.map((tabId) => {
                const tabReq = (tabRequests[tabId] || findItem(tabId, items)) as FetchRequest | null
                if (!tabReq || tabReq.type !== 'request') return null
                const isActive = activeTabId === tabId
                return (
                  <div
                    key={tabId}
                    onClick={() => dispatch(switchTab(tabId))}
                    className={cn(
                      'group relative flex items-center gap-1.5 pl-3 pr-2 cursor-pointer flex-shrink-0 max-w-[200px]',
                      'border-r border-surface-700/40 transition-colors select-none',
                      isActive
                        ? 'bg-surface-900/60 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-brand-500'
                        : 'hover:bg-surface-800/40',
                    )}
                  >
                    <span className={cn('text-[9px] font-black flex-shrink-0', methodColors[tabReq.method] || 'text-surface-400')}>
                      {tabReq.method}
                    </span>
                    <span className={cn('text-[11px] truncate', isActive ? 'text-white font-medium' : 'text-surface-400')}>
                      {tabReq.name}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); dispatch(closeTab(tabId)) }}
                      className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center text-surface-600 hover:text-white hover:bg-surface-700 transition-all opacity-0 group-hover:opacity-100 ml-0.5"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Icon-only action buttons — hover shows tooltip */}
          <div className="flex items-center border-l border-surface-700/40 flex-shrink-0">
            <button
              onClick={() => setEnvOpen(true)}
              title="Environment Variables"
              className="group relative flex items-center justify-center w-9 h-full text-surface-500 hover:text-white hover:bg-surface-800/40 transition-colors"
            >
              <Settings size={13} />
              <span className="pointer-events-none absolute top-full mt-1.5 right-0 text-[10px] bg-surface-800 border border-surface-700 text-surface-200 px-2 py-0.5 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                Environment
              </span>
            </button>
            <button
              onClick={() => setSnippetOpen(true)}
              disabled={!currentRequest}
              title="Code Snippet / Generate Types"
              className="group relative flex items-center justify-center w-9 h-full text-surface-500 hover:text-white hover:bg-surface-800/40 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <Code2 size={13} />
              <span className="pointer-events-none absolute top-full mt-1.5 right-0 text-[10px] bg-surface-800 border border-surface-700 text-surface-200 px-2 py-0.5 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                Code Snippet
              </span>
            </button>
            <button
              onClick={() => dispatch(saveCurrentRequest())}
              disabled={!currentRequest}
              title="Save (Ctrl+S)"
              className="group relative flex items-center justify-center w-9 h-full text-surface-500 hover:text-brand-400 hover:bg-brand-600/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <Save size={13} />
              <span className="pointer-events-none absolute top-full mt-1.5 right-0 text-[10px] bg-surface-800 border border-surface-700 text-surface-200 px-2 py-0.5 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                Save (Ctrl+S)
              </span>
            </button>
          </div>
        </div>

        {/* ── URL bar ── */}
        <div className="border-b border-surface-700/40 flex-shrink-0">
          <FetchLabRequestBar />
        </div>

        {/* ── Request section tabs ── */}
        <div className="flex-shrink-0 border-b border-surface-700/40">
          <Tabs
            tabs={mainTabs}
            activeTab={activeMainTab}
            onChange={(id) => dispatch(setActiveMainTab(id))}
            className="border-none px-1"
          />
        </div>

        {/* ── Request panel (resizable) ── */}
        <div style={{ height: panelH }} className="overflow-y-auto flex-shrink-0 border-b border-surface-700/40">
          {!currentRequest ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Zap size={22} className="text-amber-400" />
              </div>
              <p className="text-sm font-medium text-surface-400">Select or create a request to get started</p>
              <p className="text-xs text-surface-600">Use the sidebar to browse your collections</p>
            </div>
          ) : (
            <>
              {activeMainTab === 'query'   && <KVTable target="params" />}
              {activeMainTab === 'headers' && <KVTable target="headers" />}
              {activeMainTab === 'auth'    && <AuthPanel />}
              {activeMainTab === 'body'    && <BodyPanel />}
            </>
          )}
        </div>

        {/* ── Resize handle ── */}
        <div
          onMouseDown={onResizerMouseDown}
          className="flex-shrink-0 flex items-center justify-center h-2 cursor-row-resize bg-surface-800/40 hover:bg-brand-600/20 transition-colors group z-10 border-b border-surface-700/30"
          title="Drag to resize response panel"
        >
          <GripHorizontal size={14} className="text-surface-700 group-hover:text-brand-400 transition-colors" />
        </div>

        {/* ── Response panel ── */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <ResponsePanel />
        </div>
      </div>

      {/* Modals & Drawers */}
      <FetchLabEnvModal open={envOpen} onClose={() => setEnvOpen(false)} />
      <CodeSnippetDrawer open={snippetOpen} onClose={() => setSnippetOpen(false)} />
    </div>
  )
}
