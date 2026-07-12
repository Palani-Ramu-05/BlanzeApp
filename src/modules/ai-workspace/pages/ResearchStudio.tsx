import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@utils/index'
import { Button, Textarea, Tabs } from '@components/index'
import { AppHeader } from '../components/AppHeader'
import { MarkdownRenderer } from '../components/MarkdownRenderer'
import { aiService } from '../services/ai-service'
import type { ResearchTool, StudioRequest, StreamChunk } from '../dto/types'
import {
  Search, Sparkles, StopCircle, Copy, Check, RefreshCw, Trash2,
  Download, BookOpen, FileText, ListChecks, BarChart3, Clock,
  Lightbulb, Quote, Target, TrendingUp, AlertCircle, Layers, ExternalLink,
} from 'lucide-react'

const RESEARCH_TOOLS: { id: ResearchTool; label: string; icon: React.ReactNode; description: string; placeholder: string }[] = [
  { id: 'research', label: 'Research', icon: <Search size={16} />, description: 'Deep research with structured analysis', placeholder: 'Enter a research topic, question, or keywords...' },
  { id: 'summary', label: 'Summary', icon: <ListChecks size={16} />, description: 'Concise summary with key points', placeholder: 'Paste content to summarize...' },
  { id: 'references', label: 'References', icon: <Quote size={16} />, description: 'Generate citations and references', placeholder: 'Enter the research topic for references...' },
]

const OUTPUT_FORMATS = [
  { value: 'standard', label: 'Standard' },
  { value: 'deep', label: 'Deep Research' },
  { value: 'quick', label: 'Quick Summary' },
]

const DEPTH_LABELS: Record<string, string> = {
  quick: 'Quick overview',
  standard: 'Balanced analysis',
  deep: 'In-depth research',
}

