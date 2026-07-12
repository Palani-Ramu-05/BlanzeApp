import { useRef } from 'react'
import { Send } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { updateCurrentRequest, sendRequest } from '../store/fetchlabSlice'
import { Select, Button } from '@components/index'
import { HTTP_METHODS } from '@core/constants/constants'
import { cn } from '@utils/index'

const methodBgMap: Record<string, string> = {
  GET:     'text-green-400 border-green-500/30 bg-green-500/8',
  POST:    'text-amber-400 border-amber-500/30 bg-amber-500/8',
  PUT:     'text-brand-400 border-brand-500/30 bg-brand-500/8',
  DELETE:  'text-red-400   border-red-500/30   bg-red-500/8',
  PATCH:   'text-purple-400 border-purple-500/30 bg-purple-500/8',
  HEAD:    'text-cyan-400  border-cyan-500/30  bg-cyan-500/8',
  OPTIONS: 'text-orange-400 border-orange-500/30 bg-orange-500/8',
}

export const FetchLabRequestBar = () => {
  const dispatch = useAppDispatch()
  const { currentRequest, sending } = useAppSelector((s) => s.fetchlab)
  const urlRef = useRef<HTMLInputElement>(null)

  const method = currentRequest?.method || 'GET'

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-surface-900 flex-shrink-0">
      <Select
        options={HTTP_METHODS.map((m) => ({ value: m, label: m }))}
        value={method}
        onChange={(e) => dispatch(updateCurrentRequest({ method: e.target.value as typeof method }))}
        className={cn('w-[116px] font-bold text-xs flex-shrink-0 border', methodBgMap[method])}
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
        onKeyDown={(e) => { if (e.key === 'Enter' && currentRequest) dispatch(sendRequest()) }}
      />

      <button
        onClick={() => dispatch(sendRequest())}
        disabled={!currentRequest || sending}
        title="Send (Ctrl+Enter)"
        className={cn(
          'flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.97]',
          'bg-gradient-to-r from-brand-600 to-brand-500 text-white',
          'hover:from-brand-500 hover:to-brand-400 shadow-glow-sm',
          'disabled:opacity-50 disabled:pointer-events-none',
          sending && 'animate-pulse',
        )}
      >
        <Send size={14} className={sending ? 'animate-spin' : ''} />
        {sending ? 'Sending…' : 'Send'}
      </button>
    </div>
  )
}
