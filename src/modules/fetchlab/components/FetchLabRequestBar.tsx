import { useRef } from 'react'
import { Send, Save, Settings } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import {
  updateCurrentRequest,
  saveCurrentRequest,
  sendRequest,
} from '../store/fetchlabSlice'
import { Select, Button } from '@components/index'
import { HTTP_METHODS } from '@core/constants/constants'
import { cn } from '@utils/index'
import { FetchLabEnvModal } from './FetchLabEnvModal'
import { useState } from 'react'

const methodColorMap: Record<string, string> = {
  GET: 'text-green-400',
  POST: 'text-amber-400',
  PUT: 'text-brand-400',
  DELETE: 'text-red-400',
  PATCH: 'text-purple-400',
  HEAD: 'text-cyan-400',
  OPTIONS: 'text-orange-400',
}

export const FetchLabRequestBar = () => {
  const dispatch = useAppDispatch()
  const { currentRequest, sending } = useAppSelector((s) => s.fetchlab)
  const [envOpen, setEnvOpen] = useState(false)
  const urlRef = useRef<HTMLInputElement>(null)

  const method = currentRequest?.method || 'GET'

  return (
    <div className="flex items-center gap-2 p-3 border-b border-surface-700/60 bg-surface-900 flex-shrink-0">
      <Select
        options={HTTP_METHODS.map((m) => ({ value: m, label: m }))}
        value={method}
        onChange={(e) =>
          dispatch(updateCurrentRequest({ method: e.target.value as typeof method }))
        }
        className={cn('w-[100px] font-bold text-xs flex-shrink-0', methodColorMap[method])}
        disabled={!currentRequest}
      />

      <input
        ref={urlRef}
        type="text"
        value={currentRequest?.url || ''}
        onChange={(e) => dispatch(updateCurrentRequest({ url: e.target.value }))}
        placeholder="Enter request URL or use {{variable}}…"
        className="input-base flex-1 font-mono text-xs"
        disabled={!currentRequest}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && currentRequest) dispatch(sendRequest())
        }}
      />

      <Button
        variant="ghost"
        size="sm"
        icon={<Settings size={14} />}
        onClick={() => setEnvOpen(true)}
        title="Environment Variables"
      >
        Env
      </Button>

      <Button
        variant="ghost"
        size="sm"
        icon={<Save size={14} />}
        onClick={() => dispatch(saveCurrentRequest())}
        disabled={!currentRequest}
        title="Save (Ctrl+S)"
      >
        Save
      </Button>

      <Button
        size="sm"
        icon={<Send size={14} />}
        loading={sending}
        onClick={() => dispatch(sendRequest())}
        disabled={!currentRequest}
        className="px-5"
        title="Send (Ctrl+Enter)"
      >
        Send
      </Button>

      <FetchLabEnvModal open={envOpen} onClose={() => setEnvOpen(false)} />
    </div>
  )
}
