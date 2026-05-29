import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import {
  type Note, type NoteFolder, type NotesState,
  loadNotesState, saveNotesState,
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
  isLoading: false,
  isSaving: false,
}

// Debounced autosave for note content (1 s after last keystroke)
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

/** Load notes + folders from Supabase on init */
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

export const createNoteAsync = createAsyncThunk(
  'notes/createNoteAsync',
  async (payload: { folderId: string | null; title?: string }) => {
    const note: Note = {
      id: crypto.randomUUID(),
      folderId: payload.folderId,
      title: payload.title ?? 'Untitled',
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      contentText: '',
      icon: '📝',
      coverColor: '#3b82f6',
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      tags: [],
      wordCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await notesService.createNote(note, user.id)
    return note
  },
)

export const deleteNoteAsync = createAsyncThunk(
  'notes/deleteNoteAsync',
  async (id: string) => {
    await notesService.deleteNote(id)
    return id
  },
)

export const createFolderAsync = createAsyncThunk(
  'notes/createFolderAsync',
  async (payload: { name: string; color: string; icon: string; parentId?: string | null }, { getState }) => {
    const folder: NoteFolder = {
      id: crypto.randomUUID(),
      name: payload.name,
      icon: payload.icon ?? '📁',
      color: payload.color ?? '#3b82f6',
      parentId: payload.parentId ?? null,
      position: (getState() as { notes: NotesState }).notes.folders.length,
      createdAt: new Date().toISOString(),
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await notesService.createFolder(folder, user.id)
    return folder
  },
)

export const deleteFolderAsync = createAsyncThunk(
  'notes/deleteFolderAsync',
  async (id: string) => {
    await notesService.deleteFolder(id)
    return id
  },
)

// ── Slice ─────────────────────────────────────────────────────
const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    // Local-only note mutations (still dispatch Supabase via schedule*)
    createNote(state, action: PayloadAction<{ folderId: string | null; title?: string }>) {
      const note: Note = {
        id: crypto.randomUUID(),
        folderId: action.payload.folderId,
        title: action.payload.title ?? 'Untitled',
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        contentText: '',
        icon: '📝',
        coverColor: '#3b82f6',
        isPinned: false,
        isFavorite: false,
        isArchived: false,
        tags: [],
        wordCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      state.notes.unshift(note)
      state.activeNoteId = note.id
      saveNotesState({ folders: state.folders, notes: state.notes })
      // Persist to Supabase (fire and forget — editor will call updateNote immediately after)
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
        // Debounced sync (avoids hammering DB on every keystroke)
        scheduleNoteAutosave(action.payload.id, {
          ...action.payload.changes,
          updatedAt: state.notes[idx].updatedAt,
        })
      }
    },

    deleteNote(state, action: PayloadAction<string>) {
      state.notes = state.notes.filter(n => n.id !== action.payload)
      if (state.activeNoteId === action.payload) {
        state.activeNoteId = state.notes[0]?.id ?? null
      }
      saveNotesState({ folders: state.folders, notes: state.notes })
      notesService.deleteNote(action.payload)
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
      // Load from Supabase
      .addCase(fetchNotesFromSupabase.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchNotesFromSupabase.fulfilled, (state, action) => {
        state.isLoading = false
        const { folders, notes } = action.payload as { folders: NoteFolder[]; notes: Note[] }
        // Replace with Supabase data only if it has content
        if (folders.length > 0 || notes.length > 0) {
          state.folders = folders
          state.notes = notes
          state.activeNoteId = notes[0]?.id ?? null
          saveNotesState({ folders, notes })
        }
      })
      .addCase(fetchNotesFromSupabase.rejected, (state) => {
        state.isLoading = false
        // Keep local data on error
      })

      // Async create note
      .addCase(createNoteAsync.fulfilled, (state, action) => {
        state.notes.unshift(action.payload)
        state.activeNoteId = action.payload.id
        saveNotesState({ folders: state.folders, notes: state.notes })
      })

      // Async delete note
      .addCase(deleteNoteAsync.fulfilled, (state, action) => {
        state.notes = state.notes.filter(n => n.id !== action.payload)
        if (state.activeNoteId === action.payload) {
          state.activeNoteId = state.notes[0]?.id ?? null
        }
        saveNotesState({ folders: state.folders, notes: state.notes })
      })

      // Async create folder
      .addCase(createFolderAsync.fulfilled, (state, action) => {
        state.folders.push(action.payload)
        saveNotesState({ folders: state.folders, notes: state.notes })
      })

      // Async delete folder
      .addCase(deleteFolderAsync.fulfilled, (state, action) => {
        state.folders = state.folders.filter(f => f.id !== action.payload)
        state.notes = state.notes.map(n =>
          n.folderId === action.payload ? { ...n, folderId: null } : n,
        )
        saveNotesState({ folders: state.folders, notes: state.notes })
      })
  },
})

export const {
  createNote, updateNote, deleteNote,
  createFolder, deleteFolder,
  setActiveNote, setActiveFolder,
  setSearchQuery, setSidebarView, setSaving,
  toggleFavorite, togglePin,
} = notesSlice.actions

export default notesSlice.reducer
