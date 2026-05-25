import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Folder, FolderOpen, MoreHorizontal, Zap,
  Trash2, Copy, FolderInput, Pencil, Upload, Download, Search
} from 'lucide-react'
import { cn } from '@utils/index'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import {
  selectRequest, toggleFolder, deleteItem, renameItem,
  createRequest, createFolder, setSidebarTab, clearHistory,
  duplicateRequest, moveToFolder, reorderItems, importData,
  getAllFolders, findItem,
} from '../store/fetchlabSlice'
import type { FetchItem, FetchFolder } from '../dto/types/fetchlab.types'
import { Modal, Button, Input, Select } from '@components/index'
import toast from 'react-hot-toast'

// ─────────────────────────────────────────────────────────────
//  Method colour map
// ─────────────────────────────────────────────────────────────
const methodColors: Record<string, string> = {
  GET:     'text-green-400 bg-green-500/15',
  POST:    'text-amber-400 bg-amber-500/15',
  PUT:     'text-brand-400 bg-brand-500/15',
  DELETE:  'text-red-400   bg-red-500/15',
  PATCH:   'text-purple-400 bg-purple-500/15',
  HEAD:    'text-cyan-400  bg-cyan-500/15',
  OPTIONS: 'text-orange-400 bg-orange-500/15',
}

// ─────────────────────────────────────────────────────────────
//  Drag state (module-level refs – not React state, avoids re-renders)
// ─────────────────────────────────────────────────────────────
type DragPos = 'before' | 'into' | 'after'

// ─────────────────────────────────────────────────────────────
//  Context menu
// ─────────────────────────────────────────────────────────────
interface CtxMenuState {
  itemId: string
  itemType: 'request' | 'folder'
  x: number
  y: number
}

// ─────────────────────────────────────────────────────────────
//  Single tree node
// ─────────────────────────────────────────────────────────────
interface TreeNodeProps {
  item: FetchItem
  depth?: number
  onCtxMenu: (e: React.MouseEvent, id: string, type: 'request' | 'folder') => void
  dragState: React.MutableRefObject<{ id: string | null; overId: string | null; pos: DragPos | null }>
  onDrop: (dragId: string, targetId: string, pos: DragPos) => void
}

