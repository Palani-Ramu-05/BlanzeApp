import { useState, useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, MoreHorizontal, Pencil, Trash2, Check, X, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import {
  addTaskAsync, updateColumnAsync, deleteColumnAsync, setActiveTask,
} from '../store/taskboardSlice'
import { TaskCard } from './TaskCard'
import { cn } from '@utils/index'
import type { Column, Task } from '../dto/types/taskboard.types'
import { COLUMN_COLORS } from '../dto/types/taskboard.types'

interface Props {
  column: Column
  tasks: Task[]
  projectId: string
  spaceId: string
}

export function KanbanColumn({ column, tasks, projectId, spaceId }: Props) {
  const dispatch = useAppDispatch()
  const { columns } = useAppSelector(s => s.taskboard)
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const projectColumns = [...columns.filter(c => c.projectId === projectId)].sort((a, b) => a.position - b.position)
  const colIndex       = projectColumns.findIndex(c => c.id === column.id)

  const moveColumnLeft = () => {
    if (colIndex <= 0) return
    const prev = projectColumns[colIndex - 1]
    dispatch(updateColumnAsync({ id: column.id, changes: { position: prev.position } }))
    dispatch(updateColumnAsync({ id: prev.id, changes: { position: column.position } }))
  }
  const moveColumnRight = () => {
    if (colIndex >= projectColumns.length - 1) return
    const next = projectColumns[colIndex + 1]
    dispatch(updateColumnAsync({ id: column.id, changes: { position: next.position } }))
    dispatch(updateColumnAsync({ id: next.id, changes: { position: column.position } }))
  }

  const [showMenu, setShowMenu]     = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal]       = useState(column.name)
  const [addingTask, setAddingTask] = useState(false)
  const [taskTitle, setTaskTitle]   = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const completedCount = tasks.filter(t => t.isCompleted).length

  const handleRename = () => {
    if (nameVal.trim() && nameVal !== column.name) {
      dispatch(updateColumnAsync({ id: column.id, changes: { name: nameVal.trim() } }))
    }
    setEditingName(false)
    setShowMenu(false)
  }

  const handleColorChange = (color: string) => {
    dispatch(updateColumnAsync({ id: column.id, changes: { color } }))
    setShowColorPicker(false)
    setShowMenu(false)
  }

  const handleToggleDone = () => {
    dispatch(updateColumnAsync({ id: column.id, changes: { isDone: !column.isDone } }))
    setShowMenu(false)
  }

  const handleDeleteColumn = () => {
    dispatch(deleteColumnAsync(column.id))
    setShowMenu(false)
  }

  const handleAddTask = async () => {
    if (!taskTitle.trim()) { setAddingTask(false); return }
    await dispatch(addTaskAsync({ title: taskTitle.trim(), columnId: column.id, projectId, spaceId }))
    setTaskTitle('')
    setAddingTask(false)
  }

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddTask()
    if (e.key === 'Escape') { setAddingTask(false); setTaskTitle('') }
  }

  const sortedTasks = [...tasks].sort((a, b) => a.position - b.position)

  return (
    <div className="flex-shrink-0 flex flex-col w-[272px] max-h-full">
      {/* ── Column header ── */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-xl bg-surface-800/40 border border-surface-700/50 border-b-0">
        {/* Status dot */}
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />

        {/* Title */}
        {editingName ? (
          <input autoFocus value={nameVal} onChange={e => setNameVal(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') { setNameVal(column.name); setEditingName(false) } }}
            className="flex-1 bg-transparent text-xs font-semibold text-white outline-none border-b border-brand-500" />
        ) : (
          <span className="flex-1 text-xs font-semibold text-slate-200 truncate uppercase tracking-wide">{column.name}</span>
        )}

        {/* Task count */}
        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0',
          column.isDone ? 'bg-green-500/15 text-green-400' : 'bg-surface-700 text-surface-400')}>
          {tasks.length}
        </span>

        {/* Done indicator */}
        {column.isDone && <CheckCircle2 size={12} className="text-green-400 flex-shrink-0" />}

        {/* Column menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowMenu(v => !v)}
            className="w-5 h-5 rounded flex items-center justify-center text-surface-600 hover:text-white hover:bg-surface-700 transition-colors">
            <MoreHorizontal size={12} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => { setShowMenu(false); setShowColorPicker(false) }} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-6 bg-surface-800 border border-surface-700 rounded-xl shadow-2xl py-1.5 z-50 min-w-[160px]"
                >
                  <button onClick={() => { setEditingName(true); setShowMenu(false) }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-surface-300 hover:bg-surface-700 hover:text-white transition-colors">
                    <Pencil size={11} /> Rename
                  </button>
                  <div className="flex gap-1 px-3 py-1.5">
                    <button onClick={() => { moveColumnLeft(); setShowMenu(false) }} disabled={colIndex <= 0}
                      className="flex-1 flex items-center justify-center gap-1 text-[10px] text-surface-400 hover:text-white hover:bg-surface-700 rounded-lg py-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      <ChevronLeft size={11} /> Move left
                    </button>
                    <button onClick={() => { moveColumnRight(); setShowMenu(false) }} disabled={colIndex >= projectColumns.length - 1}
                      className="flex-1 flex items-center justify-center gap-1 text-[10px] text-surface-400 hover:text-white hover:bg-surface-700 rounded-lg py-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      Move right <ChevronRight size={11} />
                    </button>
                  </div>
                  <button onClick={() => setShowColorPicker(v => !v)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-surface-300 hover:bg-surface-700 hover:text-white transition-colors">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} /> Change Color
                  </button>
                  {showColorPicker && (
                    <div className="px-3 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        {COLUMN_COLORS.map(c => (
                          <button key={c} onClick={() => handleColorChange(c)}
                            className={cn('w-4 h-4 rounded-full transition-transform hover:scale-110', column.color === c && 'ring-2 ring-white ring-offset-1 ring-offset-surface-800')}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={handleToggleDone}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-surface-300 hover:bg-surface-700 hover:text-white transition-colors">
                    <CheckCircle2 size={11} /> {column.isDone ? 'Unmark as Done' : 'Mark as Done status'}
                  </button>
                  <div className="h-px bg-surface-700 my-1" />
                  <button onClick={handleDeleteColumn}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-surface-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                    <Trash2 size={11} /> Delete Column
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Cards area (scrollable) ── */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 overflow-y-auto no-scrollbar min-h-[80px] px-1.5 py-1.5 bg-surface-800/20 border-x border-surface-700/50 transition-colors',
          isOver && 'bg-brand-600/5',
        )}
      >
        <SortableContext items={sortedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {sortedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => dispatch(setActiveTask(task.id))}
              />
            ))}
          </div>
        </SortableContext>

        {tasks.length === 0 && !addingTask && (
          <div className="flex items-center justify-center h-20 text-[10px] text-surface-700 text-center">
            Drop tasks here
          </div>
        )}
      </div>

      {/* ── Add task (bottom) ── */}
      <div className="border border-t-0 border-surface-700/50 rounded-b-xl bg-surface-800/20 px-1.5 pb-1.5">
        <AnimatePresence>
          {addingTask && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden pt-1.5"
            >
              <div className="bg-surface-800 border border-surface-600 rounded-lg p-2">
                <input
                  ref={inputRef}
                  autoFocus
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  onKeyDown={handleAddKeyDown}
                  placeholder="Task name…"
                  className="w-full bg-transparent text-xs text-slate-200 placeholder:text-surface-600 outline-none mb-2"
                />
                <div className="flex items-center gap-1">
                  <button onClick={handleAddTask}
                    className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors">
                    <Check size={10} /> Add Task
                  </button>
                  <button onClick={() => { setAddingTask(false); setTaskTitle('') }}
                    className="flex items-center gap-1 text-[10px] px-2 py-1 text-surface-400 hover:text-white border border-surface-700 rounded-lg transition-colors">
                    <X size={10} /> Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => { setAddingTask(true); setTimeout(() => inputRef.current?.focus(), 50) }}
          className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-surface-500 hover:text-white hover:bg-surface-700/40 rounded-lg transition-colors mt-0.5"
        >
          <Plus size={12} /> Add Task
        </button>
      </div>
    </div>
  )
}
