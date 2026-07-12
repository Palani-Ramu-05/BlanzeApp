import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@utils/index'
import { Button } from '@components/index'
import {
  MessageSquare,
  Search,
  Pin,
  Trash2,
  Edit3,
  Check,
  X,
  Plus,
  Hash,
  Loader2,
  Bot,
} from 'lucide-react'
import type { Conversation } from '../dto/types'
import { format } from 'date-fns'

interface ChatHistoryProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  onTogglePin: (id: string) => void
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
}

const SkeletonItem = () => (
  <div className="flex items-start gap-2 px-3 py-2.5 animate-pulse">
    <div className="w-7 h-7 rounded-lg bg-surface-800 flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 w-3/4 bg-surface-800 rounded" />
      <div className="h-2 w-1/4 bg-surface-800 rounded" />
    </div>
  </div>
)

export const ChatHistory = ({
  conversations,
  activeConversationId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onTogglePin,
  isLoading,
  hasMore,
  onLoadMore,
}: ChatHistoryProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const pinned = filtered.filter((c) => c.isPinned)
  const unpinned = filtered.filter((c) => !c.isPinned)

  const handleStartRename = useCallback((conv: Conversation) => {
    setEditingId(conv.id)
    setEditingTitle(conv.title)
  }, [])

  const handleConfirmRename = useCallback(() => {
    if (editingId && editingTitle.trim()) {
      onRename(editingId, editingTitle.trim())
    }
    setEditingId(null)
    setEditingTitle('')
  }, [editingId, editingTitle, onRename])

  const handleCancelRename = useCallback(() => {
    setEditingId(null)
    setEditingTitle('')
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !onLoadMore || !hasMore || isLoading) return

    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
        onLoadMore()
      }
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [onLoadMore, hasMore, isLoading])

  const ConversationItem = ({ conv }: { conv: Conversation }) => {
    const isActive = conv.id === activeConversationId
    const isEditing = editingId === conv.id
    const date = conv.updatedAt ? format(conv.updatedAt, 'MMM d') : ''
    const lastMsgPreview = conv.lastMessage || conv.messages?.[conv.messages.length - 1]?.content || ''

    return (
      <div
        className={cn(
          'group relative flex items-start gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150',
          isActive
            ? 'bg-brand-500/10 border border-brand-500/20'
            : 'hover:bg-surface-800/60 border border-transparent',
        )}
        onClick={() => !isEditing && onSelect(conv.id)}
        role="button"
        tabIndex={0}
        aria-label={`Conversation: ${conv.title}`}
        onKeyDown={(e) => { if (e.key === 'Enter' && !isEditing) onSelect(conv.id) }}
      >
        <div className={cn(
          'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center',
          isActive ? 'bg-brand-500/20 text-brand-400' : 'bg-surface-800 text-surface-400',
        )}>
          <MessageSquare size={13} />
        </div>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                className={cn(
                  'flex-1 bg-surface-800 border border-brand-500/50 rounded-lg px-2 py-1 text-xs',
                  'outline-none text-[rgb(var(--color-text-primary))]',
                )}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmRename()
                  if (e.key === 'Escape') handleCancelRename()
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleConfirmRename() }}
                className="p-1 rounded text-surface-400 hover:text-green-400"
              >
                <Check size={12} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleCancelRename() }}
                className="p-1 rounded text-surface-400 hover:text-red-400"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <>
              <p className={cn(
                'text-xs font-medium truncate max-w-[160px]',
                isActive ? 'text-brand-400' : 'text-[rgb(var(--color-text-primary))]',
              )}>
                {conv.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-surface-500">{date}</span>
                {lastMsgPreview && (
                  <>
                    <span className="text-[10px] text-surface-600">·</span>
                    <span className="text-[10px] text-surface-500 truncate max-w-[100px]">
                      {lastMsgPreview.slice(0, 40)}
                      {lastMsgPreview.length > 40 ? '...' : ''}
                    </span>
                  </>
                )}
                {conv.isPinned && <Pin size={9} className="text-brand-400 flex-shrink-0" />}
              </div>
            </>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 bg-surface-900/90 backdrop-blur-sm rounded-lg p-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); handleStartRename(conv) }}
              className="p-1 rounded text-surface-500 hover:text-surface-200 hover:bg-surface-700/60"
              aria-label="Rename"
            >
              <Edit3 size={11} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePin(conv.id) }}
              className={cn(
                'p-1 rounded',
                conv.isPinned ? 'text-brand-400' : 'text-surface-500 hover:text-surface-200',
              )}
              aria-label={conv.isPinned ? 'Unpin' : 'Pin'}
            >
              <Pin size={11} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(conv.id) }}
              className="p-1 rounded text-surface-500 hover:text-red-400 hover:bg-red-500/10"
              aria-label="Delete"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-72 h-full flex flex-col bg-surface-900 border-r border-surface-700/40 flex-shrink-0">
      {/* New Chat - always visible */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <Button
          variant="primary"
          className="w-full justify-center gap-2"
          onClick={onNew}
          icon={<Plus size={16} />}
        >
          New Chat
        </Button>
      </div>

      {/* Search */}
      {conversations.length > 0 && (
        <div className="px-3 pb-2 flex-shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-surface-800 border border-surface-700 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:border-brand-500/50 transition-colors placeholder:text-surface-400"
              style={{ color: 'rgb(var(--color-text-primary))' }}
            />
          </div>
        </div>
      )}

      {/* Conversation List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
        {isLoading && conversations.length === 0 ? (
          <div className="space-y-1 px-1 pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonItem key={i} />
            ))}
          </div>
        ) : conversations.length === 0 && !isLoading ? (
          <div className="text-center py-8 px-4">
            <div className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center mx-auto mb-3">
              <Bot size={20} className="text-surface-500" />
            </div>
            <p className="text-xs text-surface-500 mb-1">No conversations yet</p>
            <p className="text-[10px] text-surface-600">Start a new chat to begin</p>
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-1.5 px-1 py-1.5">
                  <Pin size={10} className="text-brand-400" />
                  <span className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Pinned</span>
                </div>
                {pinned.map((conv) => (
                  <ConversationItem key={conv.id} conv={conv} />
                ))}
              </div>
            )}

            {pinned.length > 0 && unpinned.length > 0 && (
              <div className="h-px bg-surface-700/40 mx-2 my-2" />
            )}

            {unpinned.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-1.5 px-1 py-1.5">
                  <Hash size={10} className="text-surface-500" />
                  <span className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider">Recent</span>
                </div>
                {unpinned.map((conv) => (
                  <ConversationItem key={conv.id} conv={conv} />
                ))}
              </div>
            )}

            {filtered.length === 0 && searchQuery && !isLoading && (
              <div className="text-center py-8">
                <MessageSquare size={24} className="text-surface-600 mx-auto mb-2" />
                <p className="text-xs text-surface-500">No conversations found</p>
              </div>
            )}

            {isLoading && conversations.length > 0 && (
              <div className="flex justify-center py-3">
                <Loader2 size={16} className="animate-spin text-surface-500" />
              </div>
            )}

            {!hasMore && conversations.length > 0 && !searchQuery && (
              <p className="text-[10px] text-surface-600 text-center pt-2">
                All conversations loaded
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
