import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Trash2, Calendar, Clock, Tag, MessageSquare,
  CheckSquare, Plus, ChevronDown, User,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import {
  setActiveTask, updateTaskAsync, deleteTaskAsync,
  toggleSubtask, addSubtask, addComment,
} from '../store/taskboardSlice'
import { PRIORITY_CONFIG, LABEL_COLORS } from '../dto/types/taskboard.types'
import { cn } from '@utils/index'
import { format } from 'date-fns'

export function TaskModal() {
  const dispatch = useAppDispatch()
  const { activeTaskId, tasks, columns, projects, spaces } = useAppSelector(s => s.taskboard)
  const task = tasks.find(t => t.id === activeTaskId)

  const [title, setTitle]           = useState('')
  const [description, setDesc]      = useState('')
  const [assignee, setAssignee]     = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    if (task) { setTitle(task.title); setDesc(task.description); setAssignee(task.assigneeName ?? '') }
  }, [task?.id])

  if (!task) return null

  const column  = columns.find(c => c.id === task.columnId)
  const project = projects.find(p => p.id === task.projectId)
  const space   = spaces.find(s => s.id === task.spaceId)
  const pc      = PRIORITY_CONFIG[task.priority]

  const save = (changes: Partial<typeof task>) => {
    dispatch(updateTaskAsync({ id: task.id, changes }))
  }

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return
    dispatch(addSubtask({ taskId: task.id, title: newSubtask.trim() }))
    setNewSubtask('')
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    dispatch(addComment({ taskId: task.id, text: newComment.trim(), authorName: task.assigneeName ?? 'Me' }))
    setNewComment('')
  }

  const handleDelete = () => {
    dispatch(deleteTaskAsync(task.id))
    dispatch(setActiveTask(null))
  }

  const completedSubs = task.subtasks.filter(s => s.completed).length

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={() => dispatch(setActiveTask(null))}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 35 }}
          onClick={e => e.stopPropagation()}
          className="relative z-10 w-full max-w-xl h-full bg-surface-900 border-l border-surface-700/60 flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-surface-700/50 flex-shrink-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-[10px] text-surface-500 min-w-0">
              <span>{space?.icon}</span>
              <span className="truncate">{space?.name}</span>
              <span>/</span>
              <span style={{ color: project?.color ?? undefined }}>{project?.icon} {project?.name}</span>
              {column && (
                <>
                  <span>/</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
                    {column.name}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              <button onClick={handleDelete}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-500 hover:text-red-400 hover:bg-red-600/10 transition-all">
                <Trash2 size={13} />
              </button>
              <button onClick={() => dispatch(setActiveTask(null))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-500 hover:text-white hover:bg-surface-700 transition-all">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-5">
            {/* Title */}
            <textarea
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => title.trim() && save({ title: title.trim() })}
              className="w-full bg-transparent text-xl font-bold text-white outline-none resize-none leading-snug placeholder:text-surface-600"
              rows={2}
              placeholder="Task title"
            />

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* Status */}
              <div className="bg-surface-800/50 border border-surface-700/40 rounded-lg p-2">
                <p className="text-[9px] text-surface-600 uppercase tracking-wider mb-1">Status</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: column?.color ?? '#64748b' }} />
                  <span className="text-xs text-slate-200 font-medium">{column?.name ?? '—'}</span>
                </div>
              </div>

              {/* Priority */}
              <div className="bg-surface-800/50 border border-surface-700/40 rounded-lg p-2">
                <p className="text-[9px] text-surface-600 uppercase tracking-wider mb-1">Priority</p>
                <div className="relative">
                  <select
                    value={task.priority}
                    onChange={e => save({ priority: e.target.value as typeof task.priority })}
                    className={cn('w-full bg-transparent text-xs font-semibold appearance-none outline-none cursor-pointer pr-4', pc.color === '#ef4444' ? 'text-red-400' : pc.color === '#f59e0b' ? 'text-amber-400' : pc.color === '#3b82f6' ? 'text-blue-400' : 'text-emerald-400')}
                  >
                    <option value="urgent">🔴 Urgent</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🔵 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                  <ChevronDown size={10} className="absolute right-0 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
                </div>
              </div>

              {/* Assignee */}
              <div className="bg-surface-800/50 border border-surface-700/40 rounded-lg p-2">
                <p className="text-[9px] text-surface-600 uppercase tracking-wider mb-1">Assignee</p>
                <div className="flex items-center gap-1.5">
                  <User size={12} className="text-surface-500 flex-shrink-0" />
                  <input
                    value={assignee}
                    onChange={e => setAssignee(e.target.value)}
                    onBlur={() => save({ assigneeName: assignee || undefined })}
                    placeholder="Unassigned"
                    className="flex-1 bg-transparent text-xs text-slate-300 placeholder:text-surface-600 outline-none min-w-0"
                  />
                </div>
              </div>

              {/* Due date */}
              <div className="bg-surface-800/50 border border-surface-700/40 rounded-lg p-2">
                <p className="text-[9px] text-surface-600 uppercase tracking-wider mb-1">Due Date</p>
                <input
                  type="date"
                  value={task.dueDate ?? ''}
                  onChange={e => save({ dueDate: e.target.value || null })}
                  className="bg-transparent text-xs text-slate-300 outline-none cursor-pointer w-full"
                />
              </div>

              {/* Est. hours */}
              <div className="bg-surface-800/50 border border-surface-700/40 rounded-lg p-2">
                <p className="text-[9px] text-surface-600 uppercase tracking-wider mb-1">Est. Hours</p>
                <div className="flex items-center gap-1">
                  <Clock size={11} className="text-surface-500" />
                  <input type="number" min={0} step={0.5}
                    value={task.estimatedHours ?? ''}
                    onChange={e => save({ estimatedHours: e.target.value ? Number(e.target.value) : undefined })}
                    className="bg-transparent text-xs text-slate-300 outline-none w-full" placeholder="—" />
                </div>
              </div>
            </div>

            {/* Labels */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag size={12} className="text-surface-500" />
                <span className="text-xs font-semibold text-surface-400">Labels</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(LABEL_COLORS).map(([label, color]) => {
                  const active = task.labels.includes(label)
                  return (
                    <button key={label}
                      onClick={() => save({ labels: active ? task.labels.filter(l => l !== label) : [...task.labels, label] })}
                      className={cn('text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all',
                        active ? 'opacity-100' : 'opacity-40 hover:opacity-70')}
                      style={{ color, borderColor: `${color}44`, backgroundColor: `${color}22` }}>
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-semibold text-surface-400 mb-2">Description</p>
              <textarea
                value={description}
                onChange={e => setDesc(e.target.value)}
                onBlur={() => save({ description })}
                placeholder="Add a description…"
                rows={4}
                className="w-full bg-surface-800/50 border border-surface-700/40 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder:text-surface-600 outline-none focus:border-brand-500/50 transition-colors resize-none"
              />
            </div>

            {/* Subtasks */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare size={12} className="text-surface-500" />
                <span className="text-xs font-semibold text-surface-400">
                  Subtasks {task.subtasks.length > 0 && `(${completedSubs}/${task.subtasks.length})`}
                </span>
              </div>

              {task.subtasks.length > 0 && (
                <div className="mb-2">
                  <div className="h-1 bg-surface-700 rounded-full mb-2">
                    <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${(completedSubs / task.subtasks.length) * 100}%` }} />
                  </div>
                  <div className="space-y-1.5">
                    {task.subtasks.map(st => (
                      <label key={st.id} className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={st.completed}
                          onChange={() => dispatch(toggleSubtask({ taskId: task.id, subtaskId: st.id }))}
                          className="w-3.5 h-3.5 rounded border-surface-600 bg-surface-800 text-brand-500 cursor-pointer accent-brand-500" />
                        <span className={cn('text-xs flex-1', st.completed ? 'line-through text-surface-600' : 'text-slate-300')}>
                          {st.title}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddSubtask() }}
                  placeholder="Add subtask…"
                  className="flex-1 bg-surface-800/50 border border-surface-700/40 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-surface-600 outline-none focus:border-brand-500/50 transition-colors" />
                <button onClick={handleAddSubtask}
                  className="w-7 h-7 rounded-lg bg-surface-700 hover:bg-brand-600 flex items-center justify-center text-surface-400 hover:text-white transition-all">
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {/* Comments */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={12} className="text-surface-500" />
                <span className="text-xs font-semibold text-surface-400">Comments ({task.comments.length})</span>
              </div>

              {task.comments.length > 0 && (
                <div className="space-y-2 mb-3">
                  {task.comments.map(c => (
                    <div key={c.id} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-600/20 border border-brand-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[8px] font-bold text-brand-400">{c.authorName.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 bg-surface-800/50 border border-surface-700/40 rounded-lg px-2.5 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold text-slate-300">{c.authorName}</span>
                          <span className="text-[10px] text-surface-600">{format(new Date(c.createdAt), 'MMM d, HH:mm')}</span>
                        </div>
                        <p className="text-xs text-slate-300">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <input value={newComment} onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddComment() }}
                  placeholder="Write a comment…"
                  className="flex-1 bg-surface-800/50 border border-surface-700/40 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-surface-600 outline-none focus:border-brand-500/50 transition-colors" />
                <button onClick={handleAddComment}
                  className="w-7 h-7 rounded-lg bg-surface-700 hover:bg-brand-600 flex items-center justify-center text-surface-400 hover:text-white transition-all">
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {/* Footer meta */}
            <div className="text-[10px] text-surface-700 space-y-0.5">
              <p>Created {format(new Date(task.createdAt), 'MMMM d, yyyy')}</p>
              <p>Updated {format(new Date(task.updatedAt), 'MMM d, yyyy · HH:mm')}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