function TreeNode({ item, depth = 0, onCtxMenu, dragState, onDrop }: TreeNodeProps) {
  const dispatch = useAppDispatch()
  const { currentId } = useAppSelector((s) => s.fetchlab)
  const elRef = useRef<HTMLDivElement>(null)
  const [dropIndicator, setDropIndicator] = useState<DragPos | null>(null)

  const pl = 8 + depth * 12

  // ── drag events ──
  const handleDragStart = (e: React.DragEvent) => {
    dragState.current.id = item.id
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', item.id)
    if (elRef.current) elRef.current.style.opacity = '0.4'
  }

  const handleDragEnd = () => {
    if (elRef.current) elRef.current.style.opacity = '1'
    dragState.current = { id: null, overId: null, pos: null }
    setDropIndicator(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dragState.current.id === item.id) return
    e.dataTransfer.dropEffect = 'move'
    const rect = elRef.current?.getBoundingClientRect()
    if (!rect) return
    const y = e.clientY - rect.top
    const h = rect.height
    let pos: DragPos
    if (item.type === 'folder') {
      pos = y < h * 0.25 ? 'before' : y > h * 0.75 ? 'after' : 'into'
    } else {
      pos = y < h * 0.5 ? 'before' : 'after'
    }
    dragState.current.overId = item.id
    dragState.current.pos = pos
    setDropIndicator(pos)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!elRef.current?.contains(e.relatedTarget as Node)) {
      setDropIndicator(null)
      if (dragState.current.overId === item.id) dragState.current.overId = null
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const dId = dragState.current.id
    const pos = dragState.current.pos
    setDropIndicator(null)
    if (dId && dId !== item.id && pos) onDrop(dId, item.id, pos)
    dragState.current = { id: null, overId: null, pos: null }
  }

  if (item.type === 'folder') {
    return (
      <div ref={elRef} draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd}
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        className={cn(
          'relative transition-all',
          dropIndicator === 'before' && 'border-t-2 border-brand-500',
          dropIndicator === 'after'  && 'border-b-2 border-brand-500',
          dropIndicator === 'into'   && 'outline outline-1 outline-brand-500/50 rounded-lg bg-brand-500/5',
        )}
      >
        <div
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer group hover:bg-surface-800 transition-colors"
          style={{ paddingLeft: `${pl}px` }}
          onClick={() => dispatch(toggleFolder(item.id))}
          onContextMenu={(e) => { e.preventDefault(); onCtxMenu(e, item.id, 'folder') }}
        >
          <span className={cn('text-xs text-surface-500 flex-shrink-0 transition-transform duration-150 w-3 text-center', item.open && 'rotate-90')}>▶</span>
          {item.open
            ? <FolderOpen size={14} className="text-amber-400 flex-shrink-0" />
            : <Folder size={14} className="text-amber-400 flex-shrink-0" />
          }
          <span className="text-xs font-semibold text-slate-200 flex-1 truncate">{item.name}</span>
          {item.children.length > 0 && (
            <span className="text-[9px] text-surface-500 bg-surface-700 px-1.5 rounded-full">{item.children.length}</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onCtxMenu(e, item.id, 'folder') }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-surface-500 hover:text-white transition-all flex-shrink-0"
          >
            <MoreHorizontal size={12} />
          </button>
        </div>

        <AnimatePresence>
          {item.open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.12 }} className="overflow-hidden">
              {item.children.length === 0
                ? <p className="text-[10px] text-surface-600 py-1" style={{ paddingLeft: `${pl + 24}px` }}>Empty folder</p>
                : item.children.map((child) => (
                    <TreeNode key={child.id} item={child} depth={depth + 1}
                      onCtxMenu={onCtxMenu} dragState={dragState} onDrop={onDrop} />
                  ))
              }
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // request node
  return (
    <div ref={elRef} draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd}
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
      className={cn(
        'relative transition-all',
        dropIndicator === 'before' && 'border-t-2 border-brand-500',
        dropIndicator === 'after'  && 'border-b-2 border-brand-500',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer group border border-transparent hover:bg-surface-800 transition-colors',
          currentId === item.id && 'bg-brand-600/10 border-brand-600/20',
        )}
        style={{ paddingLeft: `${pl}px` }}
        onClick={() => dispatch(selectRequest(item.id))}
        onContextMenu={(e) => { e.preventDefault(); onCtxMenu(e, item.id, 'request') }}
      >
        <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded min-w-[36px] text-center flex-shrink-0', methodColors[item.method] || 'text-surface-400 bg-surface-700')}>
          {item.method}
        </span>
        <span className={cn('text-xs flex-1 truncate', currentId === item.id ? 'text-white' : 'text-slate-300', !item.url && 'text-surface-400')}>
          {item.name}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onCtxMenu(e, item.id, 'request') }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-surface-500 hover:text-white transition-all flex-shrink-0"
        >
          <MoreHorizontal size={12} />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Main sidebar
// ─────────────────────────────────────────────────────────────
export const FetchLabSidebar = () => {
  const dispatch = useAppDispatch()
  const { items, history, sidebarTab } = useAppSelector((s) => s.fetchlab)

  // drag state kept in a ref to avoid re-renders
  const dragState = useRef<{ id: string | null; overId: string | null; pos: DragPos | null }>({ id: null, overId: null, pos: null })

  // modals
  const [createReqOpen, setCreateReqOpen] = useState(false)
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [reqName, setReqName] = useState('New Request')
  const [folderName, setFolderName] = useState('My Collection')
  const [newName, setNewName] = useState('')
  const [activeCtx, setActiveCtx] = useState<CtxMenuState | null>(null)
  const [moveFolderId, setMoveFolderId] = useState('')
  const [searchVal, setSearchVal] = useState('')

  const importInputRef = useRef<HTMLInputElement>(null)

  // ── context menu ──
  const handleCtxMenu = useCallback((e: React.MouseEvent, id: string, type: 'request' | 'folder') => {
    e.preventDefault()
    const x = Math.min(e.clientX, window.innerWidth - 200)
    const y = Math.min(e.clientY, window.innerHeight - 220)
    setActiveCtx({ itemId: id, itemType: type, x, y })
  }, [])

  const closeCtx = () => setActiveCtx(null)

  // ── drag/drop ──
  const handleDrop = useCallback((dragId: string, targetId: string, pos: DragPos) => {
    dispatch(reorderItems({ dragId, targetId, pos }))
  }, [dispatch])

  // ── export ──
  const handleExport = () => {
    const payload = { version: 2, items, envVars: [] }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'fetchlab-export.json'
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success('Exported successfully')
  }

  // ── import ──
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string)
        if (raw.version === 2 && Array.isArray(raw.items)) {
          dispatch(importData({ items: raw.items, envVars: raw.envVars }))
          toast.success(`Imported ${raw.items.length} items`)
        } else if (Array.isArray(raw)) {
          dispatch(importData({ items: raw }))
          toast.success(`Imported ${raw.length} items`)
        } else {
          toast.error('Unrecognised format')
        }
      } catch {
        toast.error('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // ── filtered list for search ──
  const filteredItems = searchVal.trim()
    ? (() => {
        const q = searchVal.toLowerCase()
        const results: FetchItem[] = []
        const walk = (arr: FetchItem[]) => {
          arr.forEach((item) => {
            if (item.type === 'request' && (item.name.toLowerCase().includes(q) || item.url.toLowerCase().includes(q))) results.push(item)
            if (item.type === 'folder') walk(item.children)
          })
        }
        walk(items)
        return results
      })()
    : null

  const allFolders = getAllFolders(items)

  return (
    <>
      <aside className="w-[260px] flex-shrink-0 bg-surface-900 border-r border-surface-700/60 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                <Zap size={14} className="text-amber-400" />
              </div>
              <span className="text-sm font-black text-white">FetchLab</span>
            </div>
            {/* Import / Export */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleExport}
                className="flex items-center gap-1 text-[10px] text-surface-400 hover:text-white bg-surface-800 hover:bg-surface-700 border border-surface-700 px-2 py-1 rounded-lg transition-colors"
                title="Export collections"
              >
                <Upload size={10} /> Export
              </button>
              <button
                onClick={() => importInputRef.current?.click()}
                className="flex items-center gap-1 text-[10px] text-surface-400 hover:text-white bg-surface-800 hover:bg-surface-700 border border-surface-700 px-2 py-1 rounded-lg transition-colors"
                title="Import JSON"
              >
                <Download size={10} /> Import
              </button>
              <input ref={importInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search requests…"
              className="w-full bg-surface-800 border border-surface-700 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-surface-500 outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-surface-700/60 -mx-3 px-3">
            {(['collections', 'history'] as const).map((tab) => (
              <button key={tab} onClick={() => dispatch(setSidebarTab(tab))}
                className={cn('flex-1 py-1.5 text-xs font-semibold capitalize transition-all border-b-2',
                  sidebarTab === tab ? 'text-brand-400 border-brand-500' : 'text-surface-400 border-transparent hover:text-white'
                )}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Collections toolbar */}
        {sidebarTab === 'collections' && (
          <div className="flex gap-1.5 px-3 pb-2 flex-shrink-0">
            <Button size="xs" variant="ghost" fullWidth onClick={() => setCreateFolderOpen(true)} icon={<Folder size={12} />}>Folder</Button>
            <Button size="xs" fullWidth onClick={() => setCreateReqOpen(true)} icon={<Plus size={12} />}>Request</Button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-1 pb-4 no-scrollbar">
          {sidebarTab === 'collections' ? (
            filteredItems !== null ? (
              filteredItems.length === 0
                ? <p className="text-xs text-surface-500 text-center py-8">No results</p>
                : filteredItems.map((item) => (
                    <TreeNode key={item.id} item={item} onCtxMenu={handleCtxMenu} dragState={dragState} onDrop={handleDrop} />
                  ))
            ) : items.length === 0 ? (
              <div className="text-center py-8 px-3">
                <Zap size={24} className="text-surface-600 mx-auto mb-2" />
                <p className="text-xs text-surface-500 leading-relaxed">Create a folder or request to get started</p>
              </div>
            ) : (
              items.map((item) => (
                <TreeNode key={item.id} item={item} onCtxMenu={handleCtxMenu} dragState={dragState} onDrop={handleDrop} />
              ))
            )
          ) : (
            /* History tab */
            <div className="px-1 pt-1">
              {history.length === 0
                ? <p className="text-xs text-surface-500 text-center py-8">No history yet</p>
                : <>
                    {history.slice(0, 50).map((entry) => (
                      <div key={entry.id} className="flex items-center gap-2 p-2 rounded-lg mb-1 hover:bg-surface-800 cursor-pointer group">
                        <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded min-w-[32px] text-center flex-shrink-0', methodColors[entry.method] || 'text-surface-400 bg-surface-700')}>
                          {entry.method}
                        </span>
                        <span className="text-[10px] text-surface-400 flex-1 truncate">{entry.url}</span>
                        <span className={cn('text-[9px] font-bold flex-shrink-0', entry.status >= 200 && entry.status < 300 ? 'text-green-400' : 'text-red-400')}>
                          {entry.status || 'ERR'}
                        </span>
                      </div>
                    ))}
                    <button onClick={() => dispatch(clearHistory())}
                      className="w-full mt-2 py-1.5 text-[10px] text-surface-500 border border-dashed border-surface-700 rounded-lg hover:border-red-500/50 hover:text-red-400 transition-colors">
                      Clear History
                    </button>
                  </>
              }
            </div>
          )}
        </div>
      </aside>

      {/* ── Context Menu (floating) ── */}
      <AnimatePresence>
        {activeCtx && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeCtx} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="fixed z-50 bg-surface-900 border border-surface-700 rounded-xl shadow-elevated py-1.5 min-w-[180px]"
              style={{ left: activeCtx.x, top: activeCtx.y }}
            >
              {activeCtx.itemType === 'folder' ? (
                <>
                  <CtxItem icon={<Pencil size={13} />} label="Rename Folder" onClick={() => {
                    const item = findItem(activeCtx.itemId, items)
                    setNewName(item?.name || '')
                    setRenameOpen(true); closeCtx()
                  }} />
                  <CtxItem icon={<Plus size={13} />} label="Add Request" onClick={() => {
                    dispatch(createRequest({ parentId: activeCtx.itemId, name: 'New Request' })); closeCtx()
                  }} />
                  <div className="h-px bg-surface-700 my-1" />
                  <CtxItem icon={<Trash2 size={13} />} label="Delete Folder" danger onClick={() => {
                    dispatch(deleteItem(activeCtx.itemId)); closeCtx()
                  }} />
                </>
              ) : (
                <>
                  <CtxItem icon={<Pencil size={13} />} label="Rename" onClick={() => {
                    const item = findItem(activeCtx.itemId, items)
                    setNewName(item?.name || '')
                    setRenameOpen(true); closeCtx()
                  }} />
                  <CtxItem icon={<Copy size={13} />} label="Duplicate" onClick={() => {
                    dispatch(duplicateRequest(activeCtx.itemId)); closeCtx()
                    toast.success('Duplicated')
                  }} />
                  <div className="h-px bg-surface-700 my-1" />
                  <CtxItem icon={<FolderInput size={13} />} label="Move to Folder…" onClick={() => {
                    setMoveFolderId('')
                    setMoveOpen(true); closeCtx()
                  }} />
                  <div className="h-px bg-surface-700 my-1" />
                  <CtxItem icon={<Trash2 size={13} />} label="Delete" danger onClick={() => {
                    dispatch(deleteItem(activeCtx.itemId)); closeCtx()
                  }} />
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Rename modal ── */}
      <Modal open={renameOpen} onClose={() => setRenameOpen(false)} title="Rename" size="sm"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setRenameOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={() => {
            if (activeCtx) dispatch(renameItem({ id: activeCtx.itemId, name: newName }))
            setRenameOpen(false)
          }}>Rename</Button>
        </>}>
        <Input value={newName} onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && activeCtx) { dispatch(renameItem({ id: activeCtx.itemId, name: newName })); setRenameOpen(false) }}} autoFocus />
      </Modal>

      {/* ── Move to folder modal ── */}
      <Modal open={moveOpen} onClose={() => setMoveOpen(false)} title="Move to Folder" size="sm"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setMoveOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={() => {
            if (activeCtx) dispatch(moveToFolder({ id: activeCtx.itemId, targetFolderId: moveFolderId || null }))
            setMoveOpen(false)
            toast.success('Moved')
          }}>Move</Button>
        </>}>
        <Select
          label="Destination"
          value={moveFolderId}
          onChange={(e) => setMoveFolderId(e.target.value)}
          options={[
            { value: '', label: '— Root level —' },
            ...allFolders.filter((f) => f.id !== activeCtx?.itemId).map((f) => ({ value: f.id, label: f.name })),
          ]}
        />
      </Modal>

      {/* ── Create Request modal ── */}
      <Modal open={createReqOpen} onClose={() => setCreateReqOpen(false)} title="New Request" size="sm"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setCreateReqOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={() => { dispatch(createRequest({ parentId: null, name: reqName })); setCreateReqOpen(false); setReqName('New Request') }}>Create</Button>
        </>}>
        <Input label="Request Name" value={reqName} onChange={(e) => setReqName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { dispatch(createRequest({ parentId: null, name: reqName })); setCreateReqOpen(false) }}} autoFocus />
      </Modal>

      {/* ── Create Folder modal ── */}
      <Modal open={createFolderOpen} onClose={() => setCreateFolderOpen(false)} title="New Folder" size="sm"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setCreateFolderOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={() => { dispatch(createFolder(folderName)); setCreateFolderOpen(false); setFolderName('My Collection') }}>Create</Button>
        </>}>
        <Input label="Folder Name" value={folderName} onChange={(e) => setFolderName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { dispatch(createFolder(folderName)); setCreateFolderOpen(false) }}} autoFocus />
      </Modal>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
//  Context menu item
// ─────────────────────────────────────────────────────────────
function CtxItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={cn('w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors',
        danger ? 'text-surface-400 hover:bg-red-500/10 hover:text-red-400' : 'text-surface-300 hover:bg-surface-800 hover:text-white'
      )}>
      <span className="flex-shrink-0">{icon}</span>
      {label}
    </button>
  )
}
