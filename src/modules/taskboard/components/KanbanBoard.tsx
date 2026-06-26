import { useState } from 'react'
import {
  DndContext, closestCenter, DragOverlay,
  PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Plus, Layers } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { moveTask, reorderTasks, createColumnAsync } from '../store/taskboardSlice'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import type { Task } from '../dto/types/taskboard.types'
import { cn } from '@utils/index'

interface Props {
  projectId: string
  spaceId: string
}

export function KanbanBoard({ projectId, spaceId }: Props) {
  const dispatch = useAppDispatch()
  const { columns, tasks, filterPriority, filterLabel, searchQuery } = useAppSelector(s => s.taskboard)

  const [activeTask, setActiveTask]       = useState<Task | null>(null)
  const [creatingColumn, setCreatingColumn] = useState(false)
  const [newColName, setNewColName]       = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const projectColumns = [...columns.filter(c => c.projectId === projectId)].sort((a, b) => a.position - b.position)

  const filteredTasks = tasks.filter(t => {
    if (t.projectId !== projectId) return false
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    if (filterLabel !== 'all' && !t.labels.includes(filterLabel)) return false
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const onDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const onDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId   = over.id as string
    const task = tasks.find(t => t.id === activeId)
    if (!task) return

    // Drop onto a column (empty column droppable)
    const overColumn = projectColumns.find(c => c.id === overId)
    if (overColumn && task.columnId !== overId) {
      const pos = tasks.filter(t => t.columnId === overId && t.id !== activeId).length
      dispatch(moveTask({ taskId: activeId, columnId: overId, position: pos }))
      return
    }

    // Drop onto another task (reorder within or across column)
    const overTask = tasks.find(t => t.id === overId)
    if (!overTask) return

    if (task.columnId !== overTask.columnId) {
      // Move to a different column
      const colTasks = tasks.filter(t => t.columnId === overTask.columnId && t.id !== activeId).sort((a, b) => a.position - b.position)
      const overIdx  = colTasks.findIndex(t => t.id === overId)
      const newPos   = overIdx >= 0 ? overIdx : colTasks.length
      dispatch(moveTask({ taskId: activeId, columnId: overTask.columnId, position: newPos }))
    } else {
      // Reorder within the same column
      const colTasks = tasks.filter(t => t.columnId === task.columnId).sort((a, b) => a.position - b.position)
      const oldIdx   = colTasks.findIndex(t => t.id === activeId)
      const newIdx   = colTasks.findIndex(t => t.id === overId)
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return
      const reordered = arrayMove(colTasks, oldIdx, newIdx)
      dispatch(reorderTasks({ projectId, columnId: task.columnId, orderedIds: reordered.map(t => t.id) }))
    }
  }

  const handleCreateColumn = () => {
    if (!newColName.trim()) { setCreatingColumn(false); return }
    dispatch(createColumnAsync({ projectId, name: newColName.trim(), color: '#64748b' }))
    setNewColName('')
    setCreatingColumn(false)
  }

  if (projectColumns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Layers size={32} className="text-surface-600 mx-auto mb-3" />
          <p className="text-sm text-surface-400 mb-1">No columns yet</p>
          <p className="text-xs text-surface-600 mb-4">Add columns to organize your tasks</p>
          <button
            onClick={() => setCreatingColumn(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-brand-600/20 hover:bg-brand-600/30 border border-brand-600/30 text-brand-400 rounded-xl transition-colors mx-auto"
          >
            <Plus size={12} /> Add Column
          </button>
        </div>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-3 h-full items-start overflow-x-auto overflow-y-hidden pb-4 px-4">
        {projectColumns.map(col => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={filteredTasks.filter(t => t.columnId === col.id)}
            projectId={projectId}
            spaceId={spaceId}
          />
        ))}

        {/* Add Column button */}
        <div className="flex-shrink-0 w-[272px]">
          {creatingColumn ? (
            <div className="bg-surface-800/40 border border-surface-700/50 border-dashed rounded-xl p-3 space-y-2">
              <input
                autoFocus
                value={newColName}
                onChange={e => setNewColName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreateColumn(); if (e.key === 'Escape') { setCreatingColumn(false); setNewColName('') } }}
                placeholder="Column name (e.g. In Review)…"
                className="w-full bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-surface-600 outline-none focus:border-brand-500 transition-colors"
              />
              <div className="flex gap-1.5">
                <button onClick={handleCreateColumn}
                  className="flex items-center gap-1 text-[10px] font-semibold px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors">
                  Add Group
                </button>
                <button onClick={() => { setCreatingColumn(false); setNewColName('') }}
                  className="text-[10px] px-2 py-1 text-surface-400 hover:text-white border border-surface-700 rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreatingColumn(true)}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-surface-700 text-surface-500 hover:text-white hover:border-brand-600/50 hover:bg-brand-600/5 transition-all text-xs font-medium',
              )}
            >
              <Plus size={14} /> Add Group
            </button>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} onClick={() => {}} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}
