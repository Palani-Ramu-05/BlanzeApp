import { useState, lazy, Suspense, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PanelLeftClose, PanelLeft, NotebookPen, FileText, FileCode, Plus } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { createNote, fetchNotesFromSupabase } from '../store/notesSlice'
import { NotesSidebar } from '../components/NotesSidebar'
import { cn } from '@utils/index'
import { usePageTitle } from '@core/hooks/usePageTitle'

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
  const { activeNoteId, notes, isLoading } = useAppSelector(s => s.notes)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    dispatch(fetchNotesFromSupabase())
  }, [dispatch])

  const activeNote = notes.find(n => n.id === activeNoteId)

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
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-6 h-6 rounded-md text-surface-500 hover:text-white hover:bg-surface-700 transition-all flex items-center justify-center"
                title="Collapse sidebar"
              >
                <PanelLeftClose size={13} />
              </button>
            </div>

            {/* Sidebar body */}
            <div className="flex-1 overflow-hidden">
              <NotesSidebar />
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

          {activeNote ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base leading-none flex-shrink-0">{activeNote.icon}</span>
              <span className="text-sm font-semibold text-white truncate">{activeNote.title}</span>
              {/* Note type indicator */}
              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0',
                activeNote.noteType === 'code'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  : 'bg-brand-500/15 text-brand-400 border border-brand-500/20')}>
                {activeNote.noteType === 'code' ? 'RAW' : 'RICH'}
              </span>
            </div>
          ) : (
            <span className="text-sm text-surface-500">No note selected</span>
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
    </motion.div>
  )
}
