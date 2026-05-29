import { useState, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PanelLeftClose, PanelLeft, NotebookPen, FileText } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { createNote, fetchNotesFromSupabase } from '../store/notesSlice'
import { NotesSidebar } from '../components/NotesSidebar'
import { cn } from '@utils/index'
import { useEffect } from 'react'

const NoteEditor = lazy(() => import('../components/NoteEditor').then(m => ({ default: m.NoteEditor })))

function EditorSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-8 animate-pulse">
      <div className="w-12 h-12 rounded-2xl bg-surface-800" />
      <div className="h-10 w-3/4 bg-surface-800 rounded-xl" />
      <div className="h-3 w-1/4 bg-surface-800 rounded" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-3 bg-surface-800 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
        ))}
      </div>
    </div>
  )
}

export function NotesPage() {
  const dispatch = useAppDispatch()
  const { activeNoteId, notes } = useAppSelector(s => s.notes)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    dispatch(fetchNotesFromSupabase())
  }, [dispatch])

  const activeNote = notes.find(n => n.id === activeNoteId)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex -mx-6 -my-6 overflow-hidden border-t border-surface-700/60"
      style={{
        height: 'calc(100vh - var(--header-height))',
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="flex-shrink-0 bg-surface-900 border-r border-surface-700/60 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/50">
              <div className="flex items-center gap-2">
                <NotebookPen size={15} className="text-brand-400" />
                <span className="text-sm font-bold" style={{ color: 'rgb(var(--color-text-primary))' }}>Notes</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}
                className="w-6 h-6 rounded-md text-surface-500 hover:text-white hover:bg-surface-700 transition-all flex items-center justify-center">
                <PanelLeftClose size={13} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <NotesSidebar />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor area */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface-900">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-700/50 flex-shrink-0">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)}
              className="w-7 h-7 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-all flex items-center justify-center">
              <PanelLeft size={14} />
            </button>
          )}
          {activeNote && (
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">{activeNote.icon}</span>
              <span className="text-sm font-semibold truncate" style={{ color: 'rgb(var(--color-text-primary))' }}>
                {activeNote.title}
              </span>
            </div>
          )}
        </div>

        {/* Editor content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeNoteId ? (
              <motion.div
                key={activeNoteId}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
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
                className="flex flex-col items-center justify-center h-full gap-4 text-center"
              >
                <div className="w-20 h-20 rounded-3xl bg-surface-800/60 border border-surface-700 flex items-center justify-center">
                  <FileText size={36} className="text-surface-500" />
                </div>
                <div>
                  <p className="font-bold text-surface-300 mb-1">Select a note to edit</p>
                  <p className="text-sm text-surface-500">Or create a new one to get started</p>
                </div>
                <button
                  onClick={() => dispatch(createNote({ folderId: null }))}
                  className="btn-primary text-sm"
                >
                  Create New Note
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
