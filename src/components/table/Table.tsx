import { cn } from '@utils/index'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { Spinner } from '../Spinner'
import { EmptyState } from '../EmptyState'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T, index: number) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyText?: string
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  rowKey: (row: T) => string | number
  className?: string
}

export function Table<T>({
  data,
  columns,
  loading,
  emptyText = 'No data found',
  sortKey,
  sortDir,
  onSort,
  rowKey,
  className,
}: TableProps<T>) {
  const SortIcon = ({ col }: { col: Column<T> }) => {
    if (!col.sortable) return null
    if (sortKey === col.key) {
      return sortDir === 'asc' ? (
        <ChevronUp size={11} className="text-brand-400" />
      ) : (
        <ChevronDown size={11} className="text-brand-400" />
      )
    }
    return <ChevronsUpDown size={11} className="text-surface-500" />
  }

  return (
    <div className={cn('overflow-auto rounded-xl border border-surface-700/50 premium-card', className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-surface-700/50">
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={cn(
                  'px-4 py-3 text-left text-[10px] font-bold text-surface-400 uppercase tracking-wider bg-surface-800/30',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  col.sortable && 'cursor-pointer hover:text-surface-100 select-none',
                )}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <div className={cn('flex items-center gap-1', col.align === 'center' && 'justify-center', col.align === 'right' && 'justify-end')}>
                  {col.header}
                  <SortIcon col={col} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-12">
                <div className="flex justify-center">
                  <Spinner size="md" text="Loading…" />
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState description={emptyText} />
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={rowKey(row)}
                className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors duration-100"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                    )}
                  >
                    {col.render
                      ? col.render(row, index)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
