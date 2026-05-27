import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, Download, Binary } from 'lucide-react'
import { ToolWrapper, Panel, StyledTextarea, CopyButton, ResetButton, ToolButton } from '../ToolShared'
import toast from 'react-hot-toast'

export const Base64Tool = () => {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [error, setError] = useState('')

  const process = useCallback((val: string, m: typeof mode) => {
    setError('')
    try {
      if (m === 'encode') {
        setOutput(btoa(unescape(encodeURIComponent(val))))
      } else {
        setOutput(decodeURIComponent(escape(atob(val.trim()))))
      }
    } catch {
      setError(m === 'decode' ? 'Invalid Base64 string' : 'Encoding error')
      setOutput('')
    }
  }, [])

  const handleInput = (val: string) => {
    setInput(val)
    process(val, mode)
  }

  const switchMode = (m: typeof mode) => {
    setMode(m)
    process(input, m)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result as string
      const base64 = result.split(',')[1] || result
      if (mode === 'encode') {
        setInput(`[File: ${file.name}]`)
        setOutput(base64)
      } else {
        setInput(base64)
        process(base64, 'decode')
      }
    }
    if (mode === 'encode') reader.readAsDataURL(file)
    else reader.readAsText(file)
    e.target.value = ''
  }

  const handleDownload = () => {
    if (!output) return
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'output.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      handleInput(text)
    } catch { toast.error('Clipboard access denied') }
  }

  return (
    <ToolWrapper>
      {/* Mode toggle */}
      <div className="flex items-center gap-1 p-1 bg-surface-800 rounded-xl w-fit border border-surface-700/40">
        {(['encode', 'decode'] as const).map(m => (
          <motion.button
            key={m}
            whileTap={{ scale: 0.97 }}
            onClick={() => switchMode(m)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
              mode === m
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            {m}
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <Panel
          label={mode === 'encode' ? 'Plain Text Input' : 'Base64 Input'}
          actions={
            <>
              <button onClick={pasteFromClipboard} className="text-[10px] text-brand-400 hover:text-brand-300 font-semibold px-2 py-1 rounded-lg hover:bg-brand-500/10 transition-colors">
                Paste
              </button>
              <label className="cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors" title="Upload file">
                <Upload size={13} />
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
              <ResetButton onClick={() => { setInput(''); setOutput(''); setError('') }} />
            </>
          }
        >
          <StyledTextarea
            value={input}
            onChange={e => handleInput(e.target.value)}
            placeholder={mode === 'encode' ? 'Enter text to encode…' : 'Paste Base64 to decode…'}
            mono
            className="min-h-[200px]"
          />
        </Panel>

        {/* Output */}
        <Panel
          label={mode === 'encode' ? 'Base64 Output' : 'Decoded Output'}
          actions={
            <>
              <CopyButton value={output} />
              <button onClick={handleDownload} disabled={!output} className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors disabled:opacity-40" title="Download">
                <Download size={13} />
              </button>
            </>
          }
        >
          <StyledTextarea
            value={output}
            readOnly
            placeholder="Output will appear here…"
            mono
            className="min-h-[200px]"
            error={error}
          />
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </Panel>
      </div>

      {/* Stats */}
      {input && output && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-4 px-4 py-2.5 bg-surface-800/50 rounded-xl border border-surface-700/40"
        >
          {[
            { label: 'Input', val: `${input.length} chars` },
            { label: 'Output', val: `${output.length} chars` },
            { label: mode === 'encode' ? 'Expansion' : 'Compression', val: input.length > 0 ? `${((output.length / input.length) * 100).toFixed(0)}%` : '—' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="text-[10px] text-surface-500 uppercase tracking-wider">{s.label}</span>
              <span className="text-xs font-mono font-bold text-white">{s.val}</span>
            </div>
          ))}
        </motion.div>
      )}
    </ToolWrapper>
  )
}
