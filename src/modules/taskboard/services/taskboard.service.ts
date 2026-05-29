import { supabase } from '@core/config/supabaseClient'
import type { Task } from '../dto/types/taskboard.types'

// ── DB row type (snake_case from Supabase) ────────────────────
interface DbTask {
  id: string
  user_id: string
  title: string
  description: string
  priority: string
  labels: string[]
  due_date: string | null
  column_id: string
  position: number
  is_completed: boolean
  subtasks: object[]
  comments: object[]
  estimated_hours: number | null
  assignee_name: string | null
  attachments: string[]
  created_at: string
  updated_at: string
}

function toTask(r: DbTask): Task {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    priority: r.priority as Task['priority'],
    labels: r.labels ?? [],
    dueDate: r.due_date,
    columnId: r.column_id,
    position: r.position,
    isCompleted: r.is_completed,
    subtasks: (r.subtasks as Task['subtasks']) ?? [],
    comments: (r.comments as Task['comments']) ?? [],
    estimatedHours: r.estimated_hours ?? undefined,
    assigneeName: r.assignee_name ?? undefined,
    attachments: r.attachments ?? [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toDbInsert(task: Task, userId: string): Omit<DbTask, 'created_at' | 'updated_at'> {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    description: task.description,
    priority: task.priority,
    labels: task.labels,
    due_date: task.dueDate,
    column_id: task.columnId,
    position: task.position,
    is_completed: task.isCompleted,
    subtasks: task.subtasks as object[],
    comments: task.comments as object[],
    estimated_hours: task.estimatedHours ?? null,
    assignee_name: task.assigneeName ?? null,
    attachments: task.attachments,
  }
}

export const taskboardService = {
  async fetchTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tb_tasks')
      .select('*')
      .order('position', { ascending: true })

    if (error) {
      console.error('[TaskBoard] fetchTasks:', error.message)
      return []
    }
    return (data as DbTask[]).map(toTask)
  },

  async createTask(task: Task, userId: string): Promise<void> {
    const { error } = await supabase
      .from('tb_tasks')
      .insert(toDbInsert(task, userId))
    if (error) console.error('[TaskBoard] createTask:', error.message)
  },

  async updateTask(id: string, changes: Partial<Task>): Promise<void> {
    const dbChanges: Record<string, unknown> = {}
    if (changes.title !== undefined)          dbChanges.title           = changes.title
    if (changes.description !== undefined)    dbChanges.description     = changes.description
    if (changes.priority !== undefined)       dbChanges.priority        = changes.priority
    if (changes.labels !== undefined)         dbChanges.labels          = changes.labels
    if (changes.dueDate !== undefined)        dbChanges.due_date        = changes.dueDate
    if (changes.columnId !== undefined)       dbChanges.column_id       = changes.columnId
    if (changes.position !== undefined)       dbChanges.position        = changes.position
    if (changes.isCompleted !== undefined)    dbChanges.is_completed    = changes.isCompleted
    if (changes.subtasks !== undefined)       dbChanges.subtasks        = changes.subtasks
    if (changes.comments !== undefined)       dbChanges.comments        = changes.comments
    if (changes.estimatedHours !== undefined) dbChanges.estimated_hours = changes.estimatedHours
    if (changes.assigneeName !== undefined)   dbChanges.assignee_name   = changes.assigneeName
    if (changes.attachments !== undefined)    dbChanges.attachments     = changes.attachments

    const { error } = await supabase
      .from('tb_tasks')
      .update(dbChanges)
      .eq('id', id)
    if (error) console.error('[TaskBoard] updateTask:', error.message)
  },

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tb_tasks')
      .delete()
      .eq('id', id)
    if (error) console.error('[TaskBoard] deleteTask:', error.message)
  },

  async moveTask(taskId: string, columnId: string): Promise<void> {
    const { error } = await supabase
      .from('tb_tasks')
      .update({ column_id: columnId })
      .eq('id', taskId)
    if (error) console.error('[TaskBoard] moveTask:', error.message)
  },
}
