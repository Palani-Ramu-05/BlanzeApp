import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent, type DragOverEvent
} from '@dnd-kit/core'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { moveTask, reorderTasks } from '../store/taskboardSlice'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'

export function KanbanBoard() {
  const dispatch = useAppDispatch()
  const { board, filterPriority, filterLabel, searchQuery } = useAppSelector(s => s.taskboard)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overColumnId, setOverColumnId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const filterTasks = (columnId: string) => {
    return board.tasks
      .filter(t => t.columnId === columnId)
      .filter(t => filterPriority === 'all' || t.priority === filterPriority)
      .filter(t => filterLabel === 'all' || t.labels.includes(filterLabel))
      .filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.position - b.position)
  }

  const activeTask = activeId ? board.tasks.find(t => t.id === activeId) : null

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string)
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const overId = over.id as string
    const overColumn = board.columns.find(c => c.id === overId)
    if (overColumn) {
      setOverColumnId(overId)
      return
    }
    const overTask = board.tasks.find(t => t.id === overId)
    if (overTask) setOverColumnId(overTask.columnId)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null); setOverColumnId(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = board.tasks.find(t => t.id === activeId)
    if (!activeTask) return

    // Dropped on a column
    const overColumn = board.columns.find(c => c.id === overId)
    if (overColumn && activeTask.columnId !== overId) {
      dispatch(moveTask({ taskId: activeId, toColumnId: overId }))
      return
    }

    // Dropped on another task
    const overTask = board.tasks.find(t => t.id === overId)
    if (overTask) {
      if (activeTask.columnId !== overTask.columnId) {
        dispatch(moveTask({ taskId: activeId, toColumnId: overTask.columnId }))
      } else {
        dispatch(reorderTasks({ columnId: activeTask.columnId, activeId, overId }))
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar" style={{ minHeight: '400px' }}>
        {board.columns.map((column, i) => (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex-1 min-w-[280px] flex flex-col"
          >
            <KanbanColumn
              column={column}
              tasks={filterTasks(column.id)}
              isOver={overColumnId === column.id}
            />
          </motion.div>
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 opacity-95">
            <TaskCard task={activeTask} onClick={() => {}} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
