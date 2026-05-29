import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, MessageSquare, Paperclip, CheckSquare, GripVertical, User } from 'lucide-react'
import { type Task, PRIORITY_CONFIG, LABEL_COLORS } from '../dto/types/taskboard.types'
import { cn } from '@utils/index'
import { format } from 'date-fns'

interface TaskCardProps {
  task: Task
  onClick: () => void
  isDragging?: boolean
}

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priority = PRIORITY_CONFIG[task.priority]
  const completedSubtasks = task.subtasks.filter(s => s.completed).length
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.isCompleted

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, boxShadow: 'var(--shadow-card)' }}
      className={cn(
        'group relative bg-surface-900 border border-surface-700 rounded-xl p-3 cursor-pointer transition-all',
        isSortDragging || isDragging ? 'opacity-50 shadow-2xl scale-105' : 'hover:border-surface-600',
      )}
      onClick={onClick}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-60 hover:!opacity-100 text-surface-500 cursor-grab active:cursor-grabbing transition-opacity"
        onClick={e => e.stopPropagation()}
      >
        <GripVertical size={14} />
      </div>

      {/* Priority indicator */}
      <div className="flex items-start gap-2 mb-2.5">
        <div className="w-1.5 h-full min-h-[36px] rounded-full flex-shrink-0 mt-0.5"
          style={{ backgroundColor: priority.color }} />
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-semibold leading-snug pr-6',
            task.isCompleted ? 'line-through text-surface-400' : ''
          )} style={{ color: task.isCompleted ? undefined : 'rgb(var(--color-text-primary))' }}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-surface-400 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
          )}
        </div>
      </div>

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-2.5">
          {task.labels.map(label => (
            <span key={label} className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
              style={{
                backgroundColor: `${LABEL_COLORS[label] ?? '#64748b'}20`,
                color: LABEL_COLORS[label] ?? '#94a3b8',
                border: `1px solid ${LABEL_COLORS[label] ?? '#64748b'}40`,
              }}>
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Subtask progress */}
      {task.subtasks.length > 0 && (
        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-surface-500 flex items-center gap-1">
              <CheckSquare size={10} /> {completedSubtasks}/{task.subtasks.length}
            </span>
          </div>
          <div className="h-1 bg-surface-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${(completedSubtasks / task.subtasks.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Footer meta */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2.5 text-surface-500">
          {task.dueDate && (
            <span className={cn(
              'text-[10px] flex items-center gap-1 font-medium',
              isOverdue ? 'text-red-400' : 'text-surface-400'
            )}>
              <Calendar size={10} />
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
          {task.comments.length > 0 && (
            <span className="text-[10px] flex items-center gap-1">
              <MessageSquare size={10} /> {task.comments.length}
            </span>
          )}
          {task.attachments.length > 0 && (
            <span className="text-[10px] flex items-center gap-1">
              <Paperclip size={10} /> {task.attachments.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md', priority.bg, priority.border, 'border')}>
            {priority.label}
          </span>
          {task.assigneeName && (
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white"
              title={task.assigneeName}>
              {task.assigneeName[0].toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
