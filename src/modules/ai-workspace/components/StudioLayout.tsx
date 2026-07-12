import { useState } from 'react'
import { cn } from '@utils/index'
import { Button, Textarea } from '@components/index'
import { ArrowLeft, Sparkles, StopCircle, RefreshCw, Copy, Check, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MarkdownRenderer } from './MarkdownRenderer'
import { TypingIndicator } from './TypingIndicator'

interface StudioLayoutProps {
  title: string
  icon: React.ReactNode
  gradient: string
  placeholder?: string
  inputLabel?: string
  result: string
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  onGenerate: (input: string) => void
  onStop: () => void
  onClear: () => void
  onRetry: (input: string) => void
}

export const StudioLayout = ({
  title,
  icon,
  gradient,
  placeholder = 'Enter your text here...',
  inputLabel = 'Input',
  result,
  isLoading,
  isStreaming,
  error,
  onGenerate,
  onStop,
  onClear,
  onRetry,
}: StudioLayoutProps) => {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return
    onGenerate(input.trim())
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-6 py-3 border-b border-surface-700/40 bg-surface-900/50 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={() => navigate('/ai')}
          className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all"
          aria-label="Back to AI Workspace"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs" style={{ background: gradient }}>
          {icon}
        </div>
        <h1 className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">{title}</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-surface-400">{inputLabel}</label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              rows={5}
              mono={false}
              containerClassName="w-full"
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                loading={isLoading}
                icon={<Sparkles size={14} />}
                size="sm"
              >
                {isLoading ? 'Generating...' : 'Generate'}
              </Button>
              {isStreaming && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<StopCircle size={14} />}
                  onClick={onStop}
                >
                  Stop
                </Button>
              )}
            </div>
          </div>

          {(result || isLoading || error) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-surface-400">Result</label>
                {result && !isStreaming && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCopy}
                      className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all"
                      aria-label="Copy result"
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                    <button
                      onClick={() => onRetry(input)}
                      className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all"
                      aria-label="Retry"
                    >
                      <RefreshCw size={13} />
                    </button>
                    <button
                      onClick={onClear}
                      className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      aria-label="Clear result"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              <div className={cn(
                'p-4 rounded-xl border',
                error
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-surface-900/60 border-surface-700/40',
              )}>
                {isLoading && !result ? (
                  <TypingIndicator />
                ) : error ? (
                  <p className="text-sm text-red-400">{error}</p>
                ) : (
                  <div className="text-sm leading-relaxed text-[rgb(var(--color-text-primary))]">
                    <MarkdownRenderer content={result} />
                    {isStreaming && (
                      <span className="inline-block w-2 h-4 bg-brand-400 animate-pulse ml-0.5 rounded-sm" />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
