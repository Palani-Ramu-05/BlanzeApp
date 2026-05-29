import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { type Task, type Priority, DEFAULT_BOARD, type TaskBoardState, type SubTask, type TaskComment } from '../dto/types/taskboard.types'
import { arrayMove } from '@dnd-kit/sortable'
import { taskboardService } from '../services/taskboard.service'
import { supabase } from '@core/config/supabaseClient'

const STORAGE_KEY = 'blanze_taskboard'

function loadBoardLocal(): typeof DEFAULT_BOARD {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : DEFAULT_BOARD
  } catch { return DEFAULT_BOARD }
}

function saveLocal(tasks: Task[]) {
  try {
    const board = { ...DEFAULT_BOARD, tasks }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board))
  } catch {}
}

const initialState: TaskBoardState = {
  board: loadBoardLocal(),
  isLoading: false,
  activeTaskId: null,
  filterPriority: 'all',
  filterLabel: 'all',
  searchQuery: '',
  view: 'kanban',
}

// ── Async thunks ──────────────────────────────────────────────

/** Load all tasks from Supabase on app init */
export const fetchTasksFromSupabase = createAsyncThunk(
  'taskboard/fetchFromSupabase',
  async (_, { rejectWithValue }) => {
    try {
      return await taskboardService.fetchTasks()
    } catch (err) {
      return rejectWithValue((err as Error).message)
    }
  },
)

export const addTaskAsync = createAsyncThunk(
  'taskboard/addTaskAsync',
  async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, { getState }) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await taskboardService.createTask(newTask, user.id)
    return newTask
  },
)

export const updateTaskAsync = createAsyncThunk(
  'taskboard/updateTaskAsync',
  async ({ id, changes }: { id: string; changes: Partial<Task> }) => {
    await taskboardService.updateTask(id, { ...changes, updatedAt: new Date().toISOString() })
    return { id, changes }
  },
)

export const deleteTaskAsync = createAsyncThunk(
  'taskboard/deleteTaskAsync',
  async (id: string) => {
    await taskboardService.deleteTask(id)
    return id
  },
)

export const moveTaskAsync = createAsyncThunk(
  'taskboard/moveTaskAsync',
  async ({ taskId, toColumnId }: { taskId: string; toColumnId: string }) => {
    await taskboardService.moveTask(taskId, toColumnId)
    return { taskId, toColumnId }
  },
)

