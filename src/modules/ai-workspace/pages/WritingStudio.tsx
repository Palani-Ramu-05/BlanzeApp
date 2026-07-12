import { useState, useCallback, useRef } from 'react'
import { cn } from '@utils/index'
import { Button, Textarea, Tabs } from '@components/index'
import { PenTool, Sparkles, StopCircle, Copy, Check, Trash2 } from 'lucide-react'
import { MarkdownRenderer } from '../components/MarkdownRenderer'
import { TypingIndicator } from '../components/TypingIndicator'
import { AppHeader } from '../components/AppHeader'
import { aiService } from '../services/ai-service'
import type { WritingTool, StudioRequest, StreamChunk } from '../dto/types'

const WRITING_TOOLS: { id: WritingTool; label: string; placeholder: string }[] = [
  { id: 'email', label: 'Email', placeholder: 'Describe the email you want to write...' },
  { id: 'grammar-fix', label: 'Grammar Fix', placeholder: 'Paste text with grammar issues...' },
  { id: 'rewrite', label: 'Rewrite', placeholder: 'Paste text to rewrite...' },
  { id: 'professional-tone', label: 'Professional Tone', placeholder: 'Paste text to make professional...' },
  { id: 'friendly-tone', label: 'Friendly Tone', placeholder: 'Paste text to make friendly...' },
  { id: 'summarize', label: 'Summarize', placeholder: 'Paste text to summarize...' },
  { id: 'expand', label: 'Expand', placeholder: 'Paste text to expand...' },
  { id: 'shorten', label: 'Shorten', placeholder: 'Paste text to shorten...' },
  { id: 'seo', label: 'SEO', placeholder: 'Describe content for SEO optimization...' },
  { id: 'blog', label: 'Blog', placeholder: 'Describe the blog post topic...' },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'Describe the LinkedIn post...' },
  { id: 'instagram', label: 'Instagram', placeholder: 'Describe the Instagram caption...' },
  { id: 'resume', label: 'Resume', placeholder: 'Describe your experience for resume...' },
  { id: 'proposal', label: 'Proposal', placeholder: 'Describe the proposal...' },
  { id: 'product-description', label: 'Product Description', placeholder: 'Describe the product...' },
  { id: 'faq', label: 'FAQ', placeholder: 'Describe the topic for FAQ...' },
]

const WritingInput = ({
  placeholder,
  onSubmit,
  isLoading,
}: {
  placeholder: string
  onSubmit: (input: string) => void
  isLoading: boolean
}) => {
  const [input, setInput] = useState('')

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-surface-400">Input</label>
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        rows={6}
        containerClassName="w-full"
      />
      <Button
        onClick={() => onSubmit(input)}
        disabled={!input.trim() || isLoading}
        loading={isLoading}
        icon={<Sparkles size={14} />}
        size="sm"
      >
        {isLoading ? 'Generating...' : 'Generate'}
      </Button>
    </div>
  )
}

const StudioResult = ({
  result,
  isLoading,
  isStreaming,
  error,
  onStop,
  onClear,
}: {
  result: string
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  onStop: () => void
  onClear: () => void
}) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [result])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-surface-400">Result</label>
        {result && !isStreaming && (
          <div className="flex items-center gap-1">
            <button onClick={handleCopy} className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all" aria-label="Copy">
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
            <button onClick={onClear} className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-all" aria-label="Clear">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
      <div className={cn(
        'p-4 rounded-xl border',
        error ? 'bg-red-500/10 border-red-500/20' : 'bg-surface-900/60 border-surface-700/40',
      )}>
        {isLoading && !result ? (
          <TypingIndicator />
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : (
          <div className="text-sm leading-relaxed text-[rgb(var(--color-text-primary))]">
            <MarkdownRenderer content={result} />
            {isStreaming && <span className="inline-block w-2 h-4 bg-brand-400 animate-pulse ml-0.5 rounded-sm" />}
          </div>
        )}
      </div>
      {isStreaming && (
        <Button variant="ghost" size="sm" icon={<StopCircle size={14} />} onClick={onStop}>
          Stop
        </Button>
      )}
    </div>
  )
}

export const WritingStudio = () => {
  const [activeTool, setActiveTool] = useState<WritingTool>('email')
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  const activeConfig = WRITING_TOOLS.find((t) => t.id === activeTool)

  const handleGenerate = async (inputText: string) => {
    if (!inputText.trim()) return
    setIsLoading(true)
    setIsStreaming(true)
    setError(null)
    setResult('')

    const controller = new AbortController()
    abortControllerRef.current = controller

    const request: StudioRequest = {
      tool: activeTool,
      input: inputText,
      stream: true,
    }

    try {
      const fullContent = await aiService.streamWriting(
        request,
        (chunk: StreamChunk) => {
          setResult((prev) => prev + chunk.content)
        },
        { signal: controller.signal },
      )

      setResult(fullContent)
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) return
      setError(err?.message || 'Generation failed')
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsLoading(false)
    setIsStreaming(false)
  }, [])

  const handleClear = () => {
    setResult('')
    setError(null)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }

  return (
    <div className="flex flex-col h-full">
      <AppHeader
        icon={<PenTool size={16} />}
        title="Writing Studio"
        gradient="linear-gradient(135deg, #f59e0b, #fbbf24)"
        breadcrumbs={[
          { label: 'AI Workspace', href: '/ai' },
          { label: 'Writing Studio' },
          { label: WRITING_TOOLS.find(t => t.id === activeTool)?.label || '' },
        ]}
        subtitle="Write, rewrite, and optimize content"
      />

      <div className="px-6 py-3 border-b border-surface-700/20 flex-shrink-0 overflow-x-auto">
        <Tabs
          tabs={WRITING_TOOLS.map((t) => ({ id: t.id, label: t.label }))}
          activeTab={activeTool}
          onChange={(id) => setActiveTool(id as WritingTool)}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <WritingInput
            key={activeTool}
            placeholder={activeConfig?.placeholder || 'Enter your text...'}
            onSubmit={handleGenerate}
            isLoading={isLoading}
          />

          {(result || isLoading || error) && (
            <div className="mt-6">
              <StudioResult
                result={result}
                isLoading={isLoading}
                isStreaming={isStreaming}
                error={error}
                onStop={handleStop}
                onClear={handleClear}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
