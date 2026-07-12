import { Trash2, Plus } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { addEnvVar, updateEnvVar, deleteEnvVar, setEnvVars } from '../store/fetchlabSlice'
import { Modal, Button } from '@components/index'
import { cn } from '@utils/index'

interface Props {
  open: boolean
  onClose: () => void
}

export const FetchLabEnvModal = ({ open, onClose }: Props) => {
  const dispatch = useAppDispatch()
  const { envVars } = useAppSelector((s) => s.fetchlab)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="âš™ Environment Variables"
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-surface-400 p-2.5 bg-surface-800 rounded-lg border-l-2 border-brand-500">
          Use <code className="text-brand-400 font-mono">{'{{variableName}}'}</code> in URL, headers, and body to inject environment values.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="w-7 pb-2 text-left" />
                <th className="pb-2 text-left font-semibold text-surface-400 uppercase tracking-wider">Variable</th>
                <th className="pb-2 text-left font-semibold text-surface-400 uppercase tracking-wider pl-2">Value</th>
                <th className="w-8 pb-2" />
              </tr>
            </thead>
            <tbody>
              {envVars.map((v) => (
                <tr key={v.id} className="border-b border-surface-800/50">
                  <td className="py-1.5 pr-2">
                    <input
                      type="checkbox"
                      checked={v.enabled}
                      onChange={(e) =>
                        dispatch(updateEnvVar({ id: v.id, field: 'enabled', value: e.target.checked }))
                      }
                      className="w-3.5 h-3.5 accent-brand-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      type="text"
                      value={v.key}
                      onChange={(e) =>
                        dispatch(updateEnvVar({ id: v.id, field: 'key', value: e.target.value }))
                      }
                      placeholder="variable_name"
                      className={cn('w-full bg-transparent border border-transparent rounded px-2 py-1 font-mono text-xs text-surface-200',
                        'focus:bg-surface-800 focus:border-surface-600 outline-none transition-colors')}
                    />
                  </td>
                  <td className="py-1 pl-2">
                    <input
                      type="text"
                      value={v.value}
                      onChange={(e) =>
                        dispatch(updateEnvVar({ id: v.id, field: 'value', value: e.target.value }))
                      }
                      placeholder="value"
                      className={cn('w-full bg-transparent border border-transparent rounded px-2 py-1 font-mono text-xs text-surface-200',
                        'focus:bg-surface-800 focus:border-surface-600 outline-none transition-colors')}
                    />
                  </td>
                  <td className="py-1 pl-2">
                    <button
                      onClick={() => dispatch(deleteEnvVar(v.id))}
                      className="p-1 rounded text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button
          variant="ghost"
          size="sm"
          icon={<Plus size={13} />}
          onClick={() => dispatch(addEnvVar())}
        >
          Add Variable
        </Button>
      </div>
    </Modal>
  )
}
