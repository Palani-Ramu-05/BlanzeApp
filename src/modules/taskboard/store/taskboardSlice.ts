import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import {
  type Task, type Space, type Project, type Column, type Priority, type TaskBoardState,
  makeSeedData, loadBoardState, saveBoardState,
} from '../dto/types/taskboard.types'
import { taskboardService } from '../services/taskboard.service'
import { supabase } from '@core/config/supabaseClient'

// ── Bootstrap ─────────────────────────────────────────────────
const saved = loadBoardState()
const seed  = makeSeedData()

function buildInitial(): TaskBoardState {
  if (saved) {
    return {
      spaces: saved.spaces, projects: saved.projects,
      columns: saved.columns, tasks: saved.tasks,
      activeSpaceId: saved.activeSpaceId, activeProjectId: saved.activeProjectId,
      activeTaskId: null, filterPriority: 'all', filterLabel: 'all',
      searchQuery: '', view: saved.view ?? 'kanban', isLoading: false,
    }
  }
  return {
    spaces: seed.spaces, projects: seed.projects,
    columns: seed.columns, tasks: seed.tasks,
    activeSpaceId: seed.spaces[0]?.id ?? null,
    activeProjectId: seed.projects[0]?.id ?? null,
    activeTaskId: null, filterPriority: 'all', filterLabel: 'all',
    searchQuery: '', view: 'kanban', isLoading: false,
  }
}

function persist(state: TaskBoardState) {
  saveBoardState({
    spaces: state.spaces, projects: state.projects,
    columns: state.columns, tasks: state.tasks,
    activeSpaceId: state.activeSpaceId, activeProjectId: state.activeProjectId,
    view: state.view,
  })
}

// ── Async thunks ──────────────────────────────────────────────

export const loadBoardFromSupabase = createAsyncThunk('taskboard/load', async (_, { rejectWithValue }) => {
  try {
    const [spaces, projects, columns, tasks] = await Promise.all([
      taskboardService.fetchSpaces(),
      taskboardService.fetchProjects(),
      taskboardService.fetchColumns(),
      taskboardService.fetchTasks(),
    ])
    return { spaces, projects, columns, tasks }
  } catch (err) {
    return rejectWithValue((err as Error).message)
  }
})

export const createSpaceAsync = createAsyncThunk('taskboard/createSpace',
  async (payload: { name: string; color: string; icon: string }) => {
    const space: Space = { id: crypto.randomUUID(), name: payload.name, color: payload.color, icon: payload.icon, description: '', position: 0, createdAt: new Date().toISOString() }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await taskboardService.createSpace(space, user.id)
    return space
  })

export const updateSpaceAsync = createAsyncThunk('taskboard/updateSpace',
  async (payload: { id: string; changes: Partial<Pick<Space, 'name' | 'color' | 'icon'>> }) => {
    await taskboardService.updateSpace(payload.id, payload.changes)
    return payload
  })

export const deleteSpaceAsync = createAsyncThunk('taskboard/deleteSpace', async (id: string) => {
  await taskboardService.deleteSpace(id)
  return id
})

export const createProjectAsync = createAsyncThunk('taskboard/createProject',
  async (payload: { spaceId: string; name: string; color: string; icon: string }, { getState }) => {
    const state = (getState() as { taskboard: TaskBoardState }).taskboard
    const pos = state.projects.filter(p => p.spaceId === payload.spaceId).length
    const project: Project = { id: crypto.randomUUID(), spaceId: payload.spaceId, name: payload.name, description: '', color: payload.color, icon: payload.icon, status: 'active', position: pos, createdAt: new Date().toISOString() }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await taskboardService.createProject(project, user.id)

    // Create default columns for this project
    const defaultCols = [
      { name: 'To Do',       color: '#64748b', isDone: false },
      { name: 'In Progress', color: '#3b82f6', isDone: false },
      { name: 'In Review',   color: '#8b5cf6', isDone: false },
      { name: 'Done',        color: '#10b981', isDone: true  },
    ]
    const columns: Column[] = defaultCols.map((c, i) => ({ id: crypto.randomUUID(), projectId: project.id, name: c.name, color: c.color, position: i, isDone: c.isDone }))
    if (user) { for (const col of columns) await taskboardService.createColumn(col, user.id) }
    return { project, columns }
  })

