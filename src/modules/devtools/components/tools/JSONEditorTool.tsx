import { useState, lazy, Suspense, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, Download, CheckCircle2, XCircle, AlignLeft } from 'lucide-react'
import { ToolWrapper, ToolButton, CopyButton } from '../ToolShared'
import { formatJSON, minifyJSON } from '../../utils/dataUtils'

const MonacoEditor = lazy(() => import('@monaco-editor/react').then(m => ({ default: m.default })))

const SAMPLE_JSON = `{
  "name": "BlanzeApp",
  "version": "1.0.0",
  "description": "Enterprise Dashboard",
  "dependencies": {
    "react": "^19.0.0",
    "typescript": "^5.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build"
  }
}`

export const JSONEditorTool = () => {
  const [value, setValue] = useState(SAMPLE_JSON)
  const [validation, setValidation] = useState<{ valid: boolean; message: string } | null>(null)

  const validate = useCallback((src: string) => {
    try {
      JSON.parse(src)
      setValidation({ valid: true, message: 'Valid JSON' })
    } catch (e) {
      setValidation({ valid: false, message: (e as Error).message })
    }
  }, [])

  const handleFormat = () => {
    try { setValue(formatJSON(value)); validate(value) } catch {}
  }

  const handleMinify = () => {
    try { setValue(minifyJSON(value)); validate(value) } catch {}
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      setValue(text)
      validate(text)
    }
    reader.readAsText(f)
    e.target.value = ''
  }

  const handleDownload = () => {
    const blob = new Blob([value], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'data.json'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ToolWrapper>
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <ToolButton variant="primary" size="sm" icon={<AlignLeft size={12} />} onClick={handleFormat}>Format</ToolButton>
        <ToolButton variant="secondary" size="sm" onClick={handleMinify}>Minify</ToolButton>
        <ToolButton variant="secondary" size="sm" onClick={() => validate(value)}>Validate</ToolButton>
        <div className="flex-1" />
        <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface-800 border border-surface-700/60 text-surface-300 hover:text-white hover:border-surface-600 transition-colors">
          <Upload size={12} /> Upload JSON
          <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
        </label>
        <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface-800 border border-surface-700/60 text-surface-300 hover:text-white transition-colors">
          <Download size={12} /> Download
        </button>
        <CopyButton value={value} />
      </div>

      {/* Validation status */}
      {validation && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
            validation.valid
              ? 'bg-green-500/10 border-green-500/20 text-green-300'
              : 'bg-red-500/10 border-red-500/20 text-red-300'
          }`}
        >
          {validation.valid ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
          {validation.message}
        </motion.div>
      )}

      {/* Editor */}
      <div className="rounded-xl border border-surface-700/60 overflow-hidden" style={{ height: 420 }}>
        <Suspense fallback={
          <div className="h-full bg-surface-900 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
          </div>
        }>
          <MonacoEditor
            height="420px"
            defaultLanguage="json"
            value={value}
            onChange={v => { setValue(v || ''); validate(v || '') }}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineHeight: 22,
              padding: { top: 12, bottom: 12 },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              formatOnPaste: true,
              tabSize: 2,
              renderLineHighlight: 'gutter',
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              smoothScrolling: true,
            }}
          />
        </Suspense>
      </div>
    </ToolWrapper>
  )
}
