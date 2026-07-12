import { useCallback, useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { aiService } from '../services/ai-service'
import {
  setConversationsFromBackend,
  setLoadingHistory,
  setConversationMessages,
  setActiveConversation,
} from '../store/aiWorkspaceSlice'
import toast from 'react-hot-toast'

const PAGE_SIZE = 20

export function useConversationHistory() {
  const dispatch = useAppDispatch()
  const {
    conversations,
    activeConversationId,
    isLoadingHistory,
    hasMoreHistory,
    historyPage,
  } = useAppSelector((s) => s.aiWorkspace)
  const loadingRef = useRef(false)
  const initialLoadRef = useRef(false)

  const loadConversations = useCallback(async (page: number) => {
    if (loadingRef.current) return
    loadingRef.current = true
    dispatch(setLoadingHistory(true))
    try {
      const res = await aiService.getConversationHistory(page, PAGE_SIZE)
      if (res.success && res.data) {
        dispatch(setConversationsFromBackend({
          conversations: res.data.conversations,
          total: res.data.total,
          page,
        }))
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load conversations'
      toast.error(msg)
    } finally {
      dispatch(setLoadingHistory(false))
      loadingRef.current = false
    }
  }, [dispatch])

  // Auto-load conversations on mount
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true
      loadConversations(1)
    }
  }, [loadConversations])

  const loadMore = useCallback(() => {
    if (!hasMoreHistory || isLoadingHistory) return
    loadConversations(historyPage + 1)
  }, [hasMoreHistory, isLoadingHistory, historyPage, loadConversations])

  const openConversation = useCallback(async (id: string) => {
    if (id === activeConversationId) return
    dispatch(setActiveConversation(id))
    try {
      const res = await aiService.getConversation(id)
      if (res.success && res.data) {
        dispatch(setConversationMessages({
          conversationId: id,
          messages: res.data.messages || [],
        }))
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load conversation'
      toast.error(msg)
    }
  }, [dispatch, activeConversationId])

  const refresh = useCallback(() => {
    initialLoadRef.current = false
    loadConversations(1)
  }, [loadConversations])

  return {
    conversations,
    isLoadingHistory,
    hasMoreHistory,
    loadMore,
    openConversation,
    refresh,
  }
}
