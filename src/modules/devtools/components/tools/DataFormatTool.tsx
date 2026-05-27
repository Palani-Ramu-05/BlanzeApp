import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftRight, Upload, Download, AlertCircle } from 'lucide-react'
import { ToolWrapper, Panel, CopyButton, ToolButton } from '../ToolShared'
import { jsonToYaml, yamlToJson, jsonToXml, xmlToJson, jsonToCsv, csvToJson, formatJSON, minifyJSON } from '../../utils/dataUtils'

type Format = 'JSON' | 'YAML' | 'XML' | 'CSV'
const FORMATS: Format[] = ['JSON', 'YAML', 'XML', 'CSV']

const CONVERT: Partial<Record<`${Format}->${Format}`, (s: string) => string>> = {
  'JSON->YAML': jsonToYaml,
  'YAML->JSON': yamlToJson,
  'JSON->XML': jsonToXml,
  'XML->JSON': xmlToJson,
  'JSON->CSV': jsonToCsv,
  'CSV->JSON': csvToJson,
  'YAML->XML': (s) => jsonToXml(yamlToJson(s)),
  'XML->YAML': (s) => jsonToYaml(xmlToJson(s)),
  'CSV->XML': (s) => jsonToXml(csvToJson(s)),
  'XML->CSV': (s) => jsonToCsv(xmlToJson(s)),
  'YAML->CSV': (s) => jsonToCsv(yamlToJson(s)),
  'CSV->YAML': (s) => jsonToYaml(csvToJson(s)),
}

const SAMPLE = {
  JSON: `[\n  {\n    "agent_name": "GPT",\n    "observability_id": "019d724b-89cc-732b-8677-c91"\n  },\n  {\n    "agent_name": "Montos",\n    "observability_id": "019d724b-89cc-732b-8677-c91"\n  }\n]`,
  YAML: `- agent_name: GPT\n  observability_id: 019d724b\n- agent_name: Montos\n  observability_id: 019d724b`,
  XML: `<?xml version="1.0"?>\n<root>\n  <item>\n    <agent_name>GPT</agent_name>\n  </item>\n</root>`,
  CSV: `agent_name,observability_id\nGPT,019d724b\nMontos,019d724b`,
}

export const DataFormatTool = () => {
  const [from, setFrom] = useState<Format>('JSON')
  const [to, setTo] = useState<Format>('XML')
  const [input, setInput] = useState(SAMPLE.JSON)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const convert = useCallback(() => {
    setError('')
    if (!input.trim()) { setOutput(''); return }
    const key = `${from}->${to}` as `${Format}->${Format}`
    const fn = from === to ? (s: string) => from === 'JSON' ? formatJSON(s) : s : CONVERT[key]
    if (!fn) { setError(`Conversion from ${from} to ${to} is not supported yet.`); return }
    try {
      setOutput(fn(input))
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }, [from, to, input])

  const swap = () => { setFrom(to); setTo(from); setInput(output || input); setOutput('') }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = ev => setInput(ev.target?.result as string)
    reader.readAsText(f)
    e.target.value = ''
  }

  const downloadOutput = () => {
    if (!output) return
    const ext: Record<Format, string> = { JSON: 'json', YAML: 'yml', XML: 'xml', CSV: 'csv' }
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `converted.${ext[to]}`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ToolWrapper>
      {/* Format selectors + convert */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={from} onChange={e => setFrom(e.target.value as Format)}
          className="px-3 py-2 rounded-xl bg-surface-800 border border-surface-700/60 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/50">
          {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <button onClick={swap} className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-800 border border-surface-700/60 text-surface-400 hover:text-white hover:border-brand-500/50 transition-colors">
          <ArrowLeftRight size={15} />
        </button>
        <select value={to} onChange={e => setTo(e.target.value as Format)}
          className="px-3 py-2 rounded-xl bg-surface-800 border border-surface-700/60 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/50">
          {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <ToolButton variant="primary" size="md" onClick={convert}>Convert</ToolButton>
        {from === 'JSON' && (
          <>
            <ToolButton variant="secondary" size="sm" onClick={() => { try { setInput(formatJSON(input)) } catch {} }}>Format</ToolButton>
            <ToolButton variant="secondary" size="sm" onClick={() => { try { setInput(minifyJSON(input)) } catch {} }}>Minify</ToolButton>
          </>
        )}
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel label={`Input — ${from}`} actions={
          <>
            <label className="cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors" title="Upload file">
              <Upload size={13} />
              <input type="file" className="hidden" onChange={handleFileUpload} accept=".json,.yaml,.yml,.xml,.csv" />
            </label>
          </>
        }>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            className="w-full min-h-[280px] px-3 py-2.5 font-mono text-xs text-white bg-transparent resize-none focus:outline-none"
            spellCheck={false}
            placeholder={`Paste or type your ${from} here…`}
          />
        </Panel>

        <Panel label={`Output — ${to}`} actions={
          <>
            <CopyButton value={output} />
            <button onClick={downloadOutput} disabled={!output} className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 disabled:opacity-40 transition-colors">
              <Download size={13} />
            </button>
          </>
        }>
          {error ? (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 font-mono">{error}</p>
            </div>
          ) : (
            <textarea
              value={output}
              readOnly
              className="w-full min-h-[280px] px-3 py-2.5 font-mono text-xs text-emerald-300 bg-transparent resize-none focus:outline-none"
              placeholder="Output will appear here…"
            />
          )}
        </Panel>
      </div>

      {/* Drop file hint */}
      <p className="text-[10px] text-surface-600 text-center">Drop your JSON / YAML / XML / CSV file into the input panel upload button</p>
    </ToolWrapper>
  )
}
