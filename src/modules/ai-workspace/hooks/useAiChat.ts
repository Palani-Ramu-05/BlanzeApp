import { useCallback, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { store } from '@core/store/redux/index'
import { aiService } from '../services/ai-service'
import {
  createConversation,
  addMessage,
  updateMessage,
  deleteMessage,
  setStreaming,
  setGenerating,
  setStreamingMessageId,
  addRecentActivity,
  setActiveConversation,
  updateConversationId,
} from '../store/aiWorkspaceSlice'
import type { AiMessage, ChatRequest } from '../dto/types'
import { generateId } from '@utils/index'
import toast from 'react-hot-toast'

export function useAiChat() {
  const dispatch = useAppDispatch()
  const abortRef = useRef<AbortController | null>(null)
  const rafRef = useRef<number | null>(null)
  const accumulatedRef = useRef('')

  const {
    conversations,
    activeConversationId,
    isStreaming,
    isGenerating,
  } = useAppSelector((s) => s.aiWorkspace)
  const streamingEnabled = useAppSelector((s) => s.aiWorkspace.settings.streamingEnabled)

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null

  const sendMessage = useCallback(async (content: string, attachments?: AiMessage['attachments']) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return

    let convId = activeConversationId

    if (!convId) {
      dispatch(createConversation())
      const state = store.getState() as { aiWorkspace: { activeConversationId: string | null } }
      convId = state.aiWorkspace.activeConversationId
    }

    if (!convId) return

    const userMessage: AiMessage = {
      id: generateId(),
      role: 'user',
      content,
      attachments,
      timestamp: Date.now(),
    }
    dispatch(addMessage({ conversationId: convId, message: userMessage }))

    const assistantMessageId = generateId()
    const assistantMessage: AiMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    }
    dispatch(addMessage({ conversationId: convId, message: assistantMessage }))
    dispatch(setStreaming(true))
    dispatch(setGenerating(true))
    dispatch(setStreamingMessageId(assistantMessageId))

    abortRef.current = new AbortController()

    try {
      const request: ChatRequest = {
        message: content,
        conversationId: convId,
        attachments,
        stream: streamingEnabled,
        signal: abortRef.current.signal,
      }

      if (streamingEnabled) {
        accumulatedRef.current = ''

        const { conversationId: backendConvId } = await aiService.streamChat(request, (chunk) => {
          accumulatedRef.current += chunk.content

          if (rafRef.current) return
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null
            dispatch(updateMessage({
              conversationId: convId!,
              messageId: assistantMessageId,
              updates: {
                content: accumulatedRef.current,
                isStreaming: !chunk.done,
              },
            }))
          })
        })

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }

        dispatch(updateMessage({
          conversationId: convId!,
          messageId: assistantMessageId,
          updates: {
            content: accumulatedRef.current,
            isStreaming: false,
            timestamp: Date.now(),
          },
        }))

        if (backendConvId && backendConvId !== convId) {
          dispatch(updateConversationId({ oldId: convId, newId: backendConvId }))
          convId = backendConvId
        }
      } else {
        const response = await aiService.chat(request, { signal: abortRef.current.signal })
        if (response.success && response.data) {
          dispatch(updateMessage({
            conversationId: convId!,
            messageId: assistantMessageId,
            updates: {
              content: response.data.message.content,
              isStreaming: false,
              timestamp: Date.now(),
            },
          }))
        }
      }

      dispatch(addRecentActivity({
        id: generateId(),
        type: 'chat',
        title: content.slice(0, 60) + (content.length > 60 ? '...' : ''),
        subtitle: 'AI Chat',
        timestamp: Date.now(),
        conversationId: convId!,
        studio: 'chat',
      }))
    } catch (error: unknown) {
      const isAbort = (error instanceof DOMException && error.name === 'AbortError') ||
        (error instanceof Error && error.name === 'CanceledError')
      if (isAbort) {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
        dispatch(updateMessage({
          conversationId: convId!,
          messageId: assistantMessageId,
          updates: {
            isStreaming: false,
            content: accumulatedRef.current || '[Generation stopped]',
          },
        }))
      } else {
        const errMsg = error instanceof Error ? error.message : 'An error occurred'
        dispatch(updateMessage({
          conversationId: convId!,
          messageId: assistantMessageId,
          updates: { isStreaming: false, error: errMsg },
        }))
        toast.error(errMsg)
      }
    } finally {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      dispatch(setStreaming(false))
      dispatch(setGenerating(false))
      dispatch(setStreamingMessageId(null))
      abortRef.current = null
    }
  }, [dispatch, activeConversationId, streamingEnabled])

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const retryLastMessage = useCallback(async () => {
    if (!activeConversation || activeConversation.messages.length < 2) return

    const lastUserMessage = [...activeConversation.messages].reverse().find((m) => m.role === 'user')
    if (!lastUserMessage) return

    const lastAssistantMessage = [...activeConversation.messages].reverse().find((m) => m.role === 'assistant')
    if (lastAssistantMessage && !lastAssistantMessage.isLoading) {
      dispatch(deleteMessage({
        conversationId: activeConversation.id,
        messageId: lastAssistantMessage.id,
      }))
    }

    await sendMessage(lastUserMessage.content, lastUserMessage.attachments)
  }, [activeConversation, dispatch, sendMessage])

  return {
    conversations,
    activeConversation,
    activeConversationId,
    isStreaming,
    isGenerating,
    sendMessage,
    stopGeneration,
    retryLastMessage,
    abortRef,
  }
}
