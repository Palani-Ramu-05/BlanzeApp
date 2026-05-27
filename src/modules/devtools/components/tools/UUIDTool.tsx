import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Copy, CheckSquare } from 'lucide-react'
import { ToolWrapper, Slider, ToolButton, CopyButton, CheckboxRow } from '../ToolShared'
import toast from 'react-hot-toast'

const genUUIDv4 = () => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return [...bytes].map((b, i) => ([4, 6, 8, 10].includes(i) ? '-' : '') + b.toString(16).padStart(2, '0')).join('')
}

const genUUIDv1 = () => {
  const now = BigInt(Date.now()) * 10000n + 122192928000000000n
  const timeLow = (now & 0xffffffffn).toString(16).padStart(8, '0')
  const timeMid = ((now >> 32n) & 0xffffn).toString(16).padStart(4, '0')
  const timeHi = ((now >> 48n) & 0x0fffn | 0x1000n).toString(16).padStart(4, '0')
  const arr = new Uint8Array(8)
  crypto.getRandomValues(arr)
  const clock = ((arr[0] & 0x3f) | 0x80).toString(16).padStart(2, '0') + arr[1].toString(16).padStart(2, '0')
  const node = [...arr.slice(2, 8)].map(b => b.toString(16).padStart(2, '0')).join('')
  return `${timeLow}-${timeMid}-${timeHi}-${clock}-${node}`
}

export const UUIDTool = () => {
  const [version, setVersion] = useState<'v1' | 'v4'>('v4')
  const [count, setCount] = useState(1)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [uuids, setUuids] = useState<string[]>(() => [genUUIDv4()])

  const generate = useCallback(() => {
    const gen = version === 'v4' ? genUUIDv4 : genUUIDv1
    setUuids(Array.from({ length: count }, gen))
  }, [version, count])

  useEffect(() => { generate() }, [version, count])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(generate, 1500)
    return () => clearInterval(interval)
  }, [autoRefresh, generate])

  const copyAll = () => {
    navigator.clipboard.writeText(uuids.join('\n'))
    toast.success(`Copied ${uuids.length} UUID${uuids.length > 1 ? 's' : ''}`)
  }

  return (
    <ToolWrapper className="max-w-2xl">
      {/* Version tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface-800 rounded-xl border border-surface-700/40 w-fit">
        {(['v1', 'v4'] as const).map(v => (
          <button key={v} onClick={() => setVersion(v)}
            className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${version === v ? 'bg-brand-600 text-white' : 'text-surface-400 hover:text-white'}`}>
            UUID {v} {v === 'v4' ? '(Random)' : '(Time-based)'}
          </button>
        ))}
      </div>

      {/* Count */}
      <Slider label="Count" value={count} min={1} max={100} onChange={setCount} />

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <ToolButton variant="primary" size="md" icon={<RefreshCw size={14} />} onClick={generate}>
          Generate
        </ToolButton>
        {uuids.length > 1 && (
          <ToolButton variant="secondary" size="md" icon={<CheckSquare size={14} />} onClick={copyAll}>
            Copy All
          </ToolButton>
        )}
        <CheckboxRow label="Auto Refresh" checked={autoRefresh} onChange={setAutoRefresh} />
      </div>

      {/* UUID list */}
      <div className="space-y-1.5">
        {uuids.map((uuid, i) => (
          <motion.div
            key={`${uuid}-${i}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className="flex items-center gap-3 px-4 py-2.5 bg-surface-900 border border-surface-700/40 rounded-xl group hover:border-surface-600/60 transition-colors"
          >
            {uuids.length > 1 && (
              <span className="text-[10px] font-mono text-surface-600 w-6 text-right flex-shrink-0">{i + 1}</span>
            )}
            <span className="flex-1 font-mono text-sm text-white">{uuid}</span>
            <CopyButton value={uuid} />
          </motion.div>
        ))}
      </div>

      {autoRefresh && (
        <div className="flex items-center gap-2 px-3 py-2 bg-brand-500/10 border border-brand-500/20 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          <span className="text-xs text-brand-300">Auto-refreshing every 1.5 seconds</span>
        </div>
      )}
    </ToolWrapper>
  )
}
