import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, MessageSquare, Plus, Trash2, CheckSquare, Square, Clock, Tag, Flag } from 'lucide-react'
import { type Task, type Priority, PRIORITY_CONFIG, LABEL_COLORS } from '../dto/types/taskboard.types'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { updateTask, deleteTaskAsync, updateTaskAsync, toggleSubtask, addSubtask, addComment, setActiveTask } from '../store/taskboardSlice'
import { cn } from '@utils/index'
import { format } from 'date-fns'

const ALL_LABELS = Object.keys(LABEL_COLORS)

export function TaskModal({ taskId }: { taskId: string }) {
  const dispatch = useAppDispatch()
  const task = useAppSelector(s => s.taskboard.board.tasks.find(t => t.id === taskId))
  const { user } = useAppSelector(s => s.auth)

  const [editTitle, setEditTitle] = useState(task?.title ?? '')
  const [editDesc, setEditDesc] = useState(task?.description ?? '')
  const [newSubtask, setNewSubtask] = useState('')
  const [newComment, setNewComment] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)

  useEffect(() => {
    if (task) { setEditTitle(task.title); setEditDesc(task.description) }
  }, [task])

  if (!task) return null

  const close = () => dispatch(setActiveTask(null))

  const save = () => {
    dispatch(updateTaskAsync({ id: task.id, changes: { title: editTitle, description: editDesc } }))
    setEditingTitle(false)
  }

  const setPriority = (p: Priority) => dispatch(updateTaskAsync({ id: task.id, changes: { priority: p } }))

  const toggleLabel = (label: string) => {
    const labels = task.labels.includes(label)
      ? task.labels.filter(l => l !== label)
      : [...task.labels, label]
    dispatch(updateTaskAsync({ id: task.id, changes: { labels } }))
  }

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return
    dispatch(addSubtask({ taskId: task.id, title: newSubtask }))
    setNewSubtask('')
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    dispatch(addComment({ taskId: task.id, text: newComment, authorName: user?.name ?? 'You' }))
    setNewComment('')
  }

  const handleDelete = () => {
    dispatch(deleteTaskAsync(task.id))
    close()
  }

  const completedSubtasks = task.subtasks.filter(s => s.completed).length
  const priority = PRIORITY_CONFIG[task.priority]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) close() }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          style={{ boxShadow: 'var(--shadow-elevated)' }}
        >
          {/* Header */}
          <div className="sticky top-0 flex items-start justify-between p-5 border-b border-surface-700 bg-surface-900 z-10">
            <div className="flex-1 pr-4">
              {editingTitle ? (
                <input
                  autoFocus value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onBlur={save}
                  onKeyDown={e => e.key === 'Enter' && save()}
                  className="w-full text-xl font-bold bg-transparent border-b border-brand-500 outline-none pb-1"
                  style={{ color: 'rgb(var(--color-text-primary))' }}
                />
              ) : (
                <h2 className="text-xl font-bold cursor-pointer hover:text-brand-400 transition-colors"
                  onClick={() => setEditingTitle(true)}
                  style={{ color: 'rgb(var(--color-text-primary))' }}>
                  {task.title}
                </h2>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleDelete}
                className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 hover:bg-red-600/20 transition-all flex items-center justify-center">
                <Trash2 size={14} />
              </button>
              <button onClick={close}
                className="w-8 h-8 rounded-lg bg-surface-800 border border-surface-700 text-surface-400 hover:text-white transition-all flex items-center justify-center">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-6">
            {/* Meta row */}
            <div className="flex flex-wrap gap-3">
              {/* Priority */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-surface-500 flex items-center gap-1"><Flag size={11} /> Priority</span>
                <div className="flex gap-1.5">
                  {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => (
                    <button key={p} onClick={() => setPriority(p)}
                      className={cn(
                        'text-xs font-bold px-2.5 py-1 rounded-lg border transition-all',
                        task.priority === p ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].border}` : 'bg-surface-800 border-surface-700 text-surface-400 hover:text-white'
                      )}
                      style={{ color: task.priority === p ? PRIORITY_CONFIG[p].color : undefined }}>
                      {PRIORITY_CONFIG[p].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due date */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-surface-500 flex items-center gap-1"><Calendar size={11} /> Due Date</span>
                <input type="date"
                  value={task.dueDate ?? ''}
                  onChange={e => dispatch(updateTaskAsync({ id: task.id, changes: { dueDate: e.target.value || null } }))}
                  className="input-base text-xs py-1.5 w-36" />
              </div>

              {/* Assignee */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-surface-500 flex items-center gap-1"><Clock size={11} /> Est. Hours</span>
                <input type="number" min={0}
                  value={task.estimatedHours ?? ''}
                  onChange={e => dispatch(updateTaskAsync({ id: task.id, changes: { estimatedHours: Number(e.target.value) } }))}
                  className="input-base text-xs py-1.5 w-20" placeholder="0" />
              </div>
            </div>

            {/* Labels */}
            <div>
              <span className="text-xs font-semibold text-surface-500 flex items-center gap-1 mb-2"><Tag size={11} /> Labels</span>
              <div className="flex gap-1.5 flex-wrap">
                {ALL_LABELS.map(label => (
                  <button key={label} onClick={() => toggleLabel(label)}
                    className={cn(
                      'text-xs font-semibold px-2.5 py-1 rounded-full capitalize transition-all border',
                      task.labels.includes(label) ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                    )}
                    style={{
                      backgroundColor: `${LABEL_COLORS[label]}20`,
                      color: LABEL_COLORS[label],
                      borderColor: `${LABEL_COLORS[label]}50`,
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="text-xs font-semibold text-surface-500 block mb-2">Description</span>
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                onBlur={save}
                rows={4}
                placeholder="Add a description..."
                className="input-base text-sm resize-none leading-relaxed"
              />
            </div>

            {/* Subtasks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-surface-500 flex items-center gap-1">
                  <CheckSquare size={11} /> Subtasks
                  {task.subtasks.length > 0 && (
                    <span className="text-surface-600 font-normal">({completedSubtasks}/{task.subtasks.length})</span>
                  )}
                </span>
              </div>
              {task.subtasks.length > 0 && (
                <div className="h-1 bg-surface-700 rounded-full overflow-hidden mb-3">
                  <motion.div className="h-full bg-emerald-500 rounded-full"
                    animate={{ width: `${(completedSubtasks / task.subtasks.length) * 100}%` }} />
                </div>
              )}
              <div className="flex flex-col gap-1.5 mb-2">
                {task.subtasks.map(st => (
                  <div key={st.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-800/50 transition-all group">
                    <button onClick={() => dispatch(toggleSubtask({ taskId: task.id, subtaskId: st.id }))}
                      className="flex-shrink-0 transition-colors">
                      {st.completed
                        ? <CheckSquare size={16} className="text-emerald-400" />
                        : <Square size={16} className="text-surface-500" />}
                    </button>
                    <span className={cn('text-sm flex-1', st.completed ? 'line-through text-surface-500' : '')}
                      style={{ color: st.completed ? undefined : 'rgb(var(--color-text-primary))' }}>
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                  placeholder="Add subtask..." className="input-base text-xs py-1.5 flex-1" />
                <button onClick={handleAddSubtask} className="btn-primary py-1.5 px-3 text-xs">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Comments */}
            <div>
              <span className="text-xs font-semibold text-surface-500 flex items-center gap-1 mb-3">
                <MessageSquare size={11} /> Comments ({task.comments.length})
              </span>
              <div className="flex flex-col gap-2.5 mb-3">
                {task.comments.map(c => (
                  <div key={c.id} className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">
                      {c.authorName[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>{c.authorName}</span>
                        <span className="text-[10px] text-surface-500">{format(new Date(c.createdAt), 'MMM d, HH:mm')}</span>
                      </div>
                      <p className="text-sm text-surface-300 bg-surface-800 rounded-xl px-3 py-2 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newComment} onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                  placeholder="Add a comment..." className="input-base text-sm flex-1" />
                <button onClick={handleAddComment} className="btn-primary py-2 px-3 text-sm">
                  <MessageSquare size={14} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
