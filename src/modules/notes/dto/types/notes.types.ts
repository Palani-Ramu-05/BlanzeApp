export interface NoteFolder {
  id: string
  name: string
  icon: string
  color: string
  parentId: string | null
  position: number
  createdAt: string
}

export interface Note {
  id: string
  folderId: string | null
  title: string
  content: object | null   // TipTap JSON
  contentText: string      // plain text for search
  icon: string
  coverColor: string
  isPinned: boolean
  isFavorite: boolean
  isArchived: boolean
  tags: string[]
  wordCount: number
  createdAt: string
  updatedAt: string
}

export interface NotesState {
  folders: NoteFolder[]
  notes: Note[]
  activeNoteId: string | null
  activeFolderId: string | null
  searchQuery: string
  sidebarView: 'folders' | 'all' | 'favorites' | 'recent' | 'trash'
  isLoading: boolean
  isSaving: boolean
}

export const NOTE_ICONS = ['📝', '💡', '🎯', '📚', '🔖', '💭', '🗒️', '✨', '🚀', '🌟', '🔥', '💎', '🎨', '⚡', '🌿']
export const FOLDER_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b']

const STORAGE_KEY = 'blanze_notes'

function createSampleNotes(): { folders: NoteFolder[]; notes: Note[] } {
  const folderId = crypto.randomUUID()
  const folders: NoteFolder[] = [
    { id: folderId, name: 'Work', icon: '💼', color: '#3b82f6', parentId: null, position: 0, createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Personal', icon: '🏠', color: '#10b981', parentId: null, position: 1, createdAt: new Date().toISOString() },
  ]
  const notes: Note[] = [
    {
      id: crypto.randomUUID(), folderId, title: 'Project Kickoff Notes',
      content: {
        type: 'doc', content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Project Kickoff Notes' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Key points from the kickoff meeting...' }] },
          { type: 'bulletList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Define MVP scope' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Assign team roles' }] }] },
          ]},
        ]
      },
      contentText: 'Project kickoff notes key points',
      icon: '🚀', coverColor: '#3b82f6',
      isPinned: true, isFavorite: false, isArchived: false,
      tags: ['work', 'project'],
      wordCount: 42,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(), folderId: null, title: 'Ideas Backlog',
      content: {
        type: 'doc', content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Ideas Backlog' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'A running list of ideas and thoughts...' }] },
        ]
      },
      contentText: 'Ideas backlog running list',
      icon: '💡', coverColor: '#f59e0b',
      isPinned: false, isFavorite: true, isArchived: false,
      tags: ['ideas'],
      wordCount: 18,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  ]
  return { folders, notes }
}

export function loadNotesState(): Pick<NotesState, 'folders' | 'notes'> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
    return createSampleNotes()
  } catch { return createSampleNotes() }
}

export function saveNotesState(state: Pick<NotesState, 'folders' | 'notes'>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}
