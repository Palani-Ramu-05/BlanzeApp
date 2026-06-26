import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, KanbanSquare, List, Filter,
  LayoutGrid, AlertCircle, FolderOpen, SlidersHorizontal, X,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import {
  loadBoardFromSupabase, setSearchQuery, setFilterPriority, setFilterLabel, setView,
  setActiveTask,
} from '../store/taskboardSlice'
import { TaskBoardSidebar } from '../components/TaskBoardSidebar'
import { KanbanBoard } from '../components/KanbanBoard'
import { TaskModal } from '../components/TaskModal'
import { PRIORITY_CONFIG, LABEL_COLORS } from '../dto/types/taskboard.types'
import { cn } from '@utils/index'

// ── List view ─────────────────────────────────────────────────
function ListView({ projectId }: { projectId: string }) {
  const dispatch = useAppDispatch()
  const { tasks, columns, filterPriority, filterLabel, searchQuery } = useAppSelector(s => s.taskboard)

  const projectColumns = [...columns.filter(c => c.projectId === projectId)].sort((a, b) => a.position - b.position)
  const filteredTasks  = tasks.filter(t => {
    if (t.projectId !== projectId) return false
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    if (filterLabel !== 'all' && !t.labels.includes(filterLabel)) return false
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="overflow-y-auto flex-1 px-4 py-2 no-scrollbar">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_120px_100px_100px] gap-2 px-4 py-2 text-[10px] font-semibold text-surface-600 uppercase tracking-wider border-b border-surface-700/40 sticky top-0 bg-surface-900/80 backdrop-blur-sm z-10">
        <span>Task</span><span>Status</span><span>Priority</span><span>Due</span>
      </div>
      {projectColumns.map(col => {
        const colTasks = filteredTasks.filter(t => t.columnId === col.id).sort((a, b) => a.position - b.position)
        if (colTasks.length === 0) return null
        return (
          <div key={col.id}>
            <div className="flex items-center gap-2 px-4 py-2 mt-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">{col.name}</span>
              <span className="text-[10px] text-surface-600 bg-surface-800 rounded-full px-1.5">{colTasks.length}</span>
            </div>
            {colTasks.map(task => {
              const pc = PRIORITY_CONFIG[task.priority]
              return (
                <div key={task.id}
                  onClick={() => dispatch(setActiveTask(task.id))}
                  className="grid grid-cols-[1fr_120px_100px_100px] gap-2 px-4 py-2.5 text-xs cursor-pointer hover:bg-surface-800/40 rounded-lg transition-colors items-center border-b border-surface-800/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn('w-2 h-2 rounded-full flex-shrink-0', pc.dot)} />
                    <span className={cn('truncate text-slate-200', task.isCompleted && 'line-through text-surface-600')}>{task.title}</span>
                    {task.subtasks.length > 0 && (
                      <span className="text-[10px] text-surface-600 flex-shrink-0">
                        {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="text-surface-400 truncate">{col.name}</span>
                  </div>
                  <span style={{ color: pc.color }} className="font-medium">{pc.label}</span>
                  <span className="text-surface-500">{task.dueDate ?? '—'}</span>
                </div>
              )
            })}
          </div>
        )
      })}
      {filteredTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 text-surface-500">
          <AlertCircle size={24} className="mb-2 text-surface-700" />
          <p className="text-sm">No tasks found</p>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function TaskBoardPage() {
  const dispatch = useAppDispatch()
  const { spaces, projects, columns, tasks, activeSpaceId, activeProjectId, activeTaskId, view, searchQuery, filterPriority, filterLabel, isLoading } = useAppSelector(s => s.taskboard)

  const [showFilters, setShowFilters] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => { dispatch(loadBoardFromSupabase()) }, [dispatch])

  const activeProject = projects.find(p => p.id === activeProjectId)
  const activeSpace   = spaces.find(s => s.id === activeSpaceId)

  const projectTaskCount = activeProjectId ? tasks.filter(t => t.projectId === activeProjectId).length : 0
  const doneCount        = activeProjectId ? tasks.filter(t => t.projectId === activeProjectId && t.isCompleted).length : 0
  const progress         = projectTaskCount > 0 ? Math.round((doneCount / projectTaskCount) * 100) : 0

  const hasActiveFilters = filterPriority !== 'all' || filterLabel !== 'all' || searchQuery

  return (
    <div className="flex h-full overflow-hidden bg-surface-950">
      {/* ── Left sidebar ── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 border-r border-surface-700/50 overflow-hidden"
            style={{ width: 220 }}
          >
            <TaskBoardSidebar />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex-shrink-0 px-4 py-2 border-b border-surface-700/50 bg-surface-900/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle */}
            <button onClick={() => setSidebarOpen(v => !v)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-500 hover:text-white hover:bg-surface-700 transition-all flex-shrink-0">
              <LayoutGrid size={14} />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-xs text-surface-500 min-w-0 flex-1">
              {activeSpace && (
                <>
                  <span>{activeSpace.icon}</span>
                  <span className="font-medium">{activeSpace.name}</span>
                  <span className="text-surface-700">/</span>
                </>
              )}
              {activeProject ? (
                <div className="flex items-center gap-1.5">
                  <span style={{ color: activeProject.color }}>{activeProject.icon}</span>
                  <span className="font-semibold text-slate-200">{activeProject.name}</span>
                  <span className="text-[10px] bg-surface-800 text-surface-500 px-1.5 py-0.5 rounded-full">{projectTaskCount} tasks</span>
                </div>
              ) : (
                <span className="text-surface-600">Select a project</span>
              )}
            </div>

            {/* Progress */}
            {activeProject && projectTaskCount > 0 && (
              <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                <div className="w-20 h-1.5 bg-surface-800 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[10px] text-surface-500">{progress}%</span>
              </div>
            )}

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={cn('flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border transition-all flex-shrink-0',
                showFilters || hasActiveFilters
                  ? 'border-brand-500/40 bg-brand-600/10 text-brand-400'
                  : 'border-surface-700 text-surface-500 hover:border-surface-600 hover:text-white')}>
              <SlidersHorizontal size={11} />
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />}
              Filters
            </button>

            {/* Search */}
            <div className="relative flex-shrink-0">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-surface-600 pointer-events-none" />
              <input value={searchQuery} onChange={e => dispatch(setSearchQuery(e.target.value))}
                placeholder="Search tasks…"
                className="pl-6 pr-3 py-1.5 bg-surface-800/60 border border-surface-700/60 rounded-lg text-xs text-slate-200 placeholder:text-surface-600 outline-none focus:border-brand-500/50 transition-colors w-44" />
              {searchQuery && (
                <button onClick={() => dispatch(setSearchQuery(''))} className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-600 hover:text-white">
                  <X size={10} />
                </button>
              )}
            </div>

            {/* View toggle */}
            <div className="flex items-center bg-surface-800/60 border border-surface-700 rounded-lg p-0.5 flex-shrink-0">
              <button onClick={() => dispatch(setView('kanban'))}
                className={cn('flex items-center gap-1 px-2 py-1 text-[11px] rounded-md transition-all',
                  view === 'kanban' ? 'bg-brand-600/30 text-brand-400' : 'text-surface-500 hover:text-white')}>
                <KanbanSquare size={11} /> Board
              </button>
              <button onClick={() => dispatch(setView('list'))}
                className={cn('flex items-center gap-1 px-2 py-1 text-[11px] rounded-md transition-all',
                  view === 'list' ? 'bg-brand-600/30 text-brand-400' : 'text-surface-500 hover:text-white')}>
                <List size={11} /> List
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Filter size={10} className="text-surface-600" />
                    <span className="text-[10px] text-surface-600 uppercase tracking-wider">Priority</span>
                    <select value={filterPriority} onChange={e => dispatch(setFilterPriority(e.target.value as typeof filterPriority))}
                      className="bg-surface-800 border border-surface-700 rounded-lg text-[11px] text-slate-300 px-2 py-1 outline-none cursor-pointer">
                      <option value="all">All</option>
                      {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-surface-600 uppercase tracking-wider">Label</span>
                    <select value={filterLabel} onChange={e => dispatch(setFilterLabel(e.target.value))}
                      className="bg-surface-800 border border-surface-700 rounded-lg text-[11px] text-slate-300 px-2 py-1 outline-none cursor-pointer">
                      <option value="all">All</option>
                      {Object.keys(LABEL_COLORS).map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={() => { dispatch(setFilterPriority('all')); dispatch(setFilterLabel('all')); dispatch(setSearchQuery('')) }}
                      className="text-[10px] text-red-400 hover:text-red-300 transition-colors">
                      Clear all
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Board content */}
        {!activeProject ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FolderOpen size={40} className="text-surface-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400 mb-1">No project selected</p>
              <p className="text-xs text-surface-600">Select or create a project from the sidebar</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-surface-500">Loading board…</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col pt-3">
            {view === 'kanban'
              ? <KanbanBoard projectId={activeProject.id} spaceId={activeProject.spaceId} />
              : <ListView projectId={activeProject.id} />
            }
          </div>
        )}
      </div>

      {/* Task detail modal (slide-in panel) */}
      {activeTaskId && <TaskModal />}
    </div>
  )
}
