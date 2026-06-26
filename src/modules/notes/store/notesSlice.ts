import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import {
  type Note, type NoteFolder, type NotesState, type NoteType,
  loadNotesState, saveNotesState, makeNote,
} from '../dto/types/notes.types'
import { notesService } from '../services/notes.service'
import { supabase } from '@core/config/supabaseClient'

const saved = loadNotesState()

const initialState: NotesState = {
  folders: saved.folders,
  notes: saved.notes,
  activeNoteId: saved.notes[0]?.id ?? null,
  activeFolderId: null,
  searchQuery: '',
  sidebarView: 'all',
  sortBy: 'updated',
  isLoading: false,
  isSaving: false,
}

const autosaveTimers = new Map<string, ReturnType<typeof setTimeout>>()

function scheduleNoteAutosave(id: string, changes: Partial<Note>) {
  const existing = autosaveTimers.get(id)
  if (existing) clearTimeout(existing)
  const timer = setTimeout(() => {
    notesService.updateNote(id, changes)
    autosaveTimers.delete(id)
  }, 1000)
  autosaveTimers.set(id, timer)
}

// ── Async thunks ──────────────────────────────────────────────

export const fetchNotesFromSupabase = createAsyncThunk(
  'notes/fetchFromSupabase',
  async (_, { rejectWithValue }) => {
    try {
      const [folders, notes] = await Promise.all([
        notesService.fetchFolders(),
        notesService.fetchNotes(),
      ])
      return { folders, notes }
    } catch (err) {
      return rejectWithValue((err as Error).message)
    }
  },
)

// ── Slice ─────────────────────────────────────────────────────
const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    createNote(state, action: PayloadAction<{ folderId: string | null; title?: string; noteType?: NoteType }>) {
      const note = makeNote({
        folderId: action.payload.folderId,
        title: action.payload.title ?? 'Untitled',
        noteType: action.payload.noteType ?? 'rich',
        icon: '📝',
        coverColor: '',
      })
      state.notes.unshift(note)
      state.activeNoteId = note.id
      saveNotesState({ folders: state.folders, notes: state.notes })
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) notesService.createNote(note, user.id)
      })
    },

    updateNote(state, action: PayloadAction<{ id: string; changes: Partial<Note> }>) {
      const idx = state.notes.findIndex(n => n.id === action.payload.id)
      if (idx !== -1) {
        state.notes[idx] = {
          ...state.notes[idx],
          ...action.payload.changes,
          updatedAt: new Date().toISOString(),
        }
        saveNotesState({ folders: state.folders, notes: state.notes })
        scheduleNoteAutosave(action.payload.id, {
          ...action.payload.changes,
          updatedAt: state.notes[idx].updatedAt,
        })
      }
    },

    deleteNote(state, action: PayloadAction<string>) {
      state.notes = state.notes.filter(n => n.id !== action.payload)
      if (state.activeNoteId === action.payload) {
        state.activeNoteId = state.notes.find(n => !n.isArchived)?.id ?? null
      }
      saveNotesState({ folders: state.folders, notes: state.notes })
      notesService.deleteNote(action.payload)
    },

    archiveNote(state, action: PayloadAction<string>) {
      const note = state.notes.find(n => n.id === action.payload)
      if (note) {
        note.isArchived = true
        note.updatedAt = new Date().toISOString()
        if (state.activeNoteId === action.payload) {
          state.activeNoteId = state.notes.find(n => !n.isArchived && n.id !== action.payload)?.id ?? null
        }
        saveNotesState({ folders: state.folders, notes: state.notes })
        notesService.updateNote(note.id, { isArchived: true })
      }
    },

    restoreNote(state, action: PayloadAction<string>) {
      const note = state.notes.find(n => n.id === action.payload)
      if (note) {
        note.isArchived = false
        note.updatedAt = new Date().toISOString()
        saveNotesState({ folders: state.folders, notes: state.notes })
        notesService.updateNote(note.id, { isArchived: false })
      }
    },

    createFolder(state, action: PayloadAction<{ name: string; color: string; icon: string; parentId?: string | null }>) {
      const folder: NoteFolder = {
        id: crypto.randomUUID(),
        name: action.payload.name,
        icon: action.payload.icon ?? '📁',
        color: action.payload.color ?? '#3b82f6',
        parentId: action.payload.parentId ?? null,
        position: state.folders.length,
        createdAt: new Date().toISOString(),
      }
      state.folders.push(folder)
      saveNotesState({ folders: state.folders, notes: state.notes })
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) notesService.createFolder(folder, user.id)
      })
    },

    deleteFolder(state, action: PayloadAction<string>) {
      state.folders = state.folders.filter(f => f.id !== action.payload)
      state.notes = state.notes.map(n => n.folderId === action.payload ? { ...n, folderId: null } : n)
      saveNotesState({ folders: state.folders, notes: state.notes })
      notesService.deleteFolder(action.payload)
    },

    setActiveNote(state, action: PayloadAction<string | null>) {
      state.activeNoteId = action.payload
    },

    setActiveFolder(state, action: PayloadAction<string | null>) {
      state.activeFolderId = action.payload
    },

    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload
    },

    setSidebarView(state, action: PayloadAction<NotesState['sidebarView']>) {
      state.sidebarView = action.payload
    },

    setSortBy(state, action: PayloadAction<NotesState['sortBy']>) {
      state.sortBy = action.payload
    },

    setSaving(state, action: PayloadAction<boolean>) {
      state.isSaving = action.payload
    },

    toggleFavorite(state, action: PayloadAction<string>) {
      const note = state.notes.find(n => n.id === action.payload)
      if (note) {
        note.isFavorite = !note.isFavorite
        note.updatedAt = new Date().toISOString()
        saveNotesState({ folders: state.folders, notes: state.notes })
        notesService.updateNote(note.id, { isFavorite: note.isFavorite })
      }
    },

    togglePin(state, action: PayloadAction<string>) {
      const note = state.notes.find(n => n.id === action.payload)
      if (note) {
        note.isPinned = !note.isPinned
        note.updatedAt = new Date().toISOString()
        saveNotesState({ folders: state.folders, notes: state.notes })
        notesService.updateNote(note.id, { isPinned: note.isPinned })
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchNotesFromSupabase.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchNotesFromSupabase.fulfilled, (state, action) => {
        state.isLoading = false
        const { folders, notes } = action.payload as { folders: NoteFolder[]; notes: Note[] }
        if (folders.length > 0 || notes.length > 0) {
          state.folders = folders
          state.notes = notes
          state.activeNoteId = notes.find(n => !n.isArchived)?.id ?? null
          saveNotesState({ folders, notes })
        }
      })
      .addCase(fetchNotesFromSupabase.rejected, (state) => {
        state.isLoading = false
      })
  },
})

export const {
  createNote, updateNote, deleteNote, archiveNote, restoreNote,
  createFolder, deleteFolder,
  setActiveNote, setActiveFolder,
  setSearchQuery, setSidebarView, setSortBy, setSaving,
  toggleFavorite, togglePin,
} = notesSlice.actions

export default notesSlice.reducer
