import { supabase } from '@core/config/supabaseClient'
import type { Space, Project, Column, Task } from '../dto/types/taskboard.types'

// ── DB row shapes ─────────────────────────────────────────────

interface DbSpace {
  id: string; user_id: string; name: string; color: string; icon: string
  description: string; position: number; created_at: string
}
interface DbProject {
  id: string; user_id: string; space_id: string; name: string; description: string
  color: string; icon: string; status: string; position: number; created_at: string
}
interface DbColumn {
  id: string; user_id: string; project_id: string; name: string
  color: string; position: number; is_done: boolean; created_at: string
}
interface DbTask {
  id: string; user_id: string; space_id: string | null; project_id: string | null
  column_id: string; title: string; description: string; priority: string
  labels: string[]; due_date: string | null; position: number; is_completed: boolean
  subtasks: object[]; comments: object[]; estimated_hours: number | null
  assignee_name: string | null; attachments: string[]; created_at: string; updated_at: string
}

// ── Mappers ───────────────────────────────────────────────────

const toSpace   = (r: DbSpace):   Space   => ({ id: r.id, name: r.name, color: r.color, icon: r.icon, description: r.description, position: r.position, createdAt: r.created_at })
const toProject = (r: DbProject): Project => ({ id: r.id, spaceId: r.space_id, name: r.name, description: r.description, color: r.color, icon: r.icon, status: r.status as Project['status'], position: r.position, createdAt: r.created_at })
const toColumn  = (r: DbColumn):  Column  => ({ id: r.id, projectId: r.project_id, name: r.name, color: r.color, position: r.position, isDone: r.is_done })
const toTask    = (r: DbTask):    Task    => ({
  id: r.id, spaceId: r.space_id ?? '', projectId: r.project_id ?? '',
  columnId: r.column_id, title: r.title, description: r.description,
  priority: r.priority as Task['priority'], labels: r.labels ?? [], dueDate: r.due_date,
  position: r.position, isCompleted: r.is_completed, subtasks: r.subtasks as Task['subtasks'],
  comments: r.comments as Task['comments'], estimatedHours: r.estimated_hours ?? undefined,
  assigneeName: r.assignee_name ?? undefined, attachments: r.attachments ?? [],
  createdAt: r.created_at, updatedAt: r.updated_at,
})

// ── Service ───────────────────────────────────────────────────

