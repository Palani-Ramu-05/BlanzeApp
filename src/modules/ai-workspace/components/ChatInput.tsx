import { useState, useRef, useCallback, useEffect, type KeyboardEvent, type DragEvent } from 'react'
import { cn } from '@utils/index'
import { Button } from '@components/index'
import { SendHorizonal, Paperclip, Mic, X, StopCircle, Image, FileText } from 'lucide-react'
import { Attachments } from './Attachments'
import type { AiAttachment } from '../dto/types'

interface ChatInputProps {
  onSend: (content: string, attachments?: AiAttachment[]) => void
  onStop?: () => void
  isStreaming?: boolean
  isGenerating?: boolean
  placeholder?: string
  disabled?: boolean
  attachments: AiAttachment[]
  onAddFile: (file: File) => void
  onRemoveAttachment: (id: string) => void
}

export const ChatInput = ({
  onSend,
  onStop,
  isStreaming,
  isGenerating,
  placeholder = 'Ask AI anything...',
  disabled,
  attachments,
  onAddFile,
  onRemoveAttachment,
}: ChatInputProps) => {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`
    }
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed && attachments.length === 0) return
    if (disabled || isGenerating) return
    onSend(trimmed, attachments.length > 0 ? attachments : undefined)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, attachments, disabled, isGenerating, onSend])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleFileSelect = useCallback((accept: string, multiple: boolean) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = multiple
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files) {
        Array.from(files).forEach(onAddFile)
      }
    }
    input.click()
  }, [onAddFile])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = e.dataTransfer.files
      if (files) {
        Array.from(files).forEach(onAddFile)
      }
    },
    [onAddFile],
  )

  const isLoading = isGenerating || isStreaming

  return (
    <div
      className={cn(
        'border-t border-surface-700/40 bg-surface-900/90 backdrop-blur-xl',
        isDragOver && 'ring-2 ring-brand-500/50',
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Attachments
        attachments={attachments}
        onRemove={onRemoveAttachment}
      />

      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="relative flex items-end gap-2 bg-surface-800/80 border border-surface-700/60 rounded-2xl px-4 py-2 focus-within:border-brand-500/50 focus-within:ring-1 focus-within:ring-brand-500/20 transition-all duration-200">
          <button
            onClick={() => handleFileSelect('*', true)}
            className="flex-shrink-0 p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-700/60 transition-all mb-1"
            aria-label="Attach file"
          >
            <Paperclip size={16} />
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={disabled || isLoading}
            className={cn(
              'flex-1 bg-transparent border-none outline-none resize-none text-sm py-1.5 max-h-[200px]',
              'placeholder:text-surface-400',
              'disabled:opacity-50',
            )}
            style={{ color: 'rgb(var(--color-text-primary))' }}
            aria-label="Message input"
          />

          <div className="flex items-center gap-1 flex-shrink-0 mb-1">
            <button
              onClick={() => handleFileSelect('image/*', false)}
              className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-700/60 transition-all"
              aria-label="Attach image"
            >
              <Image size={16} />
            </button>

            <button
              onClick={() => handleFileSelect(
                '.pdf,.docx,.txt,.csv,.json,.mp3,.mp4,.wav,.webm', false,
              )}
              className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-700/60 transition-all"
              aria-label="Attach document"
            >
              <FileText size={16} />
            </button>

            {isLoading ? (
              <button
                onClick={onStop}
                className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                aria-label="Stop generating"
              >
                <StopCircle size={18} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!value.trim() && attachments.length === 0}
                className={cn(
                  'p-1.5 rounded-lg transition-all',
                  value.trim() || attachments.length > 0
                    ? 'text-brand-400 hover:text-brand-300 hover:bg-brand-500/10'
                    : 'text-surface-500',
                )}
                aria-label="Send message"
              >
                <SendHorizonal size={18} />
              </button>
            )}
          </div>
        </div>

        <p className="text-[10px] text-surface-500 text-center mt-2">
          AI may produce inaccurate information. Press <kbd className="px-1 py-0.5 bg-surface-800 rounded text-[10px] border border-surface-700">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-surface-800 rounded text-[10px] border border-surface-700">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  )
}
