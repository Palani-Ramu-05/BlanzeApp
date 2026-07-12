import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MessageSquare, Paperclip, Calendar, CheckSquare, AlertCircle } from 'lucide-react'
import { cn } from '@utils/index'
import { PRIORITY_CONFIG, LABEL_COLORS } from '../dto/types/taskboard.types'
import type { Task } from '../dto/types/taskboard.types'
import { format, isPast, parseISO } from 'date-fns'

interface Props { task: Task; onClick: () => void; isDragging?: boolean }

export function TaskCard({ task, onClick, isDragging }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }

  const pc = PRIORITY_CONFIG[task.priority]
  const completedSubtasks = task.subtasks.filter(s => s.completed).length
  const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && !task.isCompleted
  const initials = task.assigneeName ? task.assigneeName.slice(0, 2).toUpperCase() : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'group bg-surface-800 border border-surface-700/60 rounded-xl p-3 cursor-pointer',
        'hover:border-brand-600/40 hover:shadow-md transition-all select-none',
        isDragging && 'shadow-2xl rotate-1 scale-105 border-brand-500/50',
        task.isCompleted && 'opacity-60',
      )}
    >
      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map(label => (
            <span key={label}
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
              style={{ backgroundColor: `${LABEL_COLORS[label] ?? '#64748b'}22`, color: LABEL_COLORS[label] ?? '#64748b', border: `1px solid ${LABEL_COLORS[label] ?? '#64748b'}44` }}>
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <p className={cn('text-sm font-medium text-surface-200 leading-snug mb-2', task.isCompleted && 'line-through text-surface-500')}>
        {task.title}
      </p>

      {/* Subtasks progress */}
      {task.subtasks.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckSquare size={10} className="text-surface-500" />
            <span className="text-[10px] text-surface-500">{completedSubtasks}/{task.subtasks.length}</span>
          </div>
          <div className="h-1 bg-surface-700 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${(completedSubtasks / task.subtasks.length) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Priority */}
        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full border', pc.bg, pc.border)}
          style={{ color: pc.color }}>
          {pc.label}
        </span>

        {/* Due date */}
        {task.dueDate && (
          <span className={cn('flex items-center gap-0.5 text-[10px]', isOverdue ? 'text-red-400' : 'text-surface-500')}>
            {isOverdue && <AlertCircle size={9} />}
            <Calendar size={9} />
            {format(parseISO(task.dueDate), 'MMM d')}
          </span>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {task.comments.length > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-surface-600">
              <MessageSquare size={9} />{task.comments.length}
            </span>
          )}
          {task.attachments.length > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-surface-600">
              <Paperclip size={9} />{task.attachments.length}
            </span>
          )}

          {/* Assignee avatar */}
          {initials && (
            <div className="w-5 h-5 rounded-full bg-brand-600/30 border border-brand-600/40 flex items-center justify-center flex-shrink-0">
              <span className="text-[8px] font-bold text-brand-400">{initials}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
