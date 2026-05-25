import { useEffect, useRef, useState, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import {
  setActiveMainTab, sendRequest, saveCurrentRequest, updateCurrentRequest,
} from '../store/fetchlabSlice'
import { FetchLabSidebar } from '../components/FetchLabSidebar'
import { FetchLabRequestBar } from '../components/FetchLabRequestBar'
import { KVTable } from '../components/KVTable'
import { AuthPanel } from '../components/AuthPanel'
import { BodyPanel } from '../components/BodyPanel'
import { ResponsePanel } from '../components/ResponsePanel'
import { Tabs, Textarea } from '@components/index'
import { usePageTitle } from '@core/hooks/usePageTitle'
import { Zap, GripHorizontal } from 'lucide-react'
import { cn } from '@utils/index'

const mainTabs = [
  { id: 'query',   label: 'Query' },
  { id: 'headers', label: 'Headers' },
  { id: 'auth',    label: 'Auth' },
  { id: 'body',    label: 'Body' },
  { id: 'tests',   label: 'Tests' },
  { id: 'prerun',  label: 'Pre Run' },
]

const MIN_PANEL_H = 60
const MAX_PANEL_H = 600
const DEFAULT_PANEL_H = 240

export const FetchLabPage = () => {
  usePageTitle('FetchLab')
  const dispatch = useAppDispatch()
  const { currentRequest, activeMainTab } = useAppSelector((s) => s.fetchlab)

  // ── Resizable panel height ──
  const [panelH, setPanelH] = useState(DEFAULT_PANEL_H)
  const resizerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const startYRef = useRef(0)
  const startHRef = useRef(DEFAULT_PANEL_H)

  const onResizerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    draggingRef.current = true
    startYRef.current = e.clientY
    startHRef.current = panelH
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return
      const dy = ev.clientY - startYRef.current
      const newH = Math.max(MIN_PANEL_H, Math.min(MAX_PANEL_H, startHRef.current + dy))
      setPanelH(newH)
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
    <div className="flex h-full overflow-hidden">
      <FetchLabSidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Request bar */}
        <FetchLabRequestBar />

        {/* Main tabs */}
        <div className="flex-shrink-0 border-b border-surface-700/60">
          <Tabs tabs={mainTabs} activeTab={activeMainTab} onChange={(id) => dispatch(setActiveMainTab(id))} className="border-none px-1" />
        </div>

        {/* Request panel – resizable height */}
        <div style={{ height: panelH }} className="overflow-y-auto flex-shrink-0 border-b border-surface-700/60">
          {!currentRequest ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Zap size={22} className="text-amber-400" />
              </div>
              <p className="text-xs text-surface-500">Select or create a request to get started</p>
            </div>
          ) : (
            <>
              {activeMainTab === 'query'   && <KVTable target="params"  addLabel="Add Param" />}
              {activeMainTab === 'headers' && <KVTable target="headers" addLabel="Add Header" />}
              {activeMainTab === 'auth'    && <AuthPanel />}
              {activeMainTab === 'body'    && <BodyPanel />}
              {activeMainTab === 'tests'   && (
                <div className="p-3">
                  <Textarea label="Post-request tests (JavaScript)"
                    value={currentRequest?.testsScript || ''}
                    onChange={(e) => dispatch(updateCurrentRequest({ testsScript: e.target.value }))}
                    placeholder="// pm.test('Status 200', () => pm.response.to.have.status(200));"
                    mono className="min-h-28 max-h-40" />
                </div>
              )}
              {activeMainTab === 'prerun' && (
                <div className="p-3">
                  <Textarea label="Pre-request script (JavaScript)"
                    value={currentRequest?.prerunScript || ''}
                    onChange={(e) => dispatch(updateCurrentRequest({ prerunScript: e.target.value }))}
                    placeholder="// pm.environment.set('token', 'abc123');"
                    mono className="min-h-28 max-h-40" />
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Drag handle (resizer) ── */}
        <div
          ref={resizerRef}
          onMouseDown={onResizerMouseDown}
          className={cn(
            'flex-shrink-0 flex items-center justify-center h-[6px] cursor-row-resize',
            'bg-surface-800 hover:bg-brand-600/30 transition-colors group relative z-10',
          )}
          title="Drag to resize"
        >
          <GripHorizontal size={14} className="text-surface-600 group-hover:text-brand-400 transition-colors" />
        </div>

        {/* Response panel – fills remaining space */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <ResponsePanel />
        </div>
      </div>
    </div>
  )
}