export const updateProjectAsync = createAsyncThunk('taskboard/updateProject',
  async (payload: { id: string; changes: Partial<Pick<Project, 'name' | 'color' | 'icon' | 'description'>> }) => {
    await taskboardService.updateProject(payload.id, payload.changes)
    return payload
  })

export const deleteProjectAsync = createAsyncThunk('taskboard/deleteProject', async (id: string) => {
  await taskboardService.deleteProject(id)
  return id
})

export const createColumnAsync = createAsyncThunk('taskboard/createColumn',
  async (payload: { projectId: string; name: string; color: string; isDone?: boolean }, { getState }) => {
    const state = (getState() as { taskboard: TaskBoardState }).taskboard
    const pos = state.columns.filter(c => c.projectId === payload.projectId).length
    const col: Column = { id: crypto.randomUUID(), projectId: payload.projectId, name: payload.name, color: payload.color, position: pos, isDone: payload.isDone ?? false }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await taskboardService.createColumn(col, user.id)
    return col
  })

export const updateColumnAsync = createAsyncThunk('taskboard/updateColumn',
  async (payload: { id: string; changes: Partial<Pick<Column, 'name' | 'color' | 'position' | 'isDone'>> }) => {
    await taskboardService.updateColumn(payload.id, payload.changes)
    return payload
  })

export const deleteColumnAsync = createAsyncThunk('taskboard/deleteColumn', async (id: string) => {
  await taskboardService.deleteColumn(id)
  return id
})

export const addTaskAsync = createAsyncThunk('taskboard/addTask',
  async (payload: { title: string; columnId: string; projectId: string; spaceId: string }, { getState }) => {
    const state = (getState() as { taskboard: TaskBoardState }).taskboard
    const pos = state.tasks.filter(t => t.columnId === payload.columnId).length
    const task: Task = {
      id: crypto.randomUUID(), spaceId: payload.spaceId, projectId: payload.projectId,
      columnId: payload.columnId, title: payload.title, description: '', priority: 'medium',
      labels: [], dueDate: null, position: pos, isCompleted: false, subtasks: [], comments: [],
      attachments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) { task.assigneeName = user.email?.split('@')[0] ?? 'Me'; await taskboardService.createTask(task, user.id) }
    return task
  })

export const updateTaskAsync = createAsyncThunk('taskboard/updateTask',
  async (payload: { id: string; changes: Partial<Task> }) => {
    await taskboardService.updateTask(payload.id, payload.changes)
    return payload
  })

export const deleteTaskAsync = createAsyncThunk('taskboard/deleteTask', async (id: string) => {
  await taskboardService.deleteTask(id)
  return id
})

