import { motion, AnimatePresence } from 'framer-motion'
import { Search, LayoutGrid, List, SlidersHorizontal } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { setFilterPriority, setFilterLabel, setSearchQuery, setView, addTaskAsync } from '../store/taskboardSlice'
import { type Priority, PRIORITY_CONFIG, LABEL_COLORS } from '../dto/types/taskboard.types'
import { KanbanBoard } from '../components/KanbanBoard'
import { TaskModal } from '../components/TaskModal'
import { cn } from '@utils/index'

export function TaskBoardPage() {
  const dispatch = useAppDispatch()
  const { board, activeTaskId, filterPriority, filterLabel, searchQuery, view } = useAppSelector(s => s.taskboard)
  const { user } = useAppSelector(s => s.auth)

  const totalTasks = board.tasks.length
  const completedTasks = board.tasks.filter(t => t.isCompleted || t.columnId === 'done').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-5"
    >
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3 flex-shrink-0">
        <div>
          <h1 className="text-xl font-black" style={{ color: 'rgb(var(--color-text-primary))' }}>Task Board</h1>
          <p className="text-xs text-surface-400 mt-0.5">
            {completedTasks}/{totalTasks} tasks completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(addTaskAsync({
              title: 'New task',
              description: '',
              priority: 'medium',
              labels: [],
              dueDate: null,
              columnId: 'backlog',
              position: 0,
              isCompleted: false,
              subtasks: [],
              comments: [],
              attachments: [],
              assigneeName: user?.name,
            }))}
            className="btn-primary text-sm py-2 px-4"
          >
            + New Task
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-surface-500">Overall Progress</span>
          <span className="text-xs font-semibold text-surface-300">
            {totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0}%
          </span>
        </div>
        <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-600 to-emerald-500 rounded-full"
            animate={{ width: `${totalTasks ? (completedTasks / totalTasks) * 100 : 0}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>

      {/* Filters & search toolbar */}
      <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            value={searchQuery}
            onChange={e => dispatch(setSearchQuery(e.target.value))}
            placeholder="Search tasks..."
            className="input-base pl-9 text-sm py-2"
          />
        </div>

        {/* Priority filter */}
        <div className="flex gap-1 bg-surface-900/60 border border-surface-700 rounded-xl p-1">
          <button
            onClick={() => dispatch(setFilterPriority('all'))}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-lg transition-all',
              filterPriority === 'all' ? 'bg-surface-700 text-white' : 'text-surface-400 hover:text-white'
            )}>All</button>
          {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => (
            <button key={p} onClick={() => dispatch(setFilterPriority(p))}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-lg transition-all capitalize',
                filterPriority === p ? 'text-white' : 'text-surface-400 hover:text-white'
              )}
              style={{ backgroundColor: filterPriority === p ? `${PRIORITY_CONFIG[p].color}30` : undefined }}>
              {p}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-surface-900/60 border border-surface-700 rounded-xl p-1">
          <button onClick={() => dispatch(setView('kanban'))}
            className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-all',
              view === 'kanban' ? 'bg-surface-700 text-white' : 'text-surface-400 hover:text-white')}>
            <LayoutGrid size={14} />
          </button>
          <button onClick={() => dispatch(setView('list'))}
            className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-all',
              view === 'list' ? 'bg-surface-700 text-white' : 'text-surface-400 hover:text-white')}>
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="w-full overflow-x-auto">
        <AnimatePresence mode="wait">
          {view === 'kanban' ? (
            <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <KanbanBoard />
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full overflow-y-auto no-scrollbar">
              <div className="flex flex-col gap-2">
                {board.tasks.map(task => (
                  <div key={task.id}
                    onClick={() => dispatch({ type: 'taskboard/setActiveTask', payload: task.id })}
                    className="flex items-center gap-4 p-3 bg-surface-900 border border-surface-700 rounded-xl hover:border-surface-600 cursor-pointer transition-all"
                    style={{ boxShadow: 'var(--shadow-card)' }}>
                    <div className="w-1.5 h-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PRIORITY_CONFIG[task.priority].color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'rgb(var(--color-text-primary))' }}>{task.title}</p>
                      {task.description && <p className="text-xs text-surface-500 truncate">{task.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {task.labels.slice(0, 2).map(l => (
                        <span key={l} className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
                          style={{ backgroundColor: `${LABEL_COLORS[l] ?? '#64748b'}20`, color: LABEL_COLORS[l] ?? '#94a3b8' }}>
                          {l}
                        </span>
                      ))}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: `${PRIORITY_CONFIG[task.priority].color}20`, color: PRIORITY_CONFIG[task.priority].color }}>
                        {task.priority}
                      </span>
                      <span className="text-[10px] text-surface-400 bg-surface-800 px-2 py-0.5 rounded-md capitalize">
                        {board.columns.find(c => c.id === task.columnId)?.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Task modal */}
      {activeTaskId && <TaskModal taskId={activeTaskId} />}
    </motion.div>
  )
}
