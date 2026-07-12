import { useEffect, useRef, useCallback } from 'react'
import { cn } from '@utils/index'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { useAiChat } from '../hooks/useAiChat'
import { useConversationHistory } from '../hooks/useConversationHistory'
import { useAttachment } from '../hooks/useAttachment'
import { ChatMessage } from '../components/ChatMessage'
import { ChatInput } from '../components/ChatInput'
import { ChatHistory } from '../components/ChatHistory'
import { Button } from '@components/index'
import {
  MessageSquare,
  Bot,
  Trash2,
  Code,
  FileText,
  Languages,
  Globe,
  PenLine,
  ListChecks,
  BookOpen,
  Zap,
  Braces,
  Database,
  TestTube,
  GitBranch,
  Shield,
  Cloud,
  Smartphone,
  Palette,
  ChartBar,
  Mail,
  FileJson,
  Search,
  Terminal,
  Cpu,
  Network,
  Lock,
  Rocket,
} from 'lucide-react'
import {
  deleteConversation as deleteFromStore,
  renameConversation as renameInStore,
  togglePinConversation as togglePinInStore,
  resetChat,
} from '../store/aiWorkspaceSlice'
import { aiService } from '../services/ai-service'
import { markdownRendererStyles } from '../styles/markdownStyles'
import toast from 'react-hot-toast'

interface SuggestionGroup {
  title: string
  items: { icon: any; label: string; color: string; textColor: string }[]
}

const suggestionGroups: SuggestionGroup[] = [
  {
    title: 'Coding & Development',
    items: [
      { icon: Code, label: 'Explain React Hooks', color: 'from-blue-500/20 to-cyan-500/20', textColor: 'text-blue-400' },
      { icon: Braces, label: 'Write a TypeScript Function', color: 'from-blue-600/20 to-indigo-500/20', textColor: 'text-blue-400' },
      { icon: Terminal, label: 'Debug Python Code', color: 'from-yellow-500/20 to-orange-500/20', textColor: 'text-yellow-400' },
      { icon: Database, label: 'Generate SQL Query', color: 'from-green-500/20 to-emerald-500/20', textColor: 'text-green-400' },
      { icon: GitBranch, label: 'Explain Git Commands', color: 'from-orange-500/20 to-red-500/20', textColor: 'text-orange-400' },
      { icon: TestTube, label: 'Write Unit Tests', color: 'from-red-500/20 to-pink-500/20', textColor: 'text-red-400' },
      { icon: Zap, label: 'Optimize Performance', color: 'from-yellow-500/20 to-amber-500/20', textColor: 'text-yellow-400' },
    ],
  },
  {
    title: 'Writing & Content',
    items: [
      { icon: PenLine, label: 'Write a Professional Email', color: 'from-indigo-500/20 to-violet-500/20', textColor: 'text-indigo-400' },
      { icon: FileText, label: 'Summarize a PDF', color: 'from-purple-500/20 to-pink-500/20', textColor: 'text-purple-400' },
      { icon: Globe, label: 'Generate API Documentation', color: 'from-sky-500/20 to-blue-500/20', textColor: 'text-sky-400' },
      { icon: BookOpen, label: 'Improve Grammar', color: 'from-teal-500/20 to-cyan-500/20', textColor: 'text-teal-400' },
      { icon: Mail, label: 'Draft a Business Proposal', color: 'from-violet-500/20 to-purple-500/20', textColor: 'text-violet-400' },
      { icon: FileJson, label: 'Convert JSON to CSV', color: 'from-cyan-500/20 to-teal-500/20', textColor: 'text-cyan-400' },
    ],
  },
  {
    title: 'Data & Analysis',
    items: [
      { icon: ChartBar, label: 'Analyze Sales Data', color: 'from-green-500/20 to-teal-500/20', textColor: 'text-green-400' },
      { icon: Search, label: 'Research a Topic', color: 'from-blue-500/20 to-indigo-500/20', textColor: 'text-blue-400' },
      { icon: ListChecks, label: 'Create Meeting Notes', color: 'from-red-500/20 to-rose-500/20', textColor: 'text-red-400' },
      { icon: Cpu, label: 'Explain Machine Learning', color: 'from-purple-500/20 to-pink-500/20', textColor: 'text-purple-400' },
    ],
  },
  {
    title: 'Languages & Communication',
    items: [
      { icon: Languages, label: 'Translate Tamil to English', color: 'from-green-500/20 to-emerald-500/20', textColor: 'text-green-400' },
      { icon: Languages, label: 'Translate English to Spanish', color: 'from-emerald-500/20 to-teal-500/20', textColor: 'text-emerald-400' },
      { icon: Languages, label: 'Translate French to German', color: 'from-teal-500/20 to-cyan-500/20', textColor: 'text-teal-400' },
    ],
  },
  {
    title: 'DevOps & Infrastructure',
    items: [
      { icon: Cloud, label: 'Write Docker Compose', color: 'from-sky-500/20 to-blue-500/20', textColor: 'text-sky-400' },
      { icon: Shield, label: 'Set up CI/CD Pipeline', color: 'from-red-500/20 to-orange-500/20', textColor: 'text-red-400' },
      { icon: Network, label: 'Design REST API', color: 'from-indigo-500/20 to-purple-500/20', textColor: 'text-indigo-400' },
      { icon: Lock, label: 'Security Best Practices', color: 'from-rose-500/20 to-red-500/20', textColor: 'text-rose-400' },
    ],
  },
  {
    title: 'Creative & Design',
    items: [
      { icon: Palette, label: 'Generate Color Palette', color: 'from-pink-500/20 to-rose-500/20', textColor: 'text-pink-400' },
      { icon: Smartphone, label: 'Design Mobile UI Ideas', color: 'from-violet-500/20 to-indigo-500/20', textColor: 'text-violet-400' },
      { icon: Rocket, label: 'Brainstorm Startup Ideas', color: 'from-amber-500/20 to-orange-500/20', textColor: 'text-amber-400' },
    ],
  },
]

