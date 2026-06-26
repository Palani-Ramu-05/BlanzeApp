export interface NoteFolder {
  id: string
  name: string
  icon: string
  color: string
  parentId: string | null
  position: number
  createdAt: string
}

export type NoteType = 'rich' | 'code'

export interface Note {
  id: string
  folderId: string | null
  title: string
  content: object | null   // TipTap JSON (rich mode)
  contentText: string      // plain text for search preview
  rawContent: string       // verbatim text for code mode
  noteType: NoteType       // 'rich' | 'code'
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
  sidebarView: 'all' | 'favorites' | 'recent' | 'trash'
  sortBy: 'updated' | 'created' | 'title' | 'words'
  isLoading: boolean
  isSaving: boolean
}

export const NOTE_ICONS = [
  '📝', '💡', '🎯', '📚', '🔖', '💭', '🗒️', '✨', '🚀', '🌟',
  '🔥', '💎', '🎨', '⚡', '🌿', '🧠', '🏆', '🔐', '📊', '🧩',
  '🌈', '🔬', '💻', '📌', '🎭', '🎵', '🌍', '🏠', '💼', '⭐',
]

export const FOLDER_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#64748b',
  '#f97316', '#84cc16',
]

export const CODE_LANGUAGES = [
  { id: 'auto',       label: 'Auto Detect' },
  { id: 'json',       label: 'JSON' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'html',       label: 'HTML' },
  { id: 'xml',        label: 'XML' },
  { id: 'css',        label: 'CSS' },
  { id: 'python',     label: 'Python' },
  { id: 'sql',        label: 'SQL' },
  { id: 'bash',       label: 'Bash / Shell' },
  { id: 'yaml',       label: 'YAML' },
  { id: 'markdown',   label: 'Markdown' },
  { id: 'text',       label: 'Plain Text' },
]

/** Detect language from content */
export function detectLanguage(text: string): string {
  const trimmed = text.trimStart()
  if (!trimmed) return 'text'
  if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && isValidJson(trimmed)) return 'json'
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) return 'html'
  if (trimmed.startsWith('<') && trimmed.includes('</')) return 'xml'
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\s/i.test(trimmed)) return 'sql'
  if (/^#!/.test(trimmed) || /\$\s/.test(trimmed.slice(0, 100))) return 'bash'
  if (/^---\n/.test(trimmed) || /:\s+\S/.test(trimmed.slice(0, 200))) return 'yaml'
  if (/^(import|export|const|let|var|function|class|interface|type)\s/.test(trimmed)) return 'typescript'
  if (/^(def |import |from |class |print\(|if __name__)/.test(trimmed)) return 'python'
  if (/^(#+ |```|\*\*|---$)/.test(trimmed)) return 'markdown'
  return 'text'
}

function isValidJson(str: string): boolean {
  try { JSON.parse(str); return true } catch { return false }
}

const STORAGE_KEY = 'blanze_notes'

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: crypto.randomUUID(),
    folderId: null,
    title: 'Untitled',
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    contentText: '',
    rawContent: '',
    noteType: 'rich',
    icon: '📝',
    coverColor: '',
    isPinned: false,
    isFavorite: false,
    isArchived: false,
    tags: [],
    wordCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function createSampleNotes(): { folders: NoteFolder[]; notes: Note[] } {
  const folderId = crypto.randomUUID()
  const folders: NoteFolder[] = [
    { id: folderId, name: 'Work', icon: '💼', color: '#3b82f6', parentId: null, position: 0, createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Personal', icon: '🏠', color: '#10b981', parentId: null, position: 1, createdAt: new Date().toISOString() },
  ]
  const notes: Note[] = [
    makeNote({
      id: crypto.randomUUID(), folderId, title: 'Project Kickoff Notes',
      content: {
        type: 'doc', content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Project Kickoff Notes' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Key points from the kickoff meeting...' }] },
          { type: 'bulletList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Define MVP scope' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Assign team roles' }] }] },
          ]},
        ],
      },
      contentText: 'Project kickoff notes key points',
      icon: '🚀', coverColor: '#3b82f6',
      isPinned: true, tags: ['work', 'project'], wordCount: 42,
    }),
    makeNote({
      id: crypto.randomUUID(), folderId: null, title: 'JSON Scratch Pad',
      noteType: 'code',
      rawContent: '{\n  "name": "example",\n  "version": "1.0.0",\n  "description": "A sample JSON payload"\n}',
      contentText: 'JSON scratch pad example',
      icon: '💻', isFavorite: true, tags: ['code'],
    }),
    makeNote({
      id: crypto.randomUUID(), folderId: null, title: 'Ideas Backlog',
      content: {
        type: 'doc', content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Ideas Backlog' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'A running list of ideas and thoughts...' }] },
        ],
      },
      contentText: 'Ideas backlog running list',
      icon: '💡', coverColor: '#f59e0b',
      isFavorite: true, tags: ['ideas'], wordCount: 18,
    }),
  ]
  return { folders, notes }
}

export { makeNote }

export function loadNotesState(): Pick<NotesState, 'folders' | 'notes'> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Migrate old notes that don't have noteType/rawContent
      if (parsed.notes) {
        parsed.notes = parsed.notes.map((n: Note) => ({
          ...n,
          rawContent: n.rawContent ?? '',
          noteType: (n.noteType ?? 'rich') as NoteType,
        }))
      }
      return parsed
    }
    return createSampleNotes()
  } catch { return createSampleNotes() }
}

export function saveNotesState(state: Pick<NotesState, 'folders' | 'notes'>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}
