export type Priority = 'urgent' | 'high' | 'medium' | 'low'
export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done'

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

export interface Task {
  id: string
  title: string
  description: string
  priority: Priority
  labels: string[]
  dueDate: string | null
  columnId: string
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

export interface Column {
  id: string
  title: string
  color: string
  icon: string
  maxCards?: number
  description?: string
}

export interface Board {
  id: string
  name: string
  description: string
  columns: Column[]
  tasks: Task[]
}

export interface TaskBoardState {
  board: Board
  isLoading: boolean
  activeTaskId: string | null
  filterPriority: Priority | 'all'
  filterLabel: string | 'all'
  searchQuery: string
  view: 'kanban' | 'list'
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  urgent: { label: 'Urgent', color: '#ef4444', bg: 'bg-red-500/15', border: 'border-red-500/30' },
  high: { label: 'High', color: '#f59e0b', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  medium: { label: 'Medium', color: '#3b82f6', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  low: { label: 'Low', color: '#10b981', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
}

export const LABEL_COLORS: Record<string, string> = {
  frontend: '#3b82f6',
  backend: '#10b981',
  design: '#8b5cf6',
  bug: '#ef4444',
  feature: '#f59e0b',
  docs: '#64748b',
  testing: '#ec4899',
  devops: '#06b6d4',
}

export const DEFAULT_BOARD: Board = {
  id: 'default',
  name: 'My Board',
  description: 'Default project board',
  columns: [
    { id: 'backlog', title: 'Backlog', color: '#64748b', icon: '📋' },
    { id: 'todo', title: 'To Do', color: '#3b82f6', icon: '📝' },
    { id: 'in-progress', title: 'In Progress', color: '#f59e0b', icon: '⚡' },
    { id: 'review', title: 'In Review', color: '#8b5cf6', icon: '🔍' },
    { id: 'done', title: 'Done', color: '#10b981', icon: '✅' },
  ],
  tasks: [
    {
      id: '1', title: 'Set up project architecture', description: 'Define folder structure, install dependencies, and configure tooling.',
      priority: 'high', labels: ['frontend', 'devops'], dueDate: null, columnId: 'done',
      position: 0, isCompleted: true, subtasks: [
        { id: 's1', title: 'Create Vite config', completed: true },
        { id: 's2', title: 'Configure TypeScript', completed: true },
      ],
      comments: [], estimatedHours: 4, assigneeName: 'Alex', attachments: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: '2', title: 'Design authentication flow', description: 'Create login, signup, and password reset screens with full Supabase integration.',
      priority: 'urgent', labels: ['frontend', 'backend'], dueDate: '2026-06-15', columnId: 'done',
      position: 0, isCompleted: false, subtasks: [
        { id: 's3', title: 'Login page UI', completed: true },
        { id: 's4', title: 'Supabase integration', completed: true },
      ],
      comments: [{ id: 'c1', text: 'Looks great!', authorName: 'Sam', createdAt: new Date().toISOString() }],
      estimatedHours: 8, assigneeName: 'Taylor', attachments: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: '3', title: 'Build Dashboard Overview', description: 'Create the main dashboard with analytics widgets and quick actions.',
      priority: 'medium', labels: ['frontend', 'design'], dueDate: '2026-06-20', columnId: 'in-progress',
      position: 0, isCompleted: false, subtasks: [],
      comments: [], estimatedHours: 6, attachments: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: '4', title: 'API rate limiting', description: 'Implement proper rate limiting for all public API endpoints.',
      priority: 'high', labels: ['backend', 'devops'], dueDate: '2026-07-01', columnId: 'todo',
      position: 0, isCompleted: false, subtasks: [],
      comments: [], estimatedHours: 3, attachments: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: '5', title: 'Dark / Light theme toggle', description: 'Add full theme switching support across the entire application.',
      priority: 'low', labels: ['frontend', 'design'], dueDate: null, columnId: 'review',
      position: 0, isCompleted: false, subtasks: [
        { id: 's5', title: 'CSS variables', completed: true },
        { id: 's6', title: 'Theme context', completed: true },
        { id: 's7', title: 'Header toggle button', completed: false },
      ],
      comments: [], estimatedHours: 2, assigneeName: 'Jordan', attachments: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: '6', title: 'Write unit tests', description: 'Add comprehensive unit tests for all utility functions and hooks.',
      priority: 'medium', labels: ['testing'], dueDate: '2026-07-10', columnId: 'backlog',
      position: 0, isCompleted: false, subtasks: [],
      comments: [], estimatedHours: 12, attachments: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    },
  ]
}