export const taskboardService = {
  // ── Spaces ─────────────────────────────────────────────
  async fetchSpaces(): Promise<Space[]> {
    const { data, error } = await supabase.from('tb_spaces').select('*').order('position')
    if (error) { return [] }
    return (data as DbSpace[]).map(toSpace)
  },
  async createSpace(s: Space, userId: string): Promise<void> {
    const { error } = await supabase.from('tb_spaces').insert({
      id: s.id, user_id: userId, name: s.name, color: s.color, icon: s.icon,
      description: s.description, position: s.position,
    })
    if (error) throw new Error(error.message)
  },
  async updateSpace(id: string, changes: Partial<Pick<Space, 'name' | 'color' | 'icon' | 'description' | 'position'>>): Promise<void> {
    const { error } = await supabase.from('tb_spaces').update(changes).eq('id', id)
    if (error) throw new Error(error.message)
  },
  async deleteSpace(id: string): Promise<void> {
    const { error } = await supabase.from('tb_spaces').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  // ── Projects ────────────────────────────────────────────
  async fetchProjects(): Promise<Project[]> {
    const { data, error } = await supabase.from('tb_projects').select('*').order('position')
    if (error) { return [] }
    return (data as DbProject[]).map(toProject)
  },
  async createProject(p: Project, userId: string): Promise<void> {
    const { error } = await supabase.from('tb_projects').insert({
      id: p.id, user_id: userId, space_id: p.spaceId, name: p.name,
      description: p.description, color: p.color, icon: p.icon,
      status: p.status, position: p.position,
    })
    if (error) throw new Error(error.message)
  },
  async updateProject(id: string, changes: Partial<Pick<Project, 'name' | 'color' | 'icon' | 'description' | 'status' | 'position'>>): Promise<void> {
    const { error } = await supabase.from('tb_projects').update(changes).eq('id', id)
    if (error) throw new Error(error.message)
  },
  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase.from('tb_projects').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  // ── Columns ─────────────────────────────────────────────
  async fetchColumns(): Promise<Column[]> {
    const { data, error } = await supabase.from('tb_columns').select('*').order('position')
    if (error) { return [] }
    return (data as DbColumn[]).map(toColumn)
  },
  async createColumn(c: Column, userId: string): Promise<void> {
    const { error } = await supabase.from('tb_columns').insert({
      id: c.id, user_id: userId, project_id: c.projectId, name: c.name,
      color: c.color, position: c.position, is_done: c.isDone,
    })
    if (error) throw new Error(error.message)
  },
  async updateColumn(id: string, changes: Partial<Pick<Column, 'name' | 'color' | 'position' | 'isDone'>>): Promise<void> {
    const dbChanges: Record<string, unknown> = {}
    if (changes.name !== undefined)     dbChanges.name     = changes.name
    if (changes.color !== undefined)    dbChanges.color    = changes.color
    if (changes.position !== undefined) dbChanges.position = changes.position
    if (changes.isDone !== undefined)   dbChanges.is_done  = changes.isDone
    const { error } = await supabase.from('tb_columns').update(dbChanges).eq('id', id)
    if (error) throw new Error(error.message)
  },
  async deleteColumn(id: string): Promise<void> {
    const { error } = await supabase.from('tb_columns').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  // ── Tasks ───────────────────────────────────────────────
  async fetchTasks(projectId?: string): Promise<Task[]> {
    let q = supabase.from('tb_tasks').select('*').order('position')
    if (projectId) q = q.eq('project_id', projectId)
    const { data, error } = await q
    if (error) { return [] }
    return (data as DbTask[]).map(toTask)
  },
  async createTask(t: Task, userId: string): Promise<void> {
    const { error } = await supabase.from('tb_tasks').insert({
      id: t.id, user_id: userId, space_id: t.spaceId || null, project_id: t.projectId || null,
      column_id: t.columnId, title: t.title, description: t.description,
      priority: t.priority, labels: t.labels, due_date: t.dueDate,
      position: t.position, is_completed: t.isCompleted, subtasks: t.subtasks,
      comments: t.comments, estimated_hours: t.estimatedHours ?? null,
      assignee_name: t.assigneeName ?? null, attachments: t.attachments,
    })
    if (error) throw new Error(error.message)
  },
  async updateTask(id: string, changes: Partial<Task>): Promise<void> {
    const db: Record<string, unknown> = {}
    if (changes.title !== undefined)          db.title           = changes.title
    if (changes.description !== undefined)    db.description     = changes.description
    if (changes.priority !== undefined)       db.priority        = changes.priority
    if (changes.labels !== undefined)         db.labels          = changes.labels
    if (changes.dueDate !== undefined)        db.due_date        = changes.dueDate
    if (changes.columnId !== undefined)       db.column_id       = changes.columnId
    if (changes.position !== undefined)       db.position        = changes.position
    if (changes.isCompleted !== undefined)    db.is_completed    = changes.isCompleted
    if (changes.subtasks !== undefined)       db.subtasks        = changes.subtasks
    if (changes.comments !== undefined)       db.comments        = changes.comments
    if (changes.estimatedHours !== undefined) db.estimated_hours = changes.estimatedHours
    if (changes.assigneeName !== undefined)   db.assignee_name   = changes.assigneeName
    if (changes.attachments !== undefined)    db.attachments     = changes.attachments
    const { error } = await supabase.from('tb_tasks').update(db).eq('id', id)
    if (error) throw new Error(error.message)
  },
  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase.from('tb_tasks').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}