// ── Slice ─────────────────────────────────────────────────────
const taskboardSlice = createSlice({
  name: 'taskboard',
  initialState,
  reducers: {
    // Kept for compatibility (used by DnD which needs to be synchronous)
    addTask(state, action: PayloadAction<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) {
      const task: Task = {
        ...action.payload,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      state.board.tasks.push(task)
      saveLocal(state.board.tasks)
    },

    updateTask(state, action: PayloadAction<{ id: string; changes: Partial<Task> }>) {
      const idx = state.board.tasks.findIndex(t => t.id === action.payload.id)
      if (idx !== -1) {
        state.board.tasks[idx] = {
          ...state.board.tasks[idx],
          ...action.payload.changes,
          updatedAt: new Date().toISOString(),
        }
        saveLocal(state.board.tasks)
      }
    },

    deleteTask(state, action: PayloadAction<string>) {
      state.board.tasks = state.board.tasks.filter(t => t.id !== action.payload)
      saveLocal(state.board.tasks)
    },

    moveTask(state, action: PayloadAction<{ taskId: string; toColumnId: string }>) {
      const task = state.board.tasks.find(t => t.id === action.payload.taskId)
      if (task) {
        task.columnId = action.payload.toColumnId
        task.updatedAt = new Date().toISOString()
        saveLocal(state.board.tasks)
        // Async sync to Supabase
        taskboardService.moveTask(action.payload.taskId, action.payload.toColumnId)
      }
    },

    reorderTasks(state, action: PayloadAction<{ columnId: string; activeId: string; overId: string }>) {
      const { columnId, activeId, overId } = action.payload
      const colTasks = state.board.tasks.filter(t => t.columnId === columnId)
      const ai = colTasks.findIndex(t => t.id === activeId)
      const oi = colTasks.findIndex(t => t.id === overId)
      if (ai !== -1 && oi !== -1) {
        const reordered = arrayMove(colTasks, ai, oi)
        reordered.forEach((t, i) => {
          const idx = state.board.tasks.findIndex(bt => bt.id === t.id)
          if (idx !== -1) state.board.tasks[idx].position = i
        })
        saveLocal(state.board.tasks)
        // Sync positions
        reordered.forEach((t, i) => {
          taskboardService.updateTask(t.id, { position: i })
        })
      }
    },

    toggleSubtask(state, action: PayloadAction<{ taskId: string; subtaskId: string }>) {
      const task = state.board.tasks.find(t => t.id === action.payload.taskId)
      if (task) {
        const st = task.subtasks.find((s: SubTask) => s.id === action.payload.subtaskId)
        if (st) st.completed = !st.completed
        task.updatedAt = new Date().toISOString()
        saveLocal(state.board.tasks)
        taskboardService.updateTask(task.id, { subtasks: task.subtasks })
      }
    },

    addSubtask(state, action: PayloadAction<{ taskId: string; title: string }>) {
      const task = state.board.tasks.find(t => t.id === action.payload.taskId)
      if (task) {
        const st: SubTask = { id: crypto.randomUUID(), title: action.payload.title, completed: false }
        task.subtasks.push(st)
        task.updatedAt = new Date().toISOString()
        saveLocal(state.board.tasks)
        taskboardService.updateTask(task.id, { subtasks: task.subtasks })
      }
    },

    addComment(state, action: PayloadAction<{ taskId: string; text: string; authorName: string }>) {
      const task = state.board.tasks.find(t => t.id === action.payload.taskId)
      if (task) {
        const comment: TaskComment = {
          id: crypto.randomUUID(),
          text: action.payload.text,
          authorName: action.payload.authorName,
          createdAt: new Date().toISOString(),
        }
        task.comments.push(comment)
        task.updatedAt = new Date().toISOString()
        saveLocal(state.board.tasks)
        taskboardService.updateTask(task.id, { comments: task.comments })
      }
    },

    setActiveTask(state, action: PayloadAction<string | null>) {
      state.activeTaskId = action.payload
    },

    setFilterPriority(state, action: PayloadAction<Priority | 'all'>) {
      state.filterPriority = action.payload
    },

    setFilterLabel(state, action: PayloadAction<string | 'all'>) {
      state.filterLabel = action.payload
    },

    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload
    },

    setView(state, action: PayloadAction<'kanban' | 'list'>) {
      state.view = action.payload
    },

    resetBoard(state) {
      state.board = DEFAULT_BOARD
      saveLocal(DEFAULT_BOARD.tasks)
    },
  },

  extraReducers: (builder) => {
    builder
      // Load from Supabase
      .addCase(fetchTasksFromSupabase.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchTasksFromSupabase.fulfilled, (state, action) => {
        state.isLoading = false
        const tasks = action.payload as Task[]
        if (tasks.length > 0) {
          state.board.tasks = tasks
          saveLocal(tasks)
        }
      })
      .addCase(fetchTasksFromSupabase.rejected, (state) => {
        state.isLoading = false
        // keep localStorage data on error
      })

      // Add task
      .addCase(addTaskAsync.fulfilled, (state, action) => {
        state.board.tasks.push(action.payload)
        saveLocal(state.board.tasks)
      })

      // Update task
      .addCase(updateTaskAsync.fulfilled, (state, action) => {
        const { id, changes } = action.payload
        const idx = state.board.tasks.findIndex(t => t.id === id)
        if (idx !== -1) {
          state.board.tasks[idx] = { ...state.board.tasks[idx], ...changes, updatedAt: new Date().toISOString() }
          saveLocal(state.board.tasks)
        }
      })

      // Delete task
      .addCase(deleteTaskAsync.fulfilled, (state, action) => {
        state.board.tasks = state.board.tasks.filter(t => t.id !== action.payload)
        if (state.activeTaskId === action.payload) state.activeTaskId = null
        saveLocal(state.board.tasks)
      })

      // Move task
      .addCase(moveTaskAsync.fulfilled, (state, action) => {
        const { taskId, toColumnId } = action.payload
        const task = state.board.tasks.find(t => t.id === taskId)
        if (task) {
          task.columnId = toColumnId
          task.updatedAt = new Date().toISOString()
          saveLocal(state.board.tasks)
        }
      })
  },
})

export const {
  addTask, updateTask, deleteTask, moveTask, reorderTasks,
  toggleSubtask, addSubtask, addComment,
  setActiveTask, setFilterPriority, setFilterLabel, setSearchQuery, setView, resetBoard,
} = taskboardSlice.actions

export default taskboardSlice.reducer
