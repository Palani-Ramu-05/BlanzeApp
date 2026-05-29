import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MoreHorizontal } from 'lucide-react'
import { type Column, type Task } from '../dto/types/taskboard.types'
import { TaskCard } from './TaskCard'
import { cn } from '@utils/index'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { addTaskAsync, setActiveTask } from '../store/taskboardSlice'

interface KanbanColumnProps {
  column: Column
  tasks: Task[]
  isOver?: boolean
}

export function KanbanColumn({ column, tasks, isOver }: KanbanColumnProps) {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector(s => s.auth)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickTitle, setQuickTitle] = useState('')

  const { setNodeRef } = useDroppable({ id: column.id })

  const handleQuickAdd = () => {
    if (!quickTitle.trim()) return
    dispatch(addTaskAsync({
      title: quickTitle.trim(),
      description: '',
      priority: 'medium',
      labels: [],
      dueDate: null,
      columnId: column.id,
      position: tasks.length,
      isCompleted: column.id === 'done',
      subtasks: [],
      comments: [],
      attachments: [],
      assigneeName: user?.name,
    }))
    setQuickTitle('')
    setShowQuickAdd(false)
  }

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border transition-all min-w-[280px] flex-shrink-0 lg:flex-1',
        isOver ? 'border-brand-500/60 bg-brand-600/5' : 'border-surface-700/60 bg-surface-800/30'
      )}
      style={{ boxShadow: 'var(--shadow-card)', maxHeight: 'calc(100vh - 260px)', minHeight: '320px' }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{column.icon}</span>
          <span className="text-sm font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>{column.title}</span>
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-surface-700 text-surface-400 min-w-[20px] text-center">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowQuickAdd(v => !v)}
            className="w-6 h-6 rounded-md text-surface-400 hover:text-white hover:bg-surface-700 transition-all flex items-center justify-center">
            <Plus size={14} />
          </button>
          <button className="w-6 h-6 rounded-md text-surface-500 hover:text-white hover:bg-surface-700 transition-all flex items-center justify-center">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Column color bar */}
      <div className="h-0.5 mx-4 rounded-full mb-3" style={{ backgroundColor: column.color }} />

      {/* Quick add */}
      <AnimatePresence>
        {showQuickAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden px-3 mb-2"
          >
            <div className="bg-surface-900 border border-surface-700 rounded-xl p-2.5 flex flex-col gap-2">
              <input
                autoFocus
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleQuickAdd()
                  if (e.key === 'Escape') setShowQuickAdd(false)
                }}
                placeholder="Task title..."
                className="input-base text-xs py-1.5"
              />
              <div className="flex gap-1.5">
                <button onClick={handleQuickAdd} className="btn-primary py-1 px-3 text-xs flex-1">Add</button>
                <button onClick={() => setShowQuickAdd(false)} className="btn-ghost py-1 px-2 text-xs">✕</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tasks drop zone */}
      <div ref={setNodeRef} className="flex-1 flex flex-col gap-2 px-3 pb-3 overflow-y-auto no-scrollbar min-h-[120px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence initial={false}>
            {tasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
              >
                <TaskCard
                  task={task}
                  onClick={() => dispatch(setActiveTask(task.id))}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>

        {tasks.length === 0 && !showQuickAdd && (
          <button
            onClick={() => setShowQuickAdd(true)}
            className="flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed border-surface-700/50 text-surface-500 hover:border-surface-600 hover:text-surface-400 transition-all text-xs gap-1.5"
          >
            <Plus size={18} />
            <span>Add task</span>
          </button>
        )}
      </div>
    </div>
  )
}
