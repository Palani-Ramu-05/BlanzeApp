export type Priority = 'urgent' | 'high' | 'medium' | 'low'

export interface SubTask {
  id: string
  title: string
  completed: boolean
}

export interface TaskComment {
  id: string
  text: string
  authorName: string
  createdAt: string
}

export interface Space {
  id: string
  name: string
  color: string
  icon: string
  description: string
  position: number
  createdAt: string
}

export interface Project {
  id: string
  spaceId: string
  name: string
  description: string
  color: string
  icon: string
  status: 'active' | 'archived'
  position: number
  createdAt: string
}

export interface Column {
  id: string
  projectId: string
  name: string
  color: string
  position: number
  isDone: boolean
}

export interface Task {
  id: string
  spaceId: string
  projectId: string
  columnId: string
  title: string
  description: string
  priority: Priority
  labels: string[]
  dueDate: string | null
  position: number
  isCompleted: boolean
  subtasks: SubTask[]
  comments: TaskComment[]
  estimatedHours?: number
  assigneeName?: string
  attachments: string[]
  createdAt: string
  updatedAt: string
}

export interface TaskBoardState {
  spaces: Space[]
  projects: Project[]
  columns: Column[]
  tasks: Task[]
  activeSpaceId: string | null
  activeProjectId: string | null
  activeTaskId: string | null
  filterPriority: Priority | 'all'
  filterLabel: string | 'all'
  searchQuery: string
  view: 'kanban' | 'list'
  isLoading: boolean
}

// ── UI config ─────────────────────────────────────────────────

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; border: string; dot: string }> = {
  urgent: { label: 'Urgent', color: '#ef4444', bg: 'bg-red-500/15',     border: 'border-red-500/30',     dot: 'bg-red-500' },
  high:   { label: 'High',   color: '#f59e0b', bg: 'bg-amber-500/15',   border: 'border-amber-500/30',   dot: 'bg-amber-500' },
  medium: { label: 'Medium', color: '#3b82f6', bg: 'bg-blue-500/15',    border: 'border-blue-500/30',    dot: 'bg-blue-500' },
  low:    { label: 'Low',    color: '#10b981', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
}

export const LABEL_COLORS: Record<string, string> = {
  frontend: '#3b82f6',
  backend:  '#10b981',
  design:   '#8b5cf6',
  bug:      '#ef4444',
  feature:  '#f59e0b',
  docs:     '#64748b',
  testing:  '#ec4899',
  devops:   '#06b6d4',
}

export const SPACE_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4',
  '#64748b', '#f97316',
]

export const COLUMN_COLORS = [
  '#64748b', '#3b82f6', '#f59e0b', '#10b981',
  '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4',
  '#f97316', '#84cc16',
]

export const SPACE_ICONS  = ['🚀', '💼', '🏠', '🎯', '⚡', '🌟', '🔥', '💎', '🎨', '🧠']
export const PROJECT_ICONS = ['📋', '📌', '📊', '🗂️', '🏗️', '🎯', '📱', '💻', '🔬', '🎭']

