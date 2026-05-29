import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Star, Pin, ChevronRight, Trash2, Folder, FileText, Clock, Heart } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import {
  createNote, createFolder, deleteNote, deleteFolder,
  setActiveNote, setActiveFolder, setSearchQuery, setSidebarView,
  toggleFavorite, togglePin,
} from '../store/notesSlice'
import { FOLDER_COLORS, NOTE_ICONS } from '../dto/types/notes.types'
import { cn } from '@utils/index'
import { format } from 'date-fns'

export function NotesSidebar() {
  const dispatch = useAppDispatch()
  const { folders, notes, activeNoteId, activeFolderId, searchQuery, sidebarView } = useAppSelector(s => s.notes)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0])

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filteredNotes = notes.filter(n => {
    if (sidebarView === 'favorites') return n.isFavorite && !n.isArchived
    if (sidebarView === 'recent') return !n.isArchived
    if (sidebarView === 'trash') return n.isArchived
    if (activeFolderId) return n.folderId === activeFolderId && !n.isArchived
    return !n.isArchived
  }).filter(n =>
    !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.contentText.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const handleCreateNote = () => {
    dispatch(createNote({ folderId: activeFolderId }))
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return
    dispatch(createFolder({ name: newFolderName, color: newFolderColor, icon: '📁' }))
    setNewFolderName(''); setShowNewFolder(false)
  }

  const SIDEBAR_VIEWS = [
    { id: 'all' as const, label: 'All Notes', icon: <FileText size={14} /> },
    { id: 'favorites' as const, label: 'Favorites', icon: <Heart size={14} /> },
    { id: 'recent' as const, label: 'Recent', icon: <Clock size={14} /> },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="p-3 flex-shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            value={searchQuery}
            onChange={e => dispatch(setSearchQuery(e.target.value))}
            placeholder="Search notes..."
            className="input-base pl-8 py-2 text-xs"
          />
        </div>
      </div>

      {/* Views */}
      <div className="px-2 flex-shrink-0">
        {SIDEBAR_VIEWS.map(v => (
          <button key={v.id}
            onClick={() => { dispatch(setSidebarView(v.id)); dispatch(setActiveFolder(null)) }}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left',
              sidebarView === v.id && !activeFolderId ? 'bg-brand-600/15 text-brand-400 border border-brand-600/20' : 'text-surface-400 hover:text-white hover:bg-surface-800'
            )}>
            <span style={{ color: sidebarView === v.id && !activeFolderId ? '#60a5fa' : undefined }}>{v.icon}</span>
            {v.label}
            <span className="ml-auto text-[10px] text-surface-600">
              {v.id === 'all' ? notes.filter(n => !n.isArchived).length :
                v.id === 'favorites' ? notes.filter(n => n.isFavorite).length :
                  notes.filter(n => !n.isArchived).length}
            </span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-surface-700/50 mx-3 my-2 flex-shrink-0" />

      {/* Folders */}
      <div className="flex-shrink-0 px-2">
        <div className="flex items-center justify-between px-2 mb-1">
          <span className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">Folders</span>
          <button onClick={() => setShowNewFolder(v => !v)}
            className="w-5 h-5 rounded text-surface-500 hover:text-white hover:bg-surface-700 transition-all flex items-center justify-center">
            <Plus size={12} />
          </button>
        </div>

        <AnimatePresence>
          {showNewFolder && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
              <div className="flex gap-1.5 p-2 bg-surface-800/60 border border-surface-700 rounded-xl">
                <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                  placeholder="Folder name..." className="flex-1 bg-transparent text-xs outline-none" style={{ color: 'rgb(var(--color-text-primary))' }} />
                <div className="flex gap-1">
                  {FOLDER_COLORS.slice(0, 5).map(c => (
                    <button key={c} onClick={() => setNewFolderColor(c)}
                      className={cn('w-4 h-4 rounded-full transition-all', newFolderColor === c && 'ring-2 ring-white ring-offset-1 ring-offset-surface-800')}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <button onClick={handleCreateFolder} className="text-brand-400 hover:text-brand-300 transition-all text-xs">✓</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-0.5">
          {folders.filter(f => !f.parentId).map(folder => {
            const folderNotes = notes.filter(n => n.folderId === folder.id && !n.isArchived)
            const isActive = activeFolderId === folder.id
            const isExpanded = expandedFolders.has(folder.id)
            return (
              <div key={folder.id}>
                <div
                  onClick={() => { dispatch(setActiveFolder(folder.id)); dispatch(setSidebarView('all')) }}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all group',
                    isActive ? 'bg-brand-600/10 border border-brand-500/20' : 'hover:bg-surface-800'
                  )}>
                  <button onClick={e => { e.stopPropagation(); toggleFolder(folder.id) }}
                    className="text-surface-500 hover:text-white transition-all">
                    <ChevronRight size={12} className={cn('transition-transform', isExpanded && 'rotate-90')} />
                  </button>
                  <span className="text-xs">{folder.icon}</span>
                  <span className="flex-1 truncate" style={{ color: isActive ? folder.color : 'rgb(var(--color-text-secondary))' }}>{folder.name}</span>
                  <span className="text-[10px] text-surface-600">{folderNotes.length}</span>
                  <button onClick={e => { e.stopPropagation(); dispatch(deleteFolder(folder.id)) }}
                    className="opacity-0 group-hover:opacity-100 text-surface-500 hover:text-red-400 transition-all">
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-surface-700/50 mx-3 my-2 flex-shrink-0" />

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-2">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <span className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">
            Notes {filteredNotes.length > 0 && `(${filteredNotes.length})`}
          </span>
          <button onClick={handleCreateNote}
            className="w-5 h-5 rounded text-surface-500 hover:text-white hover:bg-surface-700 transition-all flex items-center justify-center">
            <Plus size={12} />
          </button>
        </div>

        <div className="space-y-0.5">
          <AnimatePresence initial={false}>
            {filteredNotes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-surface-500">No notes yet</p>
                <button onClick={handleCreateNote} className="text-xs text-brand-400 hover:text-brand-300 mt-2 transition-all">
                  Create first note
                </button>
              </div>
            ) : (
              filteredNotes.map(note => (
                <motion.div key={note.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => dispatch(setActiveNote(note.id))}
                  className={cn(
                    'group flex items-start gap-2 px-2 py-2.5 rounded-xl cursor-pointer transition-all',
                    activeNoteId === note.id ? 'bg-brand-600/10 border border-brand-500/20' : 'hover:bg-surface-800'
                  )}>
                  <span className="text-sm flex-shrink-0 mt-0.5">{note.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      {note.isPinned && <Pin size={9} className="text-brand-400 flex-shrink-0" />}
                      {note.isFavorite && <Star size={9} className="text-amber-400 flex-shrink-0 fill-current" />}
                      <span className="text-xs font-semibold truncate" style={{ color: activeNoteId === note.id ? '#93c5fd' : 'rgb(var(--color-text-primary))' }}>
                        {note.title}
                      </span>
                    </div>
                    <p className="text-[10px] text-surface-500 truncate mt-0.5">{note.contentText || 'No content'}</p>
                    <p className="text-[10px] text-surface-600 mt-0.5">{format(new Date(note.updatedAt), 'MMM d')}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); dispatch(toggleFavorite(note.id)) }}
                      className="w-5 h-5 rounded flex items-center justify-center text-surface-500 hover:text-amber-400 transition-colors">
                      <Star size={10} className={note.isFavorite ? 'fill-current text-amber-400' : ''} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); dispatch(deleteNote(note.id)) }}
                      className="w-5 h-5 rounded flex items-center justify-center text-surface-500 hover:text-red-400 transition-colors">
                      <Trash2 size={10} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* New note button */}
      <div className="p-3 flex-shrink-0 border-t border-surface-700/50">
        <button onClick={handleCreateNote} className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-2">
          <Plus size={14} /> New Note
        </button>
      </div>
    </div>
  )
}