export const AiChatPage = () => {
  const dispatch = useAppDispatch()
  const { conversations, activeConversationId, settings } = useAppSelector(
    (s) => s.aiWorkspace,
  )
  const {
    sendMessage,
    stopGeneration,
    isStreaming,
    isGenerating,
    retryLastMessage,
  } = useAiChat()
  const {
    isLoadingHistory,
    hasMoreHistory,
    openConversation,
    loadMore: loadMoreHistory,
  } = useConversationHistory()
  const { attachments, addFile, removeAttachment, clearAttachments } = useAttachment()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeConversation = conversations.find((c) => c.id === activeConversationId)

  const hasMessages = activeConversation && activeConversation.messages?.length > 0

  useEffect(() => {
    if (settings.autoScroll && hasMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeConversation?.messages, settings.autoScroll, hasMessages])

  useEffect(() => {
    if (containerRef.current && isStreaming) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [isStreaming, activeConversation?.messages?.length])

  const handleSend = useCallback(
    (content: string, msgAttachments?: typeof attachments) => {
      sendMessage(content, msgAttachments)
      clearAttachments()
    },
    [sendMessage, clearAttachments],
  )

  const handleNewChat = useCallback(() => {
    dispatch(resetChat())
    clearAttachments()
  }, [dispatch, clearAttachments])

  const handleSelectConversation = useCallback(
    (id: string) => {
      openConversation(id)
    },
    [openConversation],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await aiService.deleteConversation(id)
        dispatch(deleteFromStore(id))
      } catch {
        toast.error('Failed to delete conversation')
      }
    },
    [dispatch],
  )

  const handleRename = useCallback(
    async (id: string, title: string) => {
      try {
        await aiService.renameConversation(id, title)
        dispatch(renameInStore({ id, title }))
      } catch {
        toast.error('Failed to rename conversation')
      }
    },
    [dispatch],
  )

  const handleTogglePin = useCallback(
    async (id: string) => {
      try {
        const conv = conversations.find((c) => c.id === id)
        await aiService.togglePinConversation(id, !conv?.isPinned)
        dispatch(togglePinInStore(id))
      } catch {
        toast.error('Failed to update conversation')
      }
    },
    [dispatch, conversations],
  )

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      sendMessage(suggestion, undefined)
    },
    [sendMessage],
  )

  return (
    <div className="flex h-full overflow-hidden">
      <style>{markdownRendererStyles}</style>

      <ChatHistory
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelect={handleSelectConversation}
        onNew={handleNewChat}
        onDelete={handleDelete}
        onRename={handleRename}
        onTogglePin={handleTogglePin}
        isLoading={isLoadingHistory}
        hasMore={hasMoreHistory}
        onLoadMore={loadMoreHistory}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {activeConversationId ? (
          <>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-700/40 bg-surface-900/50 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
                  <Bot size={12} className="text-white" />
                </div>
                <h2 className="text-sm font-semibold text-[rgb(var(--color-text-primary))] truncate max-w-[200px] sm:max-w-[400px]">
                  {activeConversation?.title || 'Chat'}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="xs"
                  variant="ghost"
                  icon={<Trash2 size={13} />}
                  onClick={() => activeConversationId && handleDelete(activeConversationId)}
                >
                  Delete
                </Button>
              </div>
            </div>

            <div
              ref={containerRef}
              className="flex-1 overflow-y-auto min-h-0"
            >
              {hasMessages ? (
                <div className="max-w-4xl mx-auto">
                  {activeConversation.messages.map((message, idx) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isLast={idx === activeConversation.messages.length - 1}
                      onRegenerate={
                        message.role === 'assistant' && !message.isStreaming
                          ? retryLastMessage
                          : undefined
                      }
                      onStop={
                        message.isStreaming && idx === activeConversation.messages.length - 1
                          ? stopGeneration
                          : undefined
                      }
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md px-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-3">
                      <MessageSquare size={20} className="text-brand-400" />
                    </div>
                    <p className="text-sm text-surface-400">
                      Send a message to continue this conversation
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="flex flex-col items-center py-6 px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center mb-4 mt-4">
                <Bot size={32} className="text-brand-400" />
              </div>
              <h2 className="text-lg font-semibold text-[rgb(var(--color-text-primary))] mb-2">
                How can I help you today?
              </h2>
              <p className="text-sm text-surface-400 mb-6">
                Ask questions, create content, analyze data, and more.
              </p>

              <div className="w-full max-w-2xl space-y-6">
                {suggestionGroups.map((group) => (
                  <div key={group.title}>
                    <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3 px-1">
                      {group.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {group.items.map((s) => (
                        <button
                          key={s.label}
                          onClick={() => handleSuggestionClick(s.label)}
                          className={cn(
                            'group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200',
                            'border-surface-700/40 hover:border-surface-500/50 bg-surface-900/50 hover:bg-surface-800/60',
                          )}
                        >
                          <div className={cn(
                            'w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0',
                            s.color,
                          )}>
                            <s.icon size={14} className={s.textColor} />
                          </div>
                          <span className="text-xs text-surface-400 group-hover:text-surface-200 transition-colors text-left leading-snug">
                            {s.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <ChatInput
          onSend={handleSend}
          onStop={stopGeneration}
          isStreaming={isStreaming}
          isGenerating={isGenerating}
          attachments={attachments}
          onAddFile={addFile}
          onRemoveAttachment={removeAttachment}
        />
      </div>
    </div>
  )
}