// ── Slice ─────────────────────────────────────────────────────
const taskboardSlice = createSlice({
  name: 'taskboard',
  initialState: buildInitial(),
  reducers: {
    setActiveSpace(state, action: PayloadAction<string | null>) {
      state.activeSpaceId = action.payload
      const firstProject = state.projects.find(p => p.spaceId === action.payload && p.status === 'active')
      state.activeProjectId = firstProject?.id ?? null
      persist(state)
    },
    setActiveProject(state, action: PayloadAction<string | null>) {
      state.activeProjectId = action.payload
      persist(state)
    },
    setActiveTask(state, action: PayloadAction<string | null>) {
      state.activeTaskId = action.payload
    },
    setView(state, action: PayloadAction<'kanban' | 'list'>) {
      state.view = action.payload
      persist(state)
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload
    },
    setFilterPriority(state, action: PayloadAction<Priority | 'all'>) {
      state.filterPriority = action.payload
    },
    setFilterLabel(state, action: PayloadAction<string | 'all'>) {
      state.filterLabel = action.payload
    },

    // ── Drag-and-drop (optimistic + fire-and-forget) ──
    moveTask(state, action: PayloadAction<{ taskId: string; columnId: string; position: number }>) {
      const { taskId, columnId, position } = action.payload
      const task = state.tasks.find(t => t.id === taskId)
      if (!task) return
      task.columnId    = columnId
      task.position    = position
      task.isCompleted = state.columns.find(c => c.id === columnId)?.isDone ?? false
      persist(state)
      taskboardService.updateTask(taskId, { columnId, position, isCompleted: task.isCompleted })
    },

    reorderTasks(state, action: PayloadAction<{ projectId: string; columnId: string; orderedIds: string[] }>) {
      const { columnId, orderedIds } = action.payload
      orderedIds.forEach((id, idx) => {
        const t = state.tasks.find(t => t.id === id)
        if (t) { t.position = idx }
      })
      persist(state)
      orderedIds.forEach((id, idx) => taskboardService.updateTask(id, { position: idx }))
    },

    toggleSubtask(state, action: PayloadAction<{ taskId: string; subtaskId: string }>) {
      const task = state.tasks.find(t => t.id === action.payload.taskId)
      if (!task) return
      const st = task.subtasks.find(s => s.id === action.payload.subtaskId)
      if (st) { st.completed = !st.completed }
      persist(state)
      taskboardService.updateTask(task.id, { subtasks: task.subtasks })
    },

    addSubtask(state, action: PayloadAction<{ taskId: string; title: string }>) {
      const task = state.tasks.find(t => t.id === action.payload.taskId)
      if (!task) return
      task.subtasks.push({ id: crypto.randomUUID(), title: action.payload.title, completed: false })
      persist(state)
      taskboardService.updateTask(task.id, { subtasks: task.subtasks })
    },

    addComment(state, action: PayloadAction<{ taskId: string; text: string; authorName: string }>) {
      const task = state.tasks.find(t => t.id === action.payload.taskId)
      if (!task) return
      task.comments.push({ id: crypto.randomUUID(), text: action.payload.text, authorName: action.payload.authorName, createdAt: new Date().toISOString() })
      persist(state)
      taskboardService.updateTask(task.id, { comments: task.comments })
    },
  },

  extraReducers: (builder) => {
    // Load
    builder.addCase(loadBoardFromSupabase.pending, (state) => { state.isLoading = true })
    builder.addCase(loadBoardFromSupabase.rejected, (state) => { state.isLoading = false })
    builder.addCase(loadBoardFromSupabase.fulfilled, (state, { payload }) => {
      state.isLoading = false
      const { spaces, projects, columns, tasks } = payload as { spaces: Space[]; projects: Project[]; columns: Column[]; tasks: Task[] }
      if (spaces.length === 0 && projects.length === 0) return // keep seed data
      state.spaces   = spaces
      state.projects = projects
      state.columns  = columns
      state.tasks    = tasks
      if (!state.activeSpaceId || !spaces.find(s => s.id === state.activeSpaceId)) {
        state.activeSpaceId = spaces[0]?.id ?? null
      }
      if (!state.activeProjectId || !projects.find(p => p.id === state.activeProjectId)) {
        state.activeProjectId = projects.find(p => p.spaceId === state.activeSpaceId)?.id ?? null
      }
      persist(state)
    })

    // Spaces
    builder.addCase(createSpaceAsync.fulfilled, (state, { payload }) => {
      state.spaces.push(payload as Space)
      state.activeSpaceId = (payload as Space).id
      persist(state)
    })
    builder.addCase(updateSpaceAsync.fulfilled, (state, { payload }) => {
      const s = state.spaces.find(s => s.id === payload.id)
      if (s) Object.assign(s, payload.changes)
      persist(state)
    })
    builder.addCase(deleteSpaceAsync.fulfilled, (state, { payload }) => {
      // Compute affected project IDs BEFORE filtering projects
      const deletedProjectIds = state.projects.filter(p => p.spaceId === payload).map(p => p.id)
      state.spaces   = state.spaces.filter(s => s.id !== payload)
      state.projects = state.projects.filter(p => p.spaceId !== payload)
      state.columns  = state.columns.filter(c => !deletedProjectIds.includes(c.projectId))
      state.tasks    = state.tasks.filter(t => t.spaceId !== payload)
      if (state.activeSpaceId === payload) {
        state.activeSpaceId   = state.spaces[0]?.id ?? null
        state.activeProjectId = state.projects.find(p => p.spaceId === state.activeSpaceId)?.id ?? null
      }
      persist(state)
    })

    // Projects
    builder.addCase(createProjectAsync.fulfilled, (state, { payload }) => {
      const { project, columns } = payload as { project: Project; columns: Column[] }
      state.projects.push(project)
      state.columns.push(...columns)
      state.activeProjectId = project.id
      persist(state)
    })
    builder.addCase(updateProjectAsync.fulfilled, (state, { payload }) => {
      const p = state.projects.find(p => p.id === payload.id)
      if (p) Object.assign(p, payload.changes)
      persist(state)
    })
    builder.addCase(deleteProjectAsync.fulfilled, (state, { payload }) => {
      state.projects = state.projects.filter(p => p.id !== payload)
      state.columns  = state.columns.filter(c => c.projectId !== payload)
      state.tasks    = state.tasks.filter(t => t.projectId !== payload)
      if (state.activeProjectId === payload) {
        state.activeProjectId = state.projects.find(p => p.spaceId === state.activeSpaceId)?.id ?? null
      }
      persist(state)
    })

    // Columns
    builder.addCase(createColumnAsync.fulfilled, (state, { payload }) => {
      state.columns.push(payload as Column)
      persist(state)
    })
    builder.addCase(updateColumnAsync.fulfilled, (state, { payload }) => {
      const c = state.columns.find(c => c.id === payload.id)
      if (c) Object.assign(c, payload.changes)
      // Update isCompleted on tasks if isDone flag changed
      if (payload.changes.isDone !== undefined && c) {
        state.tasks.filter(t => t.columnId === c.id).forEach(t => { t.isCompleted = payload.changes.isDone! })
      }
      persist(state)
    })
    builder.addCase(deleteColumnAsync.fulfilled, (state, { payload }) => {
      const col = state.columns.find(c => c.id === payload)
      // Move orphaned tasks to the first remaining column of the same project, or delete them
      if (col) {
        const remaining = state.columns.filter(c => c.projectId === col.projectId && c.id !== payload).sort((a, b) => a.position - b.position)
        if (remaining.length > 0) {
          const firstCol = remaining[0]
          state.tasks.filter(t => t.columnId === payload).forEach(t => { t.columnId = firstCol.id })
        } else {
          state.tasks = state.tasks.filter(t => t.columnId !== payload)
        }
      }
      state.columns = state.columns.filter(c => c.id !== payload)
      persist(state)
    })

    // Tasks
    builder.addCase(addTaskAsync.fulfilled, (state, { payload }) => {
      state.tasks.push(payload as Task)
      persist(state)
    })
    builder.addCase(updateTaskAsync.fulfilled, (state, { payload }) => {
      const t = state.tasks.find(t => t.id === payload.id)
      if (t) Object.assign(t, payload.changes)
      persist(state)
    })
    builder.addCase(deleteTaskAsync.fulfilled, (state, { payload }) => {
      state.tasks = state.tasks.filter(t => t.id !== payload)
      if (state.activeTaskId === payload) state.activeTaskId = null
      persist(state)
    })
  },
})

export const {
  setActiveSpace, setActiveProject, setActiveTask, setView,
  setSearchQuery, setFilterPriority, setFilterLabel,
  moveTask, reorderTasks, toggleSubtask, addSubtask, addComment,
} = taskboardSlice.actions

export default taskboardSlice.reducer
