import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Star, Pin, ChevronRight, Trash2,
  FileText, Clock, Heart, RotateCcw, FileCode, ChevronDown,
  SlidersHorizontal, X, Check,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import {
  createNote, createFolder, deleteNote, deleteFolder, restoreNote,
  setActiveNote, setActiveFolder, setSearchQuery, setSidebarView, setSortBy,
  toggleFavorite, togglePin, archiveNote,
} from '../store/notesSlice'
import { FOLDER_COLORS } from '../dto/types/notes.types'
import { cn } from '@utils/index'
import { formatDistanceToNow } from 'date-fns'

const METHOD_BADGE: Record<string, string> = {
  rich: 'text-brand-400 bg-brand-500/15',
  code: 'text-amber-400 bg-amber-500/15',
}

interface NotesSidebarProps {
  bulkMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
  onSelectAll?: () => void
}

export function NotesSidebar({ bulkMode = false, selectedIds = new Set(), onToggleSelect, onSelectAll }: NotesSidebarProps) {
  const dispatch = useAppDispatch()
  const { folders, notes, activeNoteId, activeFolderId, searchQuery, sidebarView, sortBy } = useAppSelector(s => s.notes)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0])
  const [showSort, setShowSort] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filteredNotes = notes.filter(n => {
    if (sidebarView === 'favorites') return n.isFavorite && !n.isArchived
    if (sidebarView === 'recent')    return !n.isArchived
    if (sidebarView === 'trash')     return n.isArchived
    if (activeFolderId)              return n.folderId === activeFolderId && !n.isArchived
    return !n.isArchived
  }).filter(n =>
    !searchQuery ||
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.contentText.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.tags.some(t => t.includes(searchQuery.toLowerCase()))
  ).sort((a, b) => {
    if (sidebarView !== 'trash') {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    }
    switch (sortBy) {
      case 'created': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'title':   return a.title.localeCompare(b.title)
      case 'words':   return b.wordCount - a.wordCount
      default:        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
  })

  const handleCreateNote = (type: 'rich' | 'code' = 'rich') => {
    dispatch(createNote({ folderId: activeFolderId, noteType: type }))
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return
    dispatch(createFolder({ name: newFolderName, color: newFolderColor, icon: 'ðŸ“' }))
    setNewFolderName(''); setShowNewFolder(false)
  }

  const handlePermanentDelete = (id: string) => {
    if (deleteConfirm === id) {
      dispatch(deleteNote(id))
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  const SIDEBAR_VIEWS = [
    { id: 'all' as const,       label: 'All Notes',  icon: <FileText size={13} />,  count: notes.filter(n => !n.isArchived).length },
    { id: 'favorites' as const, label: 'Favorites',  icon: <Heart size={13} />,     count: notes.filter(n => n.isFavorite && !n.isArchived).length },
    { id: 'recent' as const,    label: 'Recent',     icon: <Clock size={13} />,     count: notes.filter(n => !n.isArchived).length },
    { id: 'trash' as const,     label: 'Trash',      icon: <Trash2 size={13} />,    count: notes.filter(n => n.isArchived).length },
  ]

  const SORT_OPTIONS = [
    { id: 'updated' as const, label: 'Last modified' },
    { id: 'created' as const, label: 'Date created' },
    { id: 'title' as const,   label: 'Title A–Z' },
    { id: 'words' as const,   label: 'Word count' },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={e => dispatch(setSearchQuery(e.target.value))}
            placeholder="Search notes, tags…"
            className="w-full bg-surface-800 border border-surface-700 rounded-lg pl-8 pr-8 py-1.5 text-xs outline-none focus:border-brand-500 transition-colors placeholder:text-surface-600 text-surface-200"
          />
          {searchQuery && (
            <button onClick={() => dispatch(setSearchQuery(''))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white transition-colors">
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Views */}
      <div className="px-2 flex-shrink-0">
        {SIDEBAR_VIEWS.map(v => (
          <button key={v.id}
            onClick={() => { dispatch(setSidebarView(v.id)); dispatch(setActiveFolder(null)) }}
            className={cn(
              'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left',
              sidebarView === v.id && !activeFolderId
                ? 'bg-brand-600/15 text-brand-400 border border-brand-600/20'
                : v.id === 'trash'
                  ? 'text-surface-500 hover:text-white hover:bg-surface-800'
                  : 'text-surface-400 hover:text-white hover:bg-surface-800',
            )}>
            <span style={{ color: sidebarView === v.id && !activeFolderId ? 'inherit' : undefined }}>{v.icon}</span>
            {v.label}
            {v.count > 0 && (
              <span className={cn('ml-auto text-[10px] rounded-full px-1.5 font-medium',
                sidebarView === v.id && !activeFolderId ? 'text-brand-400 bg-brand-500/15' : 'text-surface-600 bg-surface-800')}>
                {v.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="h-px bg-surface-700/50 mx-3 my-2 flex-shrink-0" />

      {/* Folders */}
      <div className="flex-shrink-0 px-2">
        <div className="flex items-center justify-between px-1.5 mb-1">
          <span className="text-[10px] font-bold text-surface-600 uppercase tracking-widest">Folders</span>
          <button onClick={() => setShowNewFolder(v => !v)}
            className="w-5 h-5 rounded text-surface-600 hover:text-white hover:bg-surface-700 transition-all flex items-center justify-center">
            <Plus size={11} />
          </button>
        </div>

        <AnimatePresence>
          {showNewFolder && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-1.5">
              <div className="flex items-center gap-1.5 p-2 bg-surface-800/60 border border-surface-700 rounded-xl">
                <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setShowNewFolder(false) }}
                  placeholder="Folder name…"
                  className="flex-1 bg-transparent text-xs outline-none text-surface-200 placeholder:text-surface-600" />
                <div className="flex gap-1">
                  {FOLDER_COLORS.slice(0, 6).map(c => (
                    <button key={c} onClick={() => setNewFolderColor(c)}
                      className={cn('w-3.5 h-3.5 rounded-full transition-all', newFolderColor === c && 'ring-2 ring-white ring-offset-1 ring-offset-surface-800')}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <button onClick={handleCreateFolder} className="text-brand-400 hover:text-brand-300 text-xs">✓</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-0.5 max-h-36 overflow-y-auto no-scrollbar">
          {folders.filter(f => !f.parentId).map(folder => {
            const folderNotes = notes.filter(n => n.folderId === folder.id && !n.isArchived)
            const isActive = activeFolderId === folder.id
            const isExpanded = expandedFolders.has(folder.id)
            return (
              <div key={folder.id}>
                <div
                  onClick={() => { dispatch(setActiveFolder(folder.id)); dispatch(setSidebarView('all')) }}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all group border',
                    isActive
                      ? 'border-transparent bg-brand-600/10'
                      : 'border-transparent hover:bg-surface-800/60',
                  )}>
                  {/* Color strip */}
                  <span className="w-1.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: folder.color }} />
                  <button onClick={e => { e.stopPropagation(); toggleFolder(folder.id) }}
                    className="text-surface-600 hover:text-white transition-all flex-shrink-0">
                    <ChevronRight size={11} className={cn('transition-transform', isExpanded && 'rotate-90')} />
                  </button>
                  <span className="text-xs flex-shrink-0">{folder.icon}</span>
                  <span className="flex-1 truncate" style={{ color: isActive ? folder.color : 'rgb(var(--color-text-secondary))' }}>
                    {folder.name}
                  </span>
                  <span className="text-[10px] text-surface-600 flex-shrink-0">{folderNotes.length}</span>
                  <button onClick={e => { e.stopPropagation(); dispatch(deleteFolder(folder.id)) }}
                    className="opacity-0 group-hover:opacity-100 text-surface-600 hover:text-red-400 transition-all flex-shrink-0">
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            )
          })}
          {folders.length === 0 && (
            <p className="text-[10px] text-surface-600 px-2 py-1">No folders yet</p>
          )}
        </div>
      </div>

      <div className="h-px bg-surface-700/50 mx-3 my-2 flex-shrink-0" />

      {/* Notes list header with sort */}
        <div className="flex items-center justify-between px-3 mb-1 flex-shrink-0">
        <span className="text-[10px] font-bold text-surface-600 uppercase tracking-widest">
          {sidebarView === 'trash' ? 'Trash' : activeFolderId ? folders.find(f => f.id === activeFolderId)?.name : 'Notes'}
          {filteredNotes.length > 0 && (
            <span className="text-surface-700 ml-1">({filteredNotes.length})</span>
          )}
        </span>

        <div className="flex items-center gap-1">
          {bulkMode ? (
            <button
              onClick={onSelectAll}
              className="text-[10px] font-semibold text-surface-500 hover:text-white transition-colors"
            >
              {selectedIds.size > 0 ? 'None' : 'All'}
            </button>
          ) : (
            <>
              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSort(v => !v)}
                  className={cn('flex items-center gap-0.5 text-[10px] transition-colors',
                    showSort ? 'text-brand-400' : 'text-surface-600 hover:text-white')}
                  title="Sort options"
                >
                  <SlidersHorizontal size={11} />
                  <ChevronDown size={9} className={cn('transition-transform', showSort && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {showSort && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-6 bg-surface-800 border border-surface-700 rounded-xl py-1 z-50 shadow-2xl min-w-[140px]"
                      >
                        {SORT_OPTIONS.map(opt => (
                          <button key={opt.id}
                            onClick={() => { dispatch(setSortBy(opt.id)); setShowSort(false) }}
                            className={cn('w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors',
                              sortBy === opt.id ? 'text-brand-400 bg-brand-600/10' : 'text-surface-400 hover:text-white hover:bg-surface-700/50')}>
                            {opt.label}
                            {sortBy === opt.id && <span className="text-brand-400">✓</span>}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Create new note */}
              {sidebarView !== 'trash' && (
                <button onClick={() => handleCreateNote('rich')}
                  className="w-5 h-5 rounded text-surface-600 hover:text-white hover:bg-surface-700 transition-all flex items-center justify-center"
                  title="New note">
                  <Plus size={11} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-2 pb-2">
        <div className="space-y-0.5">
          <AnimatePresence initial={false}>
            {filteredNotes.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-10">
                {sidebarView === 'trash' ? (
                  <>
                    <Trash2 size={20} className="mx-auto text-surface-700 mb-2" />
                    <p className="text-xs text-surface-600">Trash is empty</p>
                  </>
                ) : (
                  <>
                    <FileText size={20} className="mx-auto text-surface-700 mb-2" />
                    <p className="text-xs text-surface-600">
                      {searchQuery ? 'No matching notes' : 'No notes yet'}
                    </p>
                    {!searchQuery && (
                      <button onClick={() => handleCreateNote()} className="text-xs text-brand-400 hover:text-brand-300 mt-1.5 transition-colors">
                        Create first note
                      </button>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              filteredNotes.map(note => {
                const noteFolder = folders.find(f => f.id === note.folderId)
                const selected = selectedIds.has(note.id)
                const isArchived = sidebarView === 'trash'
                // In bulk mode, clicking selects; otherwise opens the note
                const handleClick = bulkMode
                  ? () => onToggleSelect?.(note.id)
                  : () => dispatch(setActiveNote(note.id))
                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    onClick={handleClick}
                    className={cn(
                      'group relative flex items-start gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-all border',
                      selected
                        ? 'bg-brand-600/20 border-brand-500/30'
                        : activeNoteId === note.id && !bulkMode
                          ? 'bg-brand-600/10 border-brand-500/20'
                          : 'border-transparent hover:bg-surface-800/60',
                    )}>
                    {/* Left color strip from folder */}
                    {noteFolder && (
                      <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ backgroundColor: noteFolder.color }} />
                    )}

                    {/* Checkbox for bulk mode, icon otherwise */}
                    {bulkMode ? (
                      <span className={cn(
                        'w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all',
                        selected
                          ? 'bg-brand-500 border-brand-500'
                          : 'border-surface-600 group-hover:border-surface-400',
                      )}>
                        {selected && <Check size={8} className="text-white" />}
                      </span>
                    ) : (
                      <span className="text-sm flex-shrink-0 mt-0.5">{note.icon}</span>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        {note.isPinned && !bulkMode && <Pin size={8} className="text-brand-400 flex-shrink-0" />}
                        {note.isFavorite && !bulkMode && <Star size={8} className="text-amber-400 fill-current flex-shrink-0" />}
                        <span className={cn(
                          'text-xs font-semibold truncate',
                          activeNoteId === note.id && !bulkMode ? 'text-brand-300' : 'text-surface-200',
                        )}>
                          {note.title}
                        </span>
                        {/* Note type badge */}
                        {!bulkMode && (
                          <span className={cn('text-[9px] font-bold ml-auto flex-shrink-0 px-1 py-0.5 rounded-sm', METHOD_BADGE[note.noteType ?? 'rich'])}>
                            {note.noteType === 'code' ? '</>' : 'T'}
                          </span>
                        )}
                      </div>

                      {/* Preview text */}
                      {note.contentText && (
                        <p className="text-[10px] text-surface-500 truncate leading-relaxed mb-0.5">
                          {note.contentText}
                        </p>
                      )}

                      {/* Footer: date + tags */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-surface-700">
                          {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                        </span>
                        {note.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[9px] text-brand-500/70">#{tag}</span>
                        ))}
                        {note.tags.length > 2 && (
                          <span className="text-[9px] text-surface-700">+{note.tags.length - 2}</span>
                        )}
                      </div>
                    </div>

                    {/* Hover actions */}
                    <div className={cn('flex-shrink-0 flex flex-col gap-0.5 transition-opacity',
                      bulkMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100')}>
                      {sidebarView === 'trash' ? (
                        <>
                          <button
                            onClick={e => { e.stopPropagation(); dispatch(restoreNote(note.id)) }}
                            title="Restore note"
                            className="w-5 h-5 rounded flex items-center justify-center text-surface-500 hover:text-green-400 transition-colors">
                            <RotateCcw size={10} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handlePermanentDelete(note.id) }}
                            title={deleteConfirm === note.id ? 'Click again to permanently delete' : 'Permanently delete'}
                            className={cn('w-5 h-5 rounded flex items-center justify-center transition-colors',
                              deleteConfirm === note.id ? 'text-red-400 animate-pulse' : 'text-surface-500 hover:text-red-400')}>
                            <X size={10} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={e => { e.stopPropagation(); dispatch(toggleFavorite(note.id)) }}
                            className="w-5 h-5 rounded flex items-center justify-center text-surface-500 hover:text-amber-400 transition-colors">
                            <Star size={10} className={note.isFavorite ? 'fill-current text-amber-400' : ''} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); dispatch(archiveNote(note.id)) }}
                            title="Move to trash"
                            className="w-5 h-5 rounded flex items-center justify-center text-surface-500 hover:text-red-400 transition-colors">
                            <Trash2 size={10} />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer: create note buttons */}
      {sidebarView !== 'trash' && !bulkMode && (
        <div className="p-2 flex-shrink-0 border-t border-surface-700/50">
          <div className="flex gap-1">
            <button
              onClick={() => handleCreateNote('rich')}
              className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600/30 border border-brand-600/30 text-brand-400 transition-colors"
              title="Create rich text note"
            >
              <Plus size={12} /> <FileText size={11} /> Rich
            </button>
            <button
              onClick={() => handleCreateNote('code')}
              className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1.5 rounded-lg bg-amber-600/10 hover:bg-amber-600/20 border border-amber-600/20 text-amber-400 transition-colors"
              title="Create raw/code note (preserves formatting)"
            >
              <Plus size={12} /> <FileCode size={11} /> Raw
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
