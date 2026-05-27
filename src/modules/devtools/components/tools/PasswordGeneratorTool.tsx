import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { ToolWrapper, Slider, CopyButton, ResetButton, CheckboxRow } from '../ToolShared'
import { generatePassword, calcPasswordStrength, type PasswordOptions } from '../../utils/cryptoUtils'

const DEFAULT_OPTS: PasswordOptions = { length: 16, numbers: true, lowercase: true, uppercase: true, special: true, excludeSimilar: false, excludeAmbiguous: false }

export const PasswordGeneratorTool = () => {
  const [opts, setOpts] = useState<PasswordOptions>(DEFAULT_OPTS)
  const [password, setPassword] = useState(() => generatePassword(DEFAULT_OPTS))

  const generate = useCallback(() => setPassword(generatePassword(opts)), [opts])
  useEffect(() => { generate() }, [opts.length, opts.numbers, opts.lowercase, opts.uppercase, opts.special, opts.excludeSimilar, opts.excludeAmbiguous])

  const strength = calcPasswordStrength(password)

  const toggle = (key: keyof PasswordOptions) =>
    setOpts(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <ToolWrapper className="max-w-xl">
      {/* Charset toggles */}
      <div className="grid grid-cols-2 gap-3">
        {([
          ['numbers', 'Numbers (0-9)'],
          ['lowercase', 'Lowercase (a-z)'],
          ['uppercase', 'Uppercase (A-Z)'],
          ['special', 'Special (e.g. !@#)'],
        ] as const).map(([key, label]) => (
          <div key={key} className={`px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${opts[key] ? 'bg-brand-600/15 border-brand-500/40' : 'bg-surface-800 border-surface-700/40'}`}
            onClick={() => toggle(key)}>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${opts[key] ? 'bg-brand-600 border-brand-600' : 'bg-surface-800 border-surface-600'}`}>
                {opts[key] && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M1 5l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              <span className="text-xs font-semibold text-surface-300">{label}</span>
            </div>
          </div>
        ))}
      </div>

      <Slider label="Password Length" value={opts.length} min={4} max={128} onChange={v => setOpts(p => ({ ...p, length: v }))} />

      {/* Advanced */}
      <div className="space-y-2.5">
        <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">∨ Advanced Settings</p>
        <CheckboxRow label="Exclude similar characters (i, l, 1, L, o, 0, O)" checked={opts.excludeSimilar} onChange={v => setOpts(p => ({ ...p, excludeSimilar: v }))} />
        <CheckboxRow label="Exclude ambiguous characters ({}, [], (), etc.)" checked={opts.excludeAmbiguous} onChange={v => setOpts(p => ({ ...p, excludeAmbiguous: v }))} />
      </div>

      <span className="text-surface-600 text-sm block text-center">↓</span>

      {/* Password output */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Generated Password</span>
          <div className="flex items-center gap-1">
            <CopyButton value={password} />
            <ResetButton onClick={generate} />
          </div>
        </div>
        <div className="px-4 py-3 bg-surface-900 border border-surface-700/40 rounded-xl font-mono text-sm text-white break-all">
          {password}
        </div>
      </div>

      {/* Strength meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-surface-300">Password Strength</span>
          <span className="text-xs font-bold" style={{ color: strength.color }}>{strength.label}</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-700 overflow-hidden">
          <motion.div
            className="h-full rounded-full transition-all"
            style={{ backgroundColor: strength.color }}
            initial={{ width: 0 }}
            animate={{ width: `${strength.score}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-surface-500">
          <span>Entropy: {strength.entropy} bits</span>
          <span>Time to crack: {strength.timeToCrack}</span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={generate}
        className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
      >
        <RefreshCw size={15} /> Regenerate Password
      </motion.button>
    </ToolWrapper>
  )
}
