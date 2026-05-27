import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { ToolWrapper, Slider, CopyButton, ResetButton, CheckboxRow } from '../ToolShared'
import { generateToken, applyTokenPattern, type CharsetOptions } from '../../utils/cryptoUtils'

export const TokenGeneratorTool = () => {
  const [length, setLength] = useState(43)
  const [charset, setCharset] = useState<CharsetOptions>({ numbers: true, lowercase: true, uppercase: true, special: true })
  const [pattern, setPattern] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [token, setToken] = useState(() => generateToken(43, { numbers: true, lowercase: true, uppercase: true, special: true }))

  const generate = useCallback(() => {
    const raw = generateToken(length, charset)
    setToken(pattern ? applyTokenPattern(raw, pattern) : raw)
  }, [length, charset, pattern])

  const toggleCharset = (key: keyof CharsetOptions) =>
    setCharset(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <ToolWrapper className="max-w-xl">
      {/* Charset toggles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.keys(charset) as (keyof CharsetOptions)[]).map(key => (
          <div key={key} className={`px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${charset[key] ? 'bg-brand-600/20 border-brand-500/40' : 'bg-surface-800 border-surface-700/40'}`}
            onClick={() => toggleCharset(key)}>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${charset[key] ? 'bg-brand-600 border-brand-600' : 'bg-surface-800 border-surface-600'}`}>
                {charset[key] && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M1 5l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              <span className="text-xs font-semibold text-surface-300 capitalize">
                {key === 'numbers' ? 'Numbers (0-9)' : key === 'lowercase' ? 'Lowercase (a-z)' : key === 'uppercase' ? 'Uppercase (A-Z)' : 'Special (e.g. !@#)'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Slider label="Token Length" value={length} min={8} max={256} onChange={setLength} />

      {/* Advanced */}
      <div>
        <button onClick={() => setShowAdvanced(v => !v)} className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-white transition-colors">
          <span className="text-brand-400">{showAdvanced ? '∧' : '∨'}</span> Advanced Settings
        </button>
        {showAdvanced && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Format Pattern</label>
              <p className="text-[10px] text-surface-500">Use the format <code className="font-mono text-surface-400 bg-surface-800 px-1 rounded">8-4-4-4-12</code> to generate tokens in a specific pattern. For example, a UUID format.</p>
              <input value={pattern} onChange={e => setPattern(e.target.value)}
                placeholder="8-4-4-4-12"
                className="w-full px-3 py-2 font-mono text-sm rounded-xl bg-surface-900 border border-surface-700/60 text-white placeholder-surface-600 focus:outline-none focus:ring-1 focus:ring-brand-500/50" />
            </div>
          </motion.div>
        )}
      </div>

      <span className="text-surface-600 text-sm block text-center">↓</span>

      {/* Output */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Generated Token</span>
          <div className="flex items-center gap-1">
            <CopyButton value={token} />
            <ResetButton onClick={generate} />
          </div>
        </div>
        <div className="px-4 py-3 bg-surface-900 border border-surface-700/40 rounded-xl font-mono text-sm text-emerald-300 break-all">
          {token}
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={generate}
        className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
      >
        <RefreshCw size={15} /> Generate New Token
      </motion.button>
    </ToolWrapper>
  )
}
