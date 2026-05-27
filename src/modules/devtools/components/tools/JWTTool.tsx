import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Shield, ShieldAlert, ShieldCheck, X } from 'lucide-react'
import { ToolWrapper, StyledTextarea, StyledInput, CopyButton } from '../ToolShared'
import { decodeJWT, getTokenMeta } from '../../utils/jwtUtils'
import { cn } from '@utils/index'

const SAMPLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

const KeyValueRow = ({ k, v }: { k: string; v: unknown }) => (
  <div className="grid grid-cols-[120px_1fr] gap-3 px-3 py-2 even:bg-surface-800/30 rounded-lg">
    <span className="text-xs font-semibold text-surface-400 truncate">{k}</span>
    <span className="text-xs font-mono text-white break-all">{JSON.stringify(v)}</span>
  </div>
)

export const JWTTool = () => {
  const [token, setToken] = useState(SAMPLE_JWT)
  const [secret, setSecret] = useState('')

  const decoded = useMemo(() => decodeJWT(token), [token])
  const meta = useMemo(() => decoded.isValid ? getTokenMeta(decoded.payload) : null, [decoded])

  const partColors = ['text-rose-400', 'text-amber-300', 'text-sky-400']
  const parts = token.split('.')

  return (
    <ToolWrapper>
      {/* Token input */}
      <StyledTextarea
        label="JSON Web Token (JWT)"
        value={token}
        onChange={e => setToken(e.target.value)}
        placeholder="Paste your JWT token here…"
        mono
        className="min-h-[90px]"
        actions={
          <>
            <button onClick={async () => { try { setToken(await navigator.clipboard.readText()) } catch {} }}
              className="text-[10px] text-brand-400 hover:text-brand-300 font-semibold px-2 py-1 rounded-lg hover:bg-brand-500/10 transition-colors">
              Paste
            </button>
            {token && <button onClick={() => setToken('')} className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors"><X size={13} /></button>}
          </>
        }
      />

      {/* Secret input */}
      <StyledInput
        label="Secret"
        value={secret}
        onChange={e => setSecret(e.target.value)}
        placeholder="your-secret-key (for display only)"
        mono
        actions={<span className="text-[10px] text-surface-500 font-semibold">UTF-8</span>}
      />

      {/* Validity banner */}
      {token && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold',
            decoded.isValid && !meta?.isExpired
              ? 'bg-green-500/10 border-green-500/20 text-green-300'
              : decoded.isValid && meta?.isExpired
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              : 'bg-red-500/10 border-red-500/20 text-red-300'
          )}
        >
          {decoded.isValid && !meta?.isExpired ? <ShieldCheck size={14} /> : decoded.isValid ? <ShieldAlert size={14} /> : <Shield size={14} />}
          {decoded.isValid ? (meta?.isExpired ? 'Token is expired' : 'Valid JWT structure') : decoded.error || 'Invalid JWT'}
        </motion.div>
      )}

      {/* Colored parts visualization */}
      {token && parts.length === 3 && (
        <div className="px-4 py-3 bg-surface-900 border border-surface-700/40 rounded-xl font-mono text-xs break-all leading-6">
          {parts.map((part, i) => (
            <span key={i}>
              <span className={partColors[i]}>{part}</span>
              {i < 2 && <span className="text-surface-600">.</span>}
            </span>
          ))}
        </div>
      )}

      {decoded.isValid && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Header */}
          <div className="rounded-xl border border-rose-500/20 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-rose-500/10 border-b border-rose-500/20">
              <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">Header</span>
              <CopyButton value={JSON.stringify(decoded.header, null, 2)} />
            </div>
            <div className="p-1">
              {Object.entries(decoded.header).map(([k, v]) => <KeyValueRow key={k} k={k} v={v} />)}
            </div>
          </div>

          {/* Payload */}
          <div className="rounded-xl border border-amber-500/20 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-amber-500/10 border-b border-amber-500/20">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Payload</span>
              <CopyButton value={JSON.stringify(decoded.payload, null, 2)} />
            </div>
            <div className="p-1">
              {Object.entries(decoded.payload).map(([k, v]) => <KeyValueRow key={k} k={k} v={v} />)}
            </div>
            {meta && (
              <div className="px-3 pb-2 pt-1 space-y-1">
                {meta.iat && <p className="text-[10px] text-surface-500">Issued: {meta.iat.toLocaleString()}</p>}
                {meta.exp && <p className={cn('text-[10px]', meta.isExpired ? 'text-red-400' : 'text-green-400')}>
                  {meta.isExpired ? 'Expired' : 'Expires'}: {meta.exp.toLocaleString()}
                </p>}
              </div>
            )}
          </div>
        </div>
      )}
    </ToolWrapper>
  )
}
