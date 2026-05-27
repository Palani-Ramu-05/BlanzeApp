import { useState, useCallback } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { ToolWrapper, Panel, StyledTextarea, StyledInput, CopyButton, ResetButton, ToolButton } from '../ToolShared'

export const URLEncoderTool = () => {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [preserve, setPreserve] = useState(false)

  const output = useCallback(() => {
    if (!input) return ''
    try {
      if (mode === 'encode') return preserve ? input.split('').map(c => /[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]/.test(c) ? c : encodeURIComponent(c)).join('') : encodeURIComponent(input)
      return decodeURIComponent(input.trim())
    } catch { return '⚠ Invalid URL encoding' }
  }, [input, mode, preserve])

  const result = output()

  return (
    <ToolWrapper>
      {/* Mode toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-surface-800 rounded-xl border border-surface-700/40">
          {(['encode', 'decode'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${mode === m ? 'bg-brand-600 text-white' : 'text-surface-400 hover:text-white'}`}
            >
              {m}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-surface-300 select-none">
          <div
            className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${preserve ? 'bg-brand-600' : 'bg-surface-700'}`}
            onClick={() => setPreserve(v => !v)}
          >
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${preserve ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          Preserve URL structure
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel
          label="Input"
          actions={
            <>
              <button
                onClick={async () => { try { setInput(await navigator.clipboard.readText()) } catch {} }}
                className="text-[10px] text-brand-400 hover:text-brand-300 font-semibold px-2 py-1 rounded-lg hover:bg-brand-500/10 transition-colors"
              >
                Paste
              </button>
              <ResetButton onClick={() => setInput('')} />
            </>
          }
        >
          <StyledTextarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={mode === 'encode' ? 'Enter text or URL to encode…' : 'Enter encoded URL to decode…'}
            mono
            className="min-h-[180px]"
          />
        </Panel>

        <Panel
          label="Output"
          actions={<CopyButton value={result} />}
        >
          <StyledTextarea
            value={result}
            readOnly
            placeholder="Output will appear here…"
            mono
            className="min-h-[180px]"
          />
        </Panel>
      </div>

      {input && result && !result.startsWith('⚠') && (
        <div className="flex flex-wrap gap-4 px-4 py-2.5 bg-surface-800/50 rounded-xl border border-surface-700/40">
          {[
            { label: 'Input length', val: input.length },
            { label: 'Output length', val: result.length },
            { label: 'Δ Characters', val: result.length - input.length },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="text-[10px] text-surface-500 uppercase tracking-wider">{s.label}</span>
              <span className="text-xs font-mono font-bold text-white">{s.val}</span>
            </div>
          ))}
        </div>
      )}
    </ToolWrapper>
  )
}
