import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@utils/index'
import { Button, Textarea, Tabs } from '@components/index'
import { useNavigate } from 'react-router-dom'
import { aiService } from '../services/ai-service'
import { CodeBlock } from '../components/CodeBlock'
import { AppHeader } from '../components/AppHeader'
import type { CodingTool, StudioRequest, StreamChunk } from '../dto/types'
import {
  Code2, Sparkles, StopCircle, Copy, Check, Trash2, RefreshCw,
  FileCode, BookOpen, GitBranch, TestTube, Database, Regex,
  Shield, Zap, Bug, ArrowLeftRight, MessageSquare, Network, FileText,
  Settings2, Palette, Languages, Terminal,
} from 'lucide-react'

interface ToolConfig {
  id: CodingTool
  label: string
  description: string
  icon: React.ReactNode
  placeholder: string
  badge?: string
  category: string
}

const TOOLS: ToolConfig[] = [
  { id: 'generate-code', label: 'Generate', description: 'Generate code from description', icon: <Code2 size={16} />, placeholder: 'Describe the code you want to generate...', badge: 'Popular', category: 'generate' },
  { id: 'explain-code', label: 'Explain', description: 'Get detailed explanation of code', icon: <BookOpen size={16} />, placeholder: 'Paste code to get an explanation...', category: 'analyze' },
  { id: 'code-review', label: 'Review', description: 'Thorough code review with issues table', icon: <FileCode size={16} />, placeholder: 'Paste code for review...', badge: 'New', category: 'analyze' },
  { id: 'refactor', label: 'Refactor', description: 'Clean up and improve code structure', icon: <GitBranch size={16} />, placeholder: 'Paste code to refactor...', category: 'improve' },
  { id: 'optimize', label: 'Optimize', description: 'Optimize code for performance', icon: <Zap size={16} />, placeholder: 'Paste code to optimize...', category: 'improve' },
  { id: 'bug-fixer', label: 'Bug Fix', description: 'Detect and fix bugs with analysis', icon: <Bug size={16} />, placeholder: 'Paste code with bugs to fix...', badge: 'New', category: 'improve' },
  { id: 'code-converter', label: 'Convert', description: 'Convert code between languages', icon: <ArrowLeftRight size={16} />, placeholder: 'Paste code to convert...', badge: 'New', category: 'convert' },
  { id: 'generate-sql', label: 'SQL', description: 'Generate SQL queries', icon: <Database size={16} />, placeholder: 'Describe the SQL query you need...', category: 'convert' },
  { id: 'regex-generator', label: 'Regex', description: 'Generate regex patterns', icon: <Regex size={16} />, placeholder: 'Describe the regex pattern...', category: 'convert' },
  { id: 'unit-test-generator', label: 'Tests', description: 'Generate unit tests', icon: <TestTube size={16} />, placeholder: 'Paste code to generate unit tests...', category: 'test-doc' },
  { id: 'api-generator', label: 'API', description: 'Generate API endpoint code', icon: <Terminal size={16} />, placeholder: 'Describe the API endpoint...', category: 'test-doc' },
  { id: 'documentation-generator', label: 'Docs', description: 'Generate code documentation', icon: <FileText size={16} />, placeholder: 'Paste code to document...', category: 'test-doc' },
  { id: 'commit-message', label: 'Commit', description: 'Generate commit messages', icon: <MessageSquare size={16} />, placeholder: 'Describe code changes...', badge: 'New', category: 'devops' },
  { id: 'diagram-generator', label: 'Diagram', description: 'Generate mermaid diagrams', icon: <Network size={16} />, placeholder: 'Describe the diagram you need...', badge: 'New', category: 'devops' },
  { id: 'security-analysis', label: 'Security', description: 'Security vulnerability analysis', icon: <Shield size={16} />, placeholder: 'Paste code for security analysis...', badge: 'New', category: 'devops' },
  { id: 'performance-analysis', label: 'Performance', description: 'Performance bottleneck analysis', icon: <Zap size={16} />, placeholder: 'Paste code for performance analysis...', badge: 'New', category: 'devops' },
]

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'generate', label: 'Generate' },
  { id: 'analyze', label: 'Analyze' },
  { id: 'improve', label: 'Improve' },
  { id: 'convert', label: 'Convert' },
  { id: 'test-doc', label: 'Test & Docs' },
  { id: 'devops', label: 'DevOps' },
]

