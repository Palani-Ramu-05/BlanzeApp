import { supabase } from '@core/config/supabaseClient'
import type { Note, NoteFolder, NoteType } from '../dto/types/notes.types'

interface DbFolder {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  parent_id: string | null
  position: number
  created_at: string
}

interface DbNote {
  id: string
  user_id: string
  folder_id: string | null
  title: string
  content: object | null
  content_text: string
  raw_content: string | null
  note_type: string | null
  icon: string
  cover_color: string
  is_pinned: boolean
  is_favorite: boolean
  is_archived: boolean
  tags: string[]
  word_count: number
  created_at: string
  updated_at: string
}

function toFolder(r: DbFolder): NoteFolder {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    parentId: r.parent_id,
    position: r.position,
    createdAt: r.created_at,
  }
}

function toNote(r: DbNote): Note {
  return {
    id: r.id,
    folderId: r.folder_id,
    title: r.title,
    content: r.content,
    contentText: r.content_text,
    rawContent: r.raw_content ?? '',
    noteType: (r.note_type as NoteType) ?? 'rich',
    icon: r.icon,
    coverColor: r.cover_color,
    isPinned: r.is_pinned,
    isFavorite: r.is_favorite,
    isArchived: r.is_archived,
    tags: r.tags ?? [],
    wordCount: r.word_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export const notesService = {
  // ── Folders ──────────────────────────────────────────────────
  async fetchFolders(): Promise<NoteFolder[]> {
    const { data, error } = await supabase
      .from('note_folders')
      .select('*')
      .order('position', { ascending: true })

    if (error) return []
    return (data as DbFolder[]).map(toFolder)
  },

  async createFolder(folder: NoteFolder, userId: string): Promise<void> {
    const { error } = await supabase.from('note_folders').insert({
      id: folder.id,
      user_id: userId,
      name: folder.name,
      icon: folder.icon,
      color: folder.color,
      parent_id: folder.parentId,
      position: folder.position,
    })
    if (error) throw new Error(error.message)
  },

  async updateFolder(id: string, changes: Partial<NoteFolder>): Promise<void> {
    const dbChanges: Record<string, unknown> = {}
    if (changes.name !== undefined)     dbChanges.name      = changes.name
    if (changes.icon !== undefined)     dbChanges.icon      = changes.icon
    if (changes.color !== undefined)    dbChanges.color     = changes.color
    if (changes.parentId !== undefined) dbChanges.parent_id = changes.parentId
    if (changes.position !== undefined) dbChanges.position  = changes.position

    const { error } = await supabase.from('note_folders').update(dbChanges).eq('id', id)
    if (error) throw new Error(error.message)
  },

  async deleteFolder(id: string): Promise<void> {
    const { error } = await supabase.from('note_folders').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  // ── Notes ────────────────────────────────────────────────────
  async fetchNotes(): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) return []
    return (data as DbNote[]).map(toNote)
  },

  async createNote(note: Note, userId: string): Promise<void> {
    const { error } = await supabase.from('notes').insert({
      id: note.id,
      user_id: userId,
      folder_id: note.folderId,
      title: note.title,
      content: note.content,
      content_text: note.contentText,
      raw_content: note.rawContent ?? '',
      note_type: note.noteType ?? 'rich',
      icon: note.icon,
      cover_color: note.coverColor,
      is_pinned: note.isPinned,
      is_favorite: note.isFavorite,
      is_archived: note.isArchived,
      tags: note.tags,
      word_count: note.wordCount,
    })
    if (error) throw new Error(error.message)
  },

  async updateNote(id: string, changes: Partial<Note>): Promise<void> {
    const dbChanges: Record<string, unknown> = {}
    if (changes.title !== undefined)       dbChanges.title        = changes.title
    if (changes.content !== undefined)     dbChanges.content      = changes.content
    if (changes.contentText !== undefined) dbChanges.content_text = changes.contentText
    if (changes.rawContent !== undefined)  dbChanges.raw_content  = changes.rawContent
    if (changes.noteType !== undefined)    dbChanges.note_type    = changes.noteType
    if (changes.icon !== undefined)        dbChanges.icon         = changes.icon
    if (changes.coverColor !== undefined)  dbChanges.cover_color  = changes.coverColor
    if (changes.isPinned !== undefined)    dbChanges.is_pinned    = changes.isPinned
    if (changes.isFavorite !== undefined)  dbChanges.is_favorite  = changes.isFavorite
    if (changes.isArchived !== undefined)  dbChanges.is_archived  = changes.isArchived
    if (changes.tags !== undefined)        dbChanges.tags         = changes.tags
    if (changes.wordCount !== undefined)   dbChanges.word_count   = changes.wordCount
    if (changes.folderId !== undefined)    dbChanges.folder_id    = changes.folderId
    if (changes.updatedAt !== undefined)   dbChanges.updated_at   = changes.updatedAt

    const { error } = await supabase.from('notes').update(dbChanges).eq('id', id)
    if (error) throw new Error(error.message)
  },

  async deleteNote(id: string): Promise<void> {
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async batchDelete(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    const { error } = await supabase.from('notes').delete().in('id', ids)
    if (error) throw new Error(error.message)
  },

  async batchArchive(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    const now = new Date().toISOString()
    const { error } = await supabase.from('notes').update({ is_archived: true, updated_at: now }).in('id', ids)
    if (error) throw new Error(error.message)
  },
}
