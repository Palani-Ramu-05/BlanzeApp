import { useMemo, useState, useCallback } from 'react'
import { createLowlight, common } from 'lowlight'
import { cn } from '@utils/index'
import { Copy, Check, Download, Maximize2, Minimize2, FileCode } from 'lucide-react'

const lowlight = createLowlight(common)

interface CodeBlockProps {
  code: string
  language?: string
  showLineNumbers?: boolean
  className?: string
}

function highlightCode(code: string, language?: string): string {
  const lang = language || 'text'
  try {
    const tree = lowlight.highlight(lang, code)
    return renderTree(tree)
  } catch {
    return escapeHtml(code)
  }
}

function renderTree(tree: any): string {
  return (tree.children || []).map(renderNode).join('')
}

function renderNode(node: any): string {
  if (node.type === 'text') return escapeHtml(node.value)
  if (node.type === 'element') {
    const tag = node.tagName || 'span'
    const cls = node.properties?.className?.join(' ') || ''
    const children = (node.children || []).map(renderNode).join('')
    return `<${tag}${cls ? ` class="${cls}"` : ''}>${children}</${tag}>`
  }
  return ''
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export const CodeBlock = ({ code, language, showLineNumbers = true, className }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const highlighted = useMemo(() => highlightCode(code, language), [code, language])
  const lineCount = useMemo(() => code.split('\n').length, [code])
  const langLabel = language || 'text'

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = `code.${langLabel}`
    a.click()
    URL.revokeObjectURL(url)
  }, [code, langLabel])

  return (
    <div className={cn(
      'rounded-xl border border-surface-700/40 overflow-hidden bg-[#1e1e2e]',
      expanded && 'fixed inset-4 z-50 shadow-2xl',
      className,
    )}>
      <div className="flex items-center justify-between px-4 py-2 bg-surface-800/60 border-b border-surface-700/30">
        <div className="flex items-center gap-2">
          <FileCode size={14} className="text-surface-400" />
          <span className="text-xs font-medium text-surface-400 uppercase">{langLabel}</span>
          <span className="text-[10px] text-surface-500">{lineCount} lines</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleCopy} className="p-1.5 rounded text-surface-500 hover:text-surface-200 hover:bg-surface-700/60 transition-all" title="Copy code">
            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          </button>
          <button onClick={handleDownload} className="p-1.5 rounded text-surface-500 hover:text-surface-200 hover:bg-surface-700/60 transition-all" title="Download">
            <Download size={13} />
          </button>
          {lineCount > 1 && (
            <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded text-surface-500 hover:text-surface-200 hover:bg-surface-700/60 transition-all" title={expanded ? 'Minimize' : 'Expand'}>
              {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}
        </div>
      </div>
      <div className="overflow-auto" style={{ maxHeight: expanded ? 'calc(100vh - 8rem)' : '600px' }}>
        {showLineNumbers ? (
          <div className="flex">
            <div className="select-none text-right px-3 py-3 text-[11px] leading-[22px] text-surface-600 border-r border-surface-700/20 font-mono whitespace-nowrap">
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <pre className="flex-1 px-4 py-3 text-[13px] font-mono leading-[22px] overflow-x-auto m-0 bg-transparent">
              <code dangerouslySetInnerHTML={{ __html: highlighted }} />
            </pre>
          </div>
        ) : (
          <pre className="px-4 py-3 text-[13px] font-mono leading-[22px] overflow-x-auto m-0 bg-transparent">
            <code dangerouslySetInnerHTML={{ __html: highlighted }} />
          </pre>
        )}
      </div>
    </div>
  )
}