const LANGUAGES = [
  { value: '', label: 'Auto-detect' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'bash', label: 'Bash' },
  { value: 'yaml', label: 'YAML' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
]

const TARGET_LANGUAGES = LANGUAGES.slice(1)

export const CodingStudio = () => {
  const [activeTool, setActiveTool] = useState<CodingTool>('generate-code')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)

  return (
    <div className="flex flex-col h-full bg-[rgb(var(--color-bg-primary))]">
      <AppHeader
        icon={<Code2 size={16} />}
        title="Coding Studio"
        gradient="linear-gradient(135deg, #8b5cf6, #a78bfa)"
        breadcrumbs={[
          { label: 'AI Workspace', href: '/ai' },
          { label: 'Coding Studio' },
          { label: TOOLS.find(t => t.id === activeTool)?.label || '' },
        ]}
        subtitle={TOOLS.find(t => t.id === activeTool)?.description}
      >
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className={cn(
            'p-1.5 rounded-lg transition-all',
            rightPanelOpen ? 'bg-brand-500/20 text-brand-400' : 'text-surface-500 hover:text-surface-200 hover:bg-surface-800/60',
          )}
          aria-label="Settings"
        >
          <Settings2 size={16} />
        </button>
      </AppHeader>

      <div className="flex flex-1 overflow-hidden">
        <aside className={cn(
          'flex-shrink-0 border-r border-surface-700/20 bg-surface-900/30 transition-all duration-200 overflow-y-auto',
          sidebarCollapsed ? 'w-12' : 'w-56',
        )}>
          <div className="p-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all mb-2"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn('mx-auto transition-transform', sidebarCollapsed && 'rotate-180')}>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>
          {!sidebarCollapsed && CATEGORIES.map((cat) => {
            const catTools = TOOLS.filter(t => t.category === cat.id)
            if (catTools.length === 0) return null
            return (
              <div key={cat.id} className="mb-3">
                <div className="px-3 py-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">{cat.label}</p>
                </div>
                {catTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-xs transition-all text-left',
                      activeTool === tool.id
                        ? 'bg-brand-500/10 text-brand-400 border-l-2 border-brand-400'
                        : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/40 border-l-2 border-transparent',
                    )}
                  >
                    <span className="flex-shrink-0">{tool.icon}</span>
                    <span className="flex-1 truncate">{tool.label}</span>
                    {tool.badge && (
                      <span className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded-full font-medium',
                        tool.badge === 'New' ? 'bg-green-500/10 text-green-400' : 'bg-brand-500/10 text-brand-400',
                      )}>
                        {tool.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )
          })}
        </aside>

        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="max-w-4xl mx-auto p-6">
            <CodingToolView
              key={activeTool}
              tool={activeTool}
              config={TOOLS.find(t => t.id === activeTool)!}
            />
          </div>
        </main>

        {rightPanelOpen && (
          <aside className="w-64 flex-shrink-0 border-l border-surface-700/20 bg-surface-900/30 overflow-y-auto p-4">
            <CodingSettingsPanel tool={activeTool} />
          </aside>
        )}
      </div>
    </div>
  )
}

