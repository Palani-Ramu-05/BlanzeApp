import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Download, Binary, Image as ImageIcon, FileText, Eye } from 'lucide-react'
import { ToolWrapper, Panel, StyledTextarea, CopyButton, ResetButton } from '../ToolShared'
import toast from 'react-hot-toast'

// Detect if a base64 string encodes a known image format
function detectImageMime(b64: string): string | null {
  try {
    const head = b64.trim().slice(0, 16)
    if (head.startsWith('/9j/')) return 'image/jpeg'
    if (head.startsWith('iVBOR')) return 'image/png'
    if (head.startsWith('R0lG')) return 'image/gif'
    if (head.startsWith('UklG')) return 'image/webp'
    if (head.startsWith('Qk0') || head.startsWith('Qk')) return 'image/bmp'
    if (head.startsWith('PHN2')) return 'image/svg+xml'
    // AVIF
    if (head.startsWith('AAAAIG')) return 'image/avif'
    return null
  } catch { return null }
}

// Strip data URL prefix if present
function extractBase64(input: string): { base64: string; mime: string | null } {
  const trimmed = input.trim()
  if (trimmed.startsWith('data:')) {
    const match = trimmed.match(/^data:([^;]+);base64,(.+)$/)
    if (match) return { base64: match[2], mime: match[1] }
    return { base64: trimmed.split(',')[1] ?? trimmed, mime: null }
  }
  return { base64: trimmed, mime: null }
}

export const Base64Tool = () => {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; type: string } | null>(null)

  const process = useCallback((val: string, m: typeof mode) => {
    setError('')
    setImagePreview(null)

    try {
      if (m === 'encode') {
        const encoded = btoa(unescape(encodeURIComponent(val)))
        setOutput(encoded)
      } else {
        // Handle data URL input
        const { base64, mime: inputMime } = extractBase64(val)

        if (!base64) { setOutput(''); return }

        // Check if it's an image first
        const imageMime = inputMime ?? detectImageMime(base64)
        if (imageMime) {
          const dataUrl = `data:${imageMime};base64,${base64}`
          setImagePreview(dataUrl)
          setOutput(`[Image decoded: ${imageMime}]\nData URL: ${dataUrl.slice(0, 80)}…`)
          return
        }

        // Try text decode
        try {
          const decoded = decodeURIComponent(escape(atob(base64)))
          setOutput(decoded)
        } catch {
          // Raw binary — show as hex representation
          const binary = atob(base64)
          const hex = Array.from(binary).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ')
          setOutput(hex.slice(0, 500) + (hex.length > 500 ? '…' : ''))
        }
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
    setImagePreview(null)
    process(input, m)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileInfo({ name: file.name, size: file.size, type: file.type })
    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result as string
      if (mode === 'encode') {
        const base64 = result.split(',')[1] || btoa(result)
        setInput(`[File: ${file.name} · ${(file.size / 1024).toFixed(1)} KB]`)
        setOutput(base64)
        setError('')
        setImagePreview(null)
      } else {
        const base64 = result.split(',')[1] || result
        setInput(base64)
        process(base64, 'decode')
      }
    }
    // Always read as data URL for binary-safe handling
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleDownload = () => {
    if (!output) return
    if (imagePreview) {
      const a = document.createElement('a')
      a.href = imagePreview
      a.download = 'decoded-image.' + (imagePreview.match(/image\/(\w+)/)?.[1] ?? 'png')
      a.click()
      return
    }
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'decoded.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      handleInput(text)
    } catch { toast.error('Clipboard access denied') }
  }

  const ratio = input.length && output.length
    ? ((output.length / input.length) * 100).toFixed(0) + '%'
    : '—'

  return (
    <ToolWrapper>
      {/* Mode toggle */}
      <div className="flex items-center gap-3 flex-wrap">
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
              {m === 'encode' ? '⬆ Encode' : '⬇ Decode'}
            </motion.button>
          ))}
        </div>
        {fileInfo && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-800/60 border border-surface-700 rounded-xl text-xs text-surface-400">
            {fileInfo.type.startsWith('image/') ? <ImageIcon size={12} /> : <FileText size={12} />}
            <span className="font-medium" style={{ color: 'rgb(var(--color-text-primary))' }}>{fileInfo.name}</span>
            <span>· {(fileInfo.size / 1024).toFixed(1)} KB</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <Panel
          label={mode === 'encode' ? 'Plain Text / File Input' : 'Base64 Input (text or data URL)'}
          actions={
            <>
              <button onClick={pasteFromClipboard} className="text-[10px] text-brand-400 hover:text-brand-300 font-semibold px-2 py-1 rounded-lg hover:bg-brand-500/10 transition-colors">
                Paste
              </button>
              <label className="cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors" title="Upload file">
                <Upload size={13} />
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
              <ResetButton onClick={() => { setInput(''); setOutput(''); setError(''); setImagePreview(null); setFileInfo(null) }} />
            </>
          }
        >
          <StyledTextarea
            value={input}
            onChange={e => handleInput(e.target.value)}
            placeholder={mode === 'encode'
              ? 'Enter text to encode, or upload any file…'
              : 'Paste Base64 string or data URL to decode…'}
            mono
            className="min-h-[200px]"
          />
        </Panel>

        {/* Output */}
        <Panel
          label={mode === 'encode' ? 'Base64 Output' : 'Decoded Output'}
          actions={
            <>
              {!imagePreview && <CopyButton value={output} />}
              <button onClick={handleDownload} disabled={!output && !imagePreview}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors disabled:opacity-40" title="Download">
                <Download size={13} />
              </button>
            </>
          }
        >
          <AnimatePresence mode="wait">
            {imagePreview ? (
              /* Image preview */
              <motion.div
                key="image"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-[200px] flex flex-col gap-3"
              >
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                  <Eye size={13} />
                  Image decoded successfully
                </div>
                <div className="relative rounded-xl overflow-hidden border border-surface-700 bg-[repeating-conic-gradient(#8882_0%_25%,#4442_25%_50%)] bg-[size:16px_16px]">
                  <img
                    src={imagePreview}
                    alt="Decoded"
                    className="w-full h-auto max-h-64 object-contain"
                    style={{ display: 'block' }}
                  />
                </div>
                <div className="text-[10px] text-surface-500 font-mono break-all leading-relaxed bg-surface-800/50 rounded-lg p-2">
                  {imagePreview.slice(0, 100)}…
                </div>
              </motion.div>
            ) : (
              <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StyledTextarea
                  value={output}
                  readOnly
                  placeholder="Output will appear here…"
                  mono
                  className="min-h-[200px]"
                  error={error}
                />
                {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>
      </div>

      {/* Stats */}
      {(input || output) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-4 px-4 py-2.5 bg-surface-800/50 rounded-xl border border-surface-700/40"
        >
          {[
            { label: 'Input', val: `${input.length} chars` },
            { label: mode === 'encode' ? 'Base64 length' : 'Output', val: imagePreview ? 'Image' : `${output.length} chars` },
            { label: mode === 'encode' ? 'Size ratio' : 'Compression', val: ratio },
            imagePreview ? { label: 'Type', val: imagePreview.match(/^data:([^;]+)/)?.[1] ?? 'image' } : null,
          ].filter(Boolean).map(s => (
            <div key={s!.label} className="flex items-center gap-2">
              <span className="text-[10px] text-surface-500 uppercase tracking-wider">{s!.label}</span>
              <span className="text-xs font-mono font-bold" style={{ color: 'rgb(var(--color-text-primary))' }}>{s!.val}</span>
            </div>
          ))}
        </motion.div>
      )}
    </ToolWrapper>
  )
}
