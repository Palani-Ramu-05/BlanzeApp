import { useState, lazy, Suspense, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PanelLeftClose, PanelLeft, NotebookPen, FileText, FileCode, Plus,
  RotateCcw, CheckSquare, Trash2, X, AlertTriangle,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { createNote, fetchNotesFromSupabase, setPendingDeletionIds, undoPendingDeletions, confirmPendingDeletions, confirmPendingArchives } from '../store/notesSlice'
import { NotesSidebar } from '../components/NotesSidebar'
import { cn } from '@utils/index'
import { usePageTitle } from '@core/hooks/usePageTitle'
import toast from 'react-hot-toast'

const NoteEditor = lazy(() =>
  import('../components/NoteEditor').then(m => ({ default: m.NoteEditor })),
)

function EditorSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-8 animate-pulse">
      <div className="w-10 h-10 rounded-2xl bg-surface-800" />
      <div className="h-8 w-2/3 bg-surface-800 rounded-xl" />
      <div className="h-2.5 w-1/3 bg-surface-800 rounded" />
      <div className="mt-6 space-y-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-3 bg-surface-800 rounded" style={{ width: `${55 + (i * 7) % 45}%` }} />
        ))}
      </div>
    </div>
  )
}

export function NotesPage() {
  usePageTitle('Notes')
  const dispatch = useAppDispatch()
  const { activeNoteId, notes, isLoading, sidebarView, activeFolderId } = useAppSelector(s => s.notes)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<{ ids: string[]; isTrash: boolean } | null>(null)
  const undoRef = useRef<() => void>(() => {})

  useEffect(() => {
    dispatch(fetchNotesFromSupabase())
  }, [dispatch])

  const activeNote = notes.find(n => n.id === activeNoteId)

  const handleRefresh = useCallback(() => {
    dispatch(fetchNotesFromSupabase())
  }, [dispatch])

  const handleToggleBulkMode = useCallback(() => {
    setBulkMode(v => { if (v) setSelectedIds(new Set()); return !v })
  }, [])

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const visibleNoteIds = useMemo(() => {
    return new Set(notes.filter(n => {
      if (sidebarView === 'favorites') return n.isFavorite && !n.isArchived
      if (sidebarView === 'recent')    return !n.isArchived
      if (sidebarView === 'trash')     return n.isArchived
      if (activeFolderId)              return n.folderId === activeFolderId && !n.isArchived
      return !n.isArchived
    }).map(n => n.id))
  }, [notes, sidebarView, activeFolderId])

  const handleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.size > 0) return new Set()
      return new Set(visibleNoteIds)
    })
  }, [visibleNoteIds])

  const isTrashView = sidebarView === 'trash'

  const handleBulkDelete = useCallback(() => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    if (isTrashView) {
      setConfirmDelete({ ids, isTrash: true })
    } else {
      executeBulkDelete(ids, false)
    }
  }, [selectedIds, isTrashView])

  const executeBulkDelete = useCallback((ids: string[], isTrash: boolean) => {
    dispatch(setPendingDeletionIds(ids))
    setSelectedIds(new Set())
    setBulkMode(false)
    setConfirmDelete(null)

    const timer = setTimeout(() => {
      if (isTrash) {
        dispatch(confirmPendingDeletions())
      } else {
        dispatch(confirmPendingArchives())
      }
    }, 5000)

    undoRef.current = () => {
      clearTimeout(timer)
      dispatch(undoPendingDeletions())
    }

    if (isTrash) {
      toast(
        t => (
          <div className="flex items-center gap-3">
            <span className="text-sm">Deleted {ids.length} note{ids.length > 1 ? 's' : ''}</span>
            <button
              onClick={() => { undoRef.current(); toast.dismiss(t.id) }}
              className="text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors"
            >
              Undo
            </button>
          </div>
        ),
        { duration: 5000 },
      )
    } else {
      toast(
        t => (
          <div className="flex items-center gap-3">
            <span className="text-sm">Moved {ids.length} note{ids.length > 1 ? 's' : ''} to Trash</span>
            <button
              onClick={() => { undoRef.current(); toast.dismiss(t.id) }}
              className="text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors"
            >
              Undo
            </button>
          </div>
        ),
        { duration: 5000 },
      )
    }
  }, [dispatch])

  const handleEmptyTrash = useCallback(() => {
    const trashIds = notes.filter(n => n.isArchived).map(n => n.id)
    if (trashIds.length === 0) return
    setConfirmDelete({ ids: trashIds, isTrash: true })
  }, [notes])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!bulkMode) return
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        handleSelectAll()
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        handleBulkDelete()
      }
      if (e.key === 'Escape') {
        setBulkMode(false)
        setSelectedIds(new Set())
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [bulkMode, handleSelectAll, handleBulkDelete])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex -mx-6 -my-6 overflow-hidden border-t border-surface-700/60"
      style={{ height: 'calc(100vh - 57px)' }}
    >
      {/* ── Sidebar ───────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 268, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            className="flex-shrink-0 bg-surface-900 border-r border-surface-700/60 overflow-hidden flex flex-col"
          >
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <NotebookPen size={14} className="text-brand-400" />
                <span className="text-sm font-bold text-white">Notes</span>
                {isLoading && (
                  <div className="w-3 h-3 rounded-full border-2 border-brand-500/40 border-t-brand-500 animate-spin" />
                )}
              </div>
              <div className="flex items-center gap-1">
                {isTrashView && notes.some(n => n.isArchived) && (
                  <button
                    onClick={handleEmptyTrash}
                    className="flex items-center gap-1 text-[10px] font-semibold text-red-400 hover:text-red-300 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 px-2 py-1 rounded-lg transition-colors"
                    title="Empty trash"
                  >
                    <Trash2 size={10} /> Empty
                  </button>
                )}
                <button
                  onClick={handleToggleBulkMode}
                  className={cn('w-6 h-6 rounded-md transition-all flex items-center justify-center',
                    bulkMode
                      ? 'text-brand-400 bg-brand-600/20'
                      : 'text-surface-500 hover:text-white hover:bg-surface-700')}
                  title={bulkMode ? 'Exit bulk select' : 'Bulk select'}
                >
                  <CheckSquare size={12} />
                </button>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-6 h-6 rounded-md text-surface-500 hover:text-white hover:bg-surface-700 transition-all flex items-center justify-center"
                  title="Collapse sidebar"
                >
                  <PanelLeftClose size={13} />
                </button>
              </div>
            </div>

            {/* Sidebar body */}
            <div className="flex-1 overflow-hidden">
              <NotesSidebar
                bulkMode={bulkMode}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Editor area ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface-900">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-700/50 flex-shrink-0 bg-surface-900/80">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-7 h-7 rounded-lg text-surface-500 hover:text-white hover:bg-surface-700 transition-all flex items-center justify-center flex-shrink-0"
              title="Open sidebar"
            >
              <PanelLeft size={14} />
            </button>
          )}

          {bulkMode ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                onClick={handleSelectAll}
                className="text-[10px] font-semibold text-surface-500 hover:text-white transition-colors"
                title="Ctrl+A"
              >
                {selectedIds.size > 0 ? 'Deselect all' : 'Select all'}
              </button>
              <span className="text-[10px] text-surface-600">{selectedIds.size} selected</span>
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedIds.size === 0}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  title="Delete selected (Del)"
                >
                  <Trash2 size={11} /> {isTrashView ? 'Delete forever' : 'Move to Trash'} ({selectedIds.size})
                </button>
                <button
                  onClick={() => { setBulkMode(false); setSelectedIds(new Set()) }}
                  className="w-6 h-6 rounded-md text-surface-500 hover:text-white hover:bg-surface-700 transition-all flex items-center justify-center"
                  title="Cancel (Esc)"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ) : activeNote ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-base leading-none flex-shrink-0">{activeNote.icon}</span>
              <span className="text-sm font-semibold text-white truncate">{activeNote.title}</span>
              {/* Note type indicator */}
              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0',
                activeNote.noteType === 'code'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  : 'bg-brand-500/15 text-brand-400 border border-brand-500/20')}>
                {activeNote.noteType === 'code' ? 'RAW' : 'RICH'}
              </span>
              <button
                onClick={handleRefresh}
                className="ml-auto w-6 h-6 rounded-md text-surface-500 hover:text-white hover:bg-surface-700 transition-all flex items-center justify-center"
                title="Refresh notes from server"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm text-surface-500">No note selected</span>
              <button
                onClick={handleRefresh}
                className="ml-auto w-6 h-6 rounded-md text-surface-500 hover:text-white hover:bg-surface-700 transition-all flex items-center justify-center"
                title="Refresh notes from server"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Editor content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeNoteId && activeNote && !activeNote.isArchived ? (
              <motion.div
                key={activeNoteId}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.12 }}
                className="h-full"
              >
                <Suspense fallback={<EditorSkeleton />}>
                  <NoteEditor noteId={activeNoteId} />
                </Suspense>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full gap-5 text-center px-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface-800/60 border border-surface-700/60 flex items-center justify-center">
                  <NotebookPen size={28} className="text-surface-600" />
                </div>

                <div>
                  <p className="font-bold text-surface-300 mb-1 text-base">
                    {activeNoteId && activeNote?.isArchived
                      ? 'This note is in Trash'
                      : 'Select a note to start editing'}
                  </p>
                  <p className="text-sm text-surface-600">
                    {activeNoteId && activeNote?.isArchived
                      ? 'Restore it from the Trash view in the sidebar'
                      : 'Choose from the sidebar, or create a new note'}
                  </p>
                </div>

                {!activeNote?.isArchived && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => dispatch(createNote({ folderId: null, noteType: 'rich' }))}
                      className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 border border-brand-600/30 text-brand-400 transition-colors"
                    >
                      <Plus size={14} /> <FileText size={14} /> Rich Note
                    </button>
                    <button
                      onClick={() => dispatch(createNote({ folderId: null, noteType: 'code' }))}
                      className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-amber-600/10 hover:bg-amber-600/20 border border-amber-600/20 text-amber-400 transition-colors"
                    >
                      <Plus size={14} /> <FileCode size={14} /> Raw Note
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Confirmation Modal ──────────────────────────── */}
      <AnimatePresence>
        {confirmDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setConfirmDelete(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-surface-900 border border-surface-700/60 rounded-2xl p-5 w-full max-w-sm shadow-dropdown">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={18} className="text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-surface-50">
                      {confirmDelete.isTrash ? 'Permanently delete?' : 'Move to Trash?'}
                    </h2>
                    <p className="text-[11px] text-surface-500 mt-0.5">
                      {confirmDelete.ids.length} note{confirmDelete.ids.length > 1 ? 's' : ''} will be{' '}
                      {confirmDelete.isTrash ? 'permanently deleted' : 'moved to Trash'}.
                      {confirmDelete.isTrash ? ' This cannot be undone.' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-4">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-3 py-1.5 rounded-lg text-[11px] text-surface-400 hover:text-surface-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => executeBulkDelete(confirmDelete.ids, confirmDelete.isTrash)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-600/20 border border-red-600/30 text-red-400 hover:bg-red-600/30 transition-colors"
                  >
                    {confirmDelete.isTrash ? 'Delete forever' : 'Move to Trash'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
