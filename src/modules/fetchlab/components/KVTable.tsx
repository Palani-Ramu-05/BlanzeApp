import { Trash2, Plus } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { addKVRow, updateKVRow, deleteKVRow } from '../store/fetchlabSlice'
import { cn } from '@utils/index'

type KVTarget = 'params' | 'headers' | 'formEncodeFields'

interface Props {
  target: KVTarget
  addLabel: string
}

export const KVTable = ({ target, addLabel }: Props) => {
  const dispatch = useAppDispatch()
  const { currentRequest } = useAppSelector((s) => s.fetchlab)
  const rows = currentRequest?.[target] || []

  return (
    <div className="p-3">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-surface-700/60">
            <th className="w-7 pb-2" />
            <th className="pb-2 text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider">Key</th>
            <th className="pb-2 text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider pl-2">Value</th>
            <th className="w-8 pb-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-surface-800/30">
              <td className="py-1 pr-2">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={(e) =>
                    dispatch(updateKVRow({ target, id: row.id, field: 'enabled', value: e.target.checked }))
                  }
                  className="w-3.5 h-3.5 accent-brand-500 cursor-pointer"
                />
              </td>
              <td className="py-1 pr-1">
                <input
                  type="text"
                  value={row.key}
                  onChange={(e) =>
                    dispatch(updateKVRow({ target, id: row.id, field: 'key', value: e.target.value }))
                  }
                  placeholder="key"
                  className={cn(
                    'w-full bg-transparent border border-transparent rounded-md px-2 py-1.5',
                    'font-mono text-xs text-slate-200 placeholder:text-surface-600',
                    'focus:bg-surface-800 focus:border-surface-600 outline-none transition-colors',
                  )}
                />
              </td>
              <td className="py-1 pl-1">
                <input
                  type="text"
                  value={row.value}
                  onChange={(e) =>
                    dispatch(updateKVRow({ target, id: row.id, field: 'value', value: e.target.value }))
                  }
                  placeholder="value"
                  className={cn(
                    'w-full bg-transparent border border-transparent rounded-md px-2 py-1.5',
                    'font-mono text-xs text-slate-200 placeholder:text-surface-600',
                    'focus:bg-surface-800 focus:border-surface-600 outline-none transition-colors',
                  )}
                />
              </td>
              <td className="py-1 pl-2">
                <button
                  onClick={() => dispatch(deleteKVRow({ target, id: row.id }))}
                  className="p-1 rounded text-surface-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={() => dispatch(addKVRow({ target }))}
        className="mt-2 w-full py-1.5 text-[11px] text-surface-500 border border-dashed border-surface-700 rounded-lg hover:border-brand-500/50 hover:text-brand-400 transition-colors flex items-center justify-center gap-1"
      >
        <Plus size={11} />
        {addLabel}
      </button>
    </div>
  )
}
