import { cn } from '@utils/index'
import { User, Bot, RefreshCw, Copy, Check, AlertCircle, StopCircle } from 'lucide-react'
import { MarkdownRenderer } from './MarkdownRenderer'
import { TypingIndicator } from './TypingIndicator'
import { Button } from '@components/index'
import { useState, useCallback } from 'react'
import type { AiMessage } from '../dto/types'

interface ChatMessageProps {
  message: AiMessage
  onRegenerate?: () => void
  onStop?: () => void
  isLast?: boolean
}

export const ChatMessage = ({ message, onRegenerate, onStop, isLast }: ChatMessageProps) => {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const isStreaming = message.isStreaming

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [message.content])

  return (
    <div
      className={cn(
        'group flex gap-4 px-4 py-6 transition-colors duration-200',
        isUser ? 'bg-transparent' : 'bg-surface-950/30',
      )}
      role="listitem"
      aria-label={`${isUser ? 'Your message' : 'AI response'}`}
    >
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center',
        isUser
          ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white'
          : 'bg-gradient-to-br from-purple-500 to-violet-600 text-white',
      )}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="text-xs font-semibold text-surface-400">
          {isUser ? 'You' : 'AI'}
          {!isUser && isStreaming && (
            <span className="ml-2 text-[10px] text-brand-400 font-normal animate-pulse">
              generating...
            </span>
          )}
        </div>

        {message.error ? (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400 font-medium">Error generating response</p>
              <p className="text-xs text-red-400/70 mt-1">{message.error}</p>
              {onRegenerate && (
                <Button
                  size="xs"
                  variant="ghost"
                  className="mt-2 text-red-400 hover:text-red-300"
                  icon={<RefreshCw size={12} />}
                  onClick={onRegenerate}
                >
                  Retry
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm leading-relaxed text-[rgb(var(--color-text-primary))]">
            {isStreaming && !message.content ? (
              <TypingIndicator />
            ) : (
              <>
                <div className={cn(
                  'transition-opacity duration-150',
                  isStreaming ? 'opacity-90' : 'opacity-100',
                )}>
                  <MarkdownRenderer content={message.content} />
                </div>
                {isStreaming && isLast && (
                  <span className="inline-block w-2 h-4 bg-brand-400 rounded-sm ml-0.5 animate-blink" />
                )}
              </>
            )}
          </div>
        )}

        {!isUser && (
          <div className={cn(
            'flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150',
          )}>
            {isStreaming && isLast && onStop ? (
              <Button
                size="xs"
                variant="ghost"
                icon={<StopCircle size={12} />}
                onClick={onStop}
              >
                Stop
              </Button>
            ) : (
              <>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-md text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all"
                  aria-label={copied ? 'Copied' : 'Copy response'}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>
                {onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="p-1.5 rounded-md text-surface-500 hover:text-surface-200 hover:bg-surface-800/60 transition-all"
                    aria-label="Regenerate response"
                  >
                    <RefreshCw size={13} />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