// ── Default seed data ─────────────────────────────────────────
export function makeSeedData(): { spaces: Space[]; projects: Project[]; columns: Column[]; tasks: Task[] } {
  const spaceId   = crypto.randomUUID()
  const project1  = crypto.randomUUID()
  const project2  = crypto.randomUUID()

  const col1 = crypto.randomUUID()
  const col2 = crypto.randomUUID()
  const col3 = crypto.randomUUID()
  const col4 = crypto.randomUUID()
  const col5 = crypto.randomUUID()
  const col6 = crypto.randomUUID()
  const col7 = crypto.randomUUID()
  const col8 = crypto.randomUUID()
  const now = new Date().toISOString()

  const spaces: Space[] = [
    { id: spaceId, name: 'Team Space', color: '#6366f1', icon: '🚀', description: '', position: 0, createdAt: now },
  ]

  const projects: Project[] = [
    { id: project1, spaceId, name: 'Project 1', description: 'Main development board', color: '#6366f1', icon: '📋', status: 'active', position: 0, createdAt: now },
    { id: project2, spaceId, name: 'Project 2', description: 'Design tasks', color: '#8b5cf6', icon: '🎨', status: 'active', position: 1, createdAt: now },
  ]

  const columns: Column[] = [
    { id: col1, projectId: project1, name: 'To Do',       color: '#64748b', position: 0, isDone: false },
    { id: col2, projectId: project1, name: 'In Progress', color: '#3b82f6', position: 1, isDone: false },
    { id: col3, projectId: project1, name: 'In Review',   color: '#8b5cf6', position: 2, isDone: false },
    { id: col4, projectId: project1, name: 'Done',        color: '#10b981', position: 3, isDone: true  },
    { id: col5, projectId: project2, name: 'To Do',       color: '#64748b', position: 0, isDone: false },
    { id: col6, projectId: project2, name: 'In Progress', color: '#f59e0b', position: 1, isDone: false },
    { id: col7, projectId: project2, name: 'Review',      color: '#8b5cf6', position: 2, isDone: false },
    { id: col8, projectId: project2, name: 'Complete',    color: '#10b981', position: 3, isDone: true  },
  ]

  const tasks: Task[] = [
    {
      id: crypto.randomUUID(), spaceId, projectId: project1, columnId: col1,
      title: 'Set up project structure', description: 'Initialize the repository and set up folder structure.',
      priority: 'high', labels: ['backend', 'devops'], dueDate: null, position: 0, isCompleted: false,
      subtasks: [
        { id: crypto.randomUUID(), title: 'Create repo', completed: true },
        { id: crypto.randomUUID(), title: 'Setup CI/CD', completed: false },
      ],
      comments: [], estimatedHours: 4, assigneeName: 'Dev', attachments: [], createdAt: now, updatedAt: now,
    },
    {
      id: crypto.randomUUID(), spaceId, projectId: project1, columnId: col1,
      title: 'Design database schema', description: 'Plan and document the database tables.',
      priority: 'urgent', labels: ['backend', 'docs'], dueDate: null, position: 1, isCompleted: false,
      subtasks: [], comments: [], estimatedHours: 3, attachments: [], createdAt: now, updatedAt: now,
    },
    {
      id: crypto.randomUUID(), spaceId, projectId: project1, columnId: col2,
      title: 'Build authentication flow', description: 'Implement login, register, and session management.',
      priority: 'urgent', labels: ['frontend', 'backend'], dueDate: null, position: 0, isCompleted: false,
      subtasks: [
        { id: crypto.randomUUID(), title: 'Login page', completed: true },
        { id: crypto.randomUUID(), title: 'Register page', completed: true },
        { id: crypto.randomUUID(), title: 'Session handling', completed: false },
      ],
      comments: [
        { id: crypto.randomUUID(), text: 'Using Supabase Auth', authorName: 'Alice', createdAt: now },
      ],
      estimatedHours: 8, attachments: [], createdAt: now, updatedAt: now,
    },
    {
      id: crypto.randomUUID(), spaceId, projectId: project2, columnId: col5,
      title: 'Create wireframes', description: 'Design low-fi wireframes for main screens.',
      priority: 'medium', labels: ['design'], dueDate: null, position: 0, isCompleted: false,
      subtasks: [], comments: [], estimatedHours: 6, attachments: [], createdAt: now, updatedAt: now,
    },
  ]

  return { spaces, projects, columns, tasks }
}

// ── localStorage ──────────────────────────────────────────────
const LS_KEY = 'blanze_taskboard_v2'

export interface PersistedBoard {
  spaces: Space[]
  projects: Project[]
  columns: Column[]
  tasks: Task[]
  activeSpaceId: string | null
  activeProjectId: string | null
  view: 'kanban' | 'list'
}

export function loadBoardState(): PersistedBoard | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedBoard
  } catch { return null }
}

export function saveBoardState(s: PersistedBoard) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)) } catch {}
}