function CodingSettingsPanel({ tool }: { tool: CodingTool }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-surface-700/20">
        <Settings2 size={14} className="text-surface-400" />
        <h3 className="text-xs font-semibold text-surface-300">Settings</h3>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-medium text-surface-500 uppercase tracking-wider">Language</label>
        <select
          id="code-lang"
          className="w-full px-2.5 py-1.5 rounded-lg bg-surface-800/60 border border-surface-700/40 text-xs text-surface-300 focus:outline-none focus:border-brand-400/50"
          defaultValue=""
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      {(tool === 'code-converter') && (
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-surface-500 uppercase tracking-wider">Target Language</label>
          <select
            id="target-lang"
            className="w-full px-2.5 py-1.5 rounded-lg bg-surface-800/60 border border-surface-700/40 text-xs text-surface-300 focus:outline-none focus:border-brand-400/50"
          >
            {TARGET_LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[10px] font-medium text-surface-500 uppercase tracking-wider">Theme</label>
        <select
          id="code-theme"
          className="w-full px-2.5 py-1.5 rounded-lg bg-surface-800/60 border border-surface-700/40 text-xs text-surface-300 focus:outline-none focus:border-brand-400/50"
          defaultValue="one-dark"
        >
          <option value="one-dark">One Dark</option>
          <option value="one-light">One Light</option>
          <option value="github">GitHub</option>
          <option value="monokai">Monokai</option>
          <option value="dracula">Dracula</option>
          <option value="nord">Nord</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-medium text-surface-500 uppercase tracking-wider">Font Size</label>
        <select
          id="font-size"
          className="w-full px-2.5 py-1.5 rounded-lg bg-surface-800/60 border border-surface-700/40 text-xs text-surface-300 focus:outline-none focus:border-brand-400/50"
          defaultValue="13"
        >
          <option value="12">12px</option>
          <option value="13">13px</option>
          <option value="14">14px</option>
          <option value="15">15px</option>
          <option value="16">16px</option>
        </select>
      </div>

      <div className="pt-2 border-t border-surface-700/20">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" defaultChecked className="rounded border-surface-600 bg-surface-800 text-brand-500 focus:ring-brand-500/30" />
          <span className="text-xs text-surface-400">Stream responses</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer mt-2">
          <input type="checkbox" defaultChecked className="rounded border-surface-600 bg-surface-800 text-brand-500 focus:ring-brand-500/30" />
          <span className="text-xs text-surface-400">Show line numbers</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer mt-2">
          <input type="checkbox" defaultChecked className="rounded border-surface-600 bg-surface-800 text-brand-500 focus:ring-brand-500/30" />
          <span className="text-xs text-surface-400">Auto-scroll</span>
        </label>
      </div>
    </div>
  )
}

function CodingToolView({ tool, config }: { tool: CodingTool; config: ToolConfig }) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [detectedLang, setDetectedLang] = useState('')
  const [tokens, setTokens] = useState(0)
  const [latency, setLatency] = useState(0)
  const resultRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (result && !isStreaming && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [result, isStreaming])

  const handleGenerate = async () => {
    if (!input.trim()) return
    setIsLoading(true)
    setIsStreaming(true)
    setError(null)
    setResult('')
    setDetectedLang('')
    setTokens(0)
    setLatency(0)

    const startTime = Date.now()
    const controller = new AbortController()
    abortRef.current = controller

    const langSelect = window.document.getElementById('code-lang') as HTMLSelectElement
    const targetLangSelect = window.document.getElementById('target-lang') as HTMLSelectElement
    const language = langSelect?.value || ''
    const targetLanguage = targetLangSelect?.value || ''

    const request: StudioRequest = {
      tool,
      input: input.trim(),
      language: language || undefined,
      targetLanguage: targetLanguage || undefined,
      stream: true,
    }

    let tokenCount = 0

    try {
      const fullContent = await aiService.streamCoding(
        request,
        (chunk: StreamChunk) => {
          if (chunk.content) {
            setResult((prev) => prev + chunk.content)
            tokenCount += chunk.content.length
          }
          if (chunk.metadata) {
            if (chunk.metadata.language) setDetectedLang(chunk.metadata.language as string)
          }
        },
        { signal: controller.signal },
      )

      setResult(fullContent)
      setTokens(tokenCount)
      setLatency(Date.now() - startTime)
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) return
      setError(err?.message || 'Generation failed')
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      abortRef.current = null
    }
  }

  const handleStop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setIsLoading(false)
    setIsStreaming(false)
  }, [])

  const handleClear = useCallback(() => {
    setResult('')
    setError(null)
    setCopied(false)
    setDetectedLang('')
    setTokens(0)
    setLatency(0)
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
  }, [])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [result])

  const handleRetry = useCallback(() => {
    handleGenerate()
  }, [input, tool])

  const resultContent = result || error || ''

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold text-[rgb(var(--color-text-primary))]">{config.label}</h2>
            {config.badge && (
              <span className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-medium',
                config.badge === 'New' ? 'bg-green-500/10 text-green-400' : 'bg-brand-500/10 text-brand-400',
              )}>
                {config.badge}
              </span>
            )}
          </div>
          <p className="text-sm text-surface-400 mt-0.5">{config.description}</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-surface-400 flex items-center gap-1.5">
          <Code2 size={12} />
          Input
        </label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={config.placeholder}
          rows={6}
          containerClassName="w-full"
        />
        <div className="flex items-center gap-2">
          <Button
            onClick={handleGenerate}
            disabled={!input.trim() || isLoading}
            loading={isLoading}
            icon={<Sparkles size={14} />}
            size="md"
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </Button>
          {isStreaming && (
            <Button
              variant="ghost"
              size="sm"
              icon={<StopCircle size={14} />}
              onClick={handleStop}
            >
              Stop
            </Button>
          )}
          {(result || error) && (
            <>
              <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={handleRetry}>
                Retry
              </Button>
              <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={handleClear}>
                Clear
              </Button>
            </>
          )}
        </div>
      </div>

      <div ref={resultRef}>
        {isLoading && !result && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-900/60 border border-surface-700/40">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-surface-400">Generating...</span>
          </div>
        )}

        {(result || error) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-surface-400">Result</label>
                {detectedLang && (
                  <span className="text-[10px] text-surface-500 bg-surface-800/60 px-2 py-0.5 rounded-full">{detectedLang}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {result && !isStreaming && (
                  <>
                    <button onClick={handleCopy} className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all" aria-label="Copy">
                      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                    </button>
                    <button onClick={handleClear} className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-all" aria-label="Clear">
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {error ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            ) : (
              <CodeBlock
                code={result}
                language={detectedLang || (tool === 'generate-sql' ? 'sql' : undefined)}
              />
            )}

            {!isLoading && result && !error && (
              <div className="flex items-center gap-3 text-[10px] text-surface-500">
                <span>{(result.length / 4).toFixed(0)} tokens</span>
                <span>{latency > 0 ? `${(latency / 1000).toFixed(1)}s` : ''}</span>
                <span>{result.split('\n').length} lines</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