export const ResearchStudio = () => {
  const [activeTool, setActiveTool] = useState<ResearchTool>('research')
  const [query, setQuery] = useState('')
  const [depth, setDepth] = useState('standard')
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [progress, setProgress] = useState('')
  const [progressStep, setProgressStep] = useState(0)
  const abortRef = useRef<AbortController | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const PROGRESS_STEPS = [
    'Searching sources...',
    'Analyzing information...',
    activeTool === 'references' ? 'Compiling references...' : 'Generating analysis...',
    'Preparing results...',
    'Finalizing...',
  ]

  useEffect(() => {
    if (result && !isLoading && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [result, isLoading])

  const simulateProgress = useCallback(() => {
    setProgressStep(0)
    setProgress(PROGRESS_STEPS[0])
    const interval = setInterval(() => {
      setProgressStep((prev) => {
        const next = prev + 1
        if (next < PROGRESS_STEPS.length) {
          setProgress(PROGRESS_STEPS[next])
          return next
        }
        clearInterval(interval)
        return prev
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [activeTool])

  const handleGenerate = async () => {
    if (!query.trim()) return
    setIsLoading(true)
    setIsStreaming(true)
    setError(null)
    setResult('')
    setProgress('Starting...')
    setProgressStep(0)

    const clearProgress = simulateProgress()
    const controller = new AbortController()
    abortRef.current = controller

    const request: StudioRequest = {
      tool: activeTool,
      input: query.trim(),
      depth: depth,
      stream: true,
    }

    try {
      const fullContent = await aiService.streamResearch(
        request,
        (chunk: StreamChunk) => {
          if (chunk.content) setResult((prev) => prev + chunk.content)
        },
        { signal: controller.signal },
      )
      setResult(fullContent)
      setProgress('Completed')
      setProgressStep(PROGRESS_STEPS.length)
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) return
      setError(err?.message || 'Research failed')
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      abortRef.current = null
      clearProgress()
    }
  }

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
    setIsLoading(false)
    setIsStreaming(false)
  }, [])

  const handleClear = useCallback(() => {
    setResult('')
    setError(null)
    setCopied(false)
    setProgress('')
    setProgressStep(0)
    abortRef.current?.abort()
  }, [])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [result])

  const handleDownload = useCallback(() => {
    const content = `# Research: ${query}\n\n${result}`
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = `research-${query.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [result, query])

  const handleRetry = useCallback(() => {
    handleGenerate()
  }, [query, depth, activeTool])

  const hasResult = result || error

  const activeConfig = RESEARCH_TOOLS.find(t => t.id === activeTool)

  return (
    <div className="flex flex-col h-full bg-[rgb(var(--color-bg-primary))]">
      <AppHeader
        icon={<Search size={16} />}
        title="Research Studio"
        gradient="linear-gradient(135deg, #f97316, #fb923c)"
        breadcrumbs={[
          { label: 'AI Workspace', href: '/ai' },
          { label: 'Research Studio' },
          ...(activeConfig ? [{ label: activeConfig.label }] : []),
        ]}
        subtitle={activeConfig?.description}
      />

      <div className="px-6 py-2 border-b border-surface-700/20 flex-shrink-0 bg-surface-900/20 overflow-x-auto">
        <Tabs
          tabs={RESEARCH_TOOLS.map((t) => ({ id: t.id, label: t.label, icon: t.icon }))}
          activeTab={activeTool}
          onChange={(id) => { setActiveTool(id as ResearchTool); handleClear() }}
          variant="underline"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-surface-400">
              {activeTool === 'research' ? 'Research Topic' :
               activeTool === 'summary' ? 'Content to Summarize' :
               activeTool === 'references' ? 'Research Topic' : 'Input'}
            </label>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={activeConfig?.placeholder || 'Enter your research topic...'}
              rows={activeTool === 'summary' ? 8 : 4}
              containerClassName="w-full"
            />
          </div>

          {activeTool === 'research' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-surface-400">Research Depth</label>
              <div className="flex flex-wrap gap-1.5">
                {OUTPUT_FORMATS.map((fmt) => (
                  <button
                    key={fmt.value}
                    onClick={() => setDepth(fmt.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                      depth === fmt.value
                        ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                        : 'bg-surface-900/60 border-surface-700/40 text-surface-400 hover:border-surface-600',
                    )}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-surface-500 mt-1">{DEPTH_LABELS[depth] || ''}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              onClick={handleGenerate}
              disabled={!query.trim() || isLoading}
              loading={isLoading}
              icon={<Sparkles size={14} />}
              size="md"
            >
              {isLoading ? (activeTool === 'research' ? 'Researching...' : activeTool === 'summary' ? 'Summarizing...' : 'Generating...') :
               activeTool === 'research' ? 'Research' :
               activeTool === 'summary' ? 'Summarize' :
               activeTool === 'references' ? 'Generate References' : 'Generate'}
            </Button>
            {isStreaming && (
              <Button variant="ghost" size="sm" icon={<StopCircle size={14} />} onClick={handleStop}>
                Stop
              </Button>
            )}
            {hasResult && (
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

          {isLoading && !result && (
            <div className="p-4 rounded-xl bg-surface-900/60 border border-surface-700/40 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-surface-400">{progress}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {PROGRESS_STEPS.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 flex-1">
                    <div className={cn(
                      'w-full h-1 rounded-full transition-all duration-500',
                      idx < progressStep ? 'bg-brand-400' :
                      idx === progressStep ? 'bg-brand-400/50 animate-pulse' :
                      'bg-surface-700/40'
                    )} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasResult && (
            <div ref={resultRef} className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-surface-400">
                  {activeTool === 'research' ? 'Research Results' :
                   activeTool === 'summary' ? 'Summary' :
                   activeTool === 'references' ? 'References' : 'Result'}
                </label>
                <div className="flex items-center gap-1">
                  {result && !isStreaming && (
                    <>
                      <button onClick={handleCopy} className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all" title="Copy">
                        {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                      </button>
                      <button onClick={handleDownload} className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all" title="Download Markdown">
                        <Download size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {error ? (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-400">Research Error</p>
                      <p className="text-sm text-red-300/80 mt-1">{error}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Button variant="ghost" size="xs" icon={<RefreshCw size={12} />} onClick={handleRetry}>Retry</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-surface-900/60 border border-surface-700/40">
                  <div className="text-sm leading-relaxed text-[rgb(var(--color-text-primary))]">
                    <MarkdownRenderer content={result} />
                    {isStreaming && <span className="inline-block w-2 h-4 bg-brand-400 animate-pulse ml-0.5 rounded-sm" />}
                  </div>
                </div>
              )}
            </div>
          )}

          {!query && !result && !isLoading && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Search size={16} />, text: 'Deep research with structured sections' },
                  { icon: <ListChecks size={16} />, text: 'Key findings & bullet-point insights' },
                  { icon: <Quote size={16} />, text: 'Citations and reference generation' },
                  { icon: <Download size={16} />, text: 'Export as Markdown' },
                ].map((tip, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-900/30 border border-surface-700/30">
                    <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center text-surface-400">{tip.icon}</div>
                    <span className="text-xs text-surface-400">{tip.text}</span>
                  </div>
                ))}
              </div>

              {activeTool === 'research' && (
                <div className="p-4 rounded-xl bg-surface-900/30 border border-dashed border-surface-700/30">
                  <p className="text-xs text-surface-500 flex items-center gap-2">
                    <Lightbulb size={12} className="text-brand-400" />
                    Try topics like: "Latest developments in AI", "Climate change solutions", "History of quantum computing", "Best practices for microservices architecture"
                  </p>
                </div>
              )}
            </div>
          )}

          {result && !isStreaming && !error && (
            <div className="flex items-center gap-3 text-[10px] text-surface-500 pt-1">
              <span>{(result.length / 4).toFixed(0)} tokens approx</span>
              <span>{result.split('\n').length} lines</span>
              {activeTool === 'research' && <span className="text-brand-400">Research complete</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
