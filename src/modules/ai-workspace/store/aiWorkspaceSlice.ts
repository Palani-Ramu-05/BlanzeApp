import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type {
  Conversation,
  AiMessage,
  AiSettings,
  RecentActivity,
  FavoriteTool,
  StudioType,
  AiAttachment,
} from '../dto/types'
import { DEFAULT_AI_SETTINGS } from '../dto/initial-values'
import { generateId } from '@utils/index'

interface AiWorkspaceState {
  conversations: Conversation[]
  activeConversationId: string | null
  streamingMessageId: string | null
  isStreaming: boolean
  isGenerating: boolean
  settings: AiSettings
  recentActivity: RecentActivity[]
  favorites: FavoriteTool[]
  searchQuery: string
  searchResults: Conversation[]
  isSearching: boolean
  chatHistoryOpen: boolean
  isLoadingHistory: boolean
  historyPage: number
  historyTotal: number
  hasMoreHistory: boolean
}

const initialState: AiWorkspaceState = {
  conversations: [],
  activeConversationId: null,
  streamingMessageId: null,
  isStreaming: false,
  isGenerating: false,
  settings: DEFAULT_AI_SETTINGS,
  recentActivity: [],
  favorites: [
    { id: '1', name: 'Speech to Text', icon: 'mic', studio: 'voice', tool: 'speech-to-text' },
    { id: '2', name: 'Rewrite', icon: 'refresh-cw', studio: 'writing', tool: 'rewrite' },
    { id: '3', name: 'Summarize', icon: 'file-text', studio: 'writing', tool: 'summarize' },
    { id: '4', name: 'OCR', icon: 'scan', studio: 'image', tool: 'ocr' },
    { id: '5', name: 'Translate', icon: 'languages', studio: 'translation', tool: 'translate' },
    { id: '6', name: 'Grammar Fix', icon: 'check-circle', studio: 'writing', tool: 'grammar-fix' },
    { id: '7', name: 'AI Chat', icon: 'message-square', studio: 'chat', tool: 'chat' },
  ],
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  chatHistoryOpen: false,
  isLoadingHistory: false,
  historyPage: 1,
  historyTotal: 0,
  hasMoreHistory: false,
}

const aiWorkspaceSlice = createSlice({
  name: 'aiWorkspace',
  initialState,
  reducers: {
    resetChat: (state) => {
      state.activeConversationId = null
    },

    createConversation: (state) => {
      const conv: Conversation = {
        id: generateId(),
        title: 'New Chat',
        messages: [],
        studio: 'chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: false,
      }
      state.conversations.unshift(conv)
      state.activeConversationId = conv.id
    },

    createStudioConversation: (state, action: PayloadAction<StudioType>) => {
      const conv: Conversation = {
        id: generateId(),
        title: `New ${action.payload.charAt(0).toUpperCase() + action.payload.slice(1)}`,
        messages: [],
        studio: action.payload,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: false,
      }
      state.conversations.unshift(conv)
      state.activeConversationId = conv.id
    },

    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload
    },

    setConversationMessages: (state, action: PayloadAction<{ conversationId: string; messages: AiMessage[] }>) => {
      const conv = state.conversations.find((c) => c.id === action.payload.conversationId)
      if (conv) {
        conv.messages = action.payload.messages
      }
    },

    addMessage: (state, action: PayloadAction<{ conversationId: string; message: AiMessage }>) => {
      const conv = state.conversations.find((c) => c.id === action.payload.conversationId)
      if (conv) {
        conv.messages.push(action.payload.message)
        conv.updatedAt = Date.now()
        if (conv.title === 'New Chat' && action.payload.message.role === 'user') {
          conv.title = action.payload.message.content.slice(0, 60) + (action.payload.message.content.length > 60 ? '...' : '')
        }
      }
    },

    updateMessage: (state, action: PayloadAction<{ conversationId: string; messageId: string; updates: Partial<AiMessage> }>) => {
      const conv = state.conversations.find((c) => c.id === action.payload.conversationId)
      if (conv) {
        const msg = conv.messages.find((m) => m.id === action.payload.messageId)
        if (msg) {
          Object.assign(msg, action.payload.updates)
        }
      }
    },

    deleteConversation: (state, action: PayloadAction<string>) => {
      state.conversations = state.conversations.filter((c) => c.id !== action.payload)
      if (state.activeConversationId === action.payload) {
        state.activeConversationId = state.conversations[0]?.id || null
      }
    },

    renameConversation: (state, action: PayloadAction<{ id: string; title: string }>) => {
      const conv = state.conversations.find((c) => c.id === action.payload.id)
      if (conv) {
        conv.title = action.payload.title
      }
    },

    togglePinConversation: (state, action: PayloadAction<string>) => {
      const conv = state.conversations.find((c) => c.id === action.payload)
      if (conv) {
        conv.isPinned = !conv.isPinned
      }
    },

    setStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload
    },

    setGenerating: (state, action: PayloadAction<boolean>) => {
      state.isGenerating = action.payload
    },

    setStreamingMessageId: (state, action: PayloadAction<string | null>) => {
      state.streamingMessageId = action.payload
    },

    addRecentActivity: (state, action: PayloadAction<RecentActivity>) => {
      state.recentActivity.unshift(action.payload)
      if (state.recentActivity.length > 20) {
        state.recentActivity.pop()
      }
    },

    clearRecentActivity: (state) => {
      state.recentActivity = []
    },

    addFavorite: (state, action: PayloadAction<FavoriteTool>) => {
      const exists = state.favorites.find((f) => f.id === action.payload.id)
      if (!exists) {
        state.favorites.push(action.payload)
      }
    },

    removeFavorite: (state, action: PayloadAction<string>) => {
      state.favorites = state.favorites.filter((f) => f.id !== action.payload)
    },

    updateSettings: (state, action: PayloadAction<Partial<AiSettings>>) => {
      Object.assign(state.settings, action.payload)
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },

    setSearchResults: (state, action: PayloadAction<Conversation[]>) => {
      state.searchResults = action.payload
    },

    setSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload
    },

    toggleChatHistory: (state) => {
      state.chatHistoryOpen = !state.chatHistoryOpen
    },

    setChatHistoryOpen: (state, action: PayloadAction<boolean>) => {
      state.chatHistoryOpen = action.payload
    },

    removeAttachment: (state, action: PayloadAction<{ conversationId: string; messageId: string; attachmentId: string }>) => {
      const conv = state.conversations.find((c) => c.id === action.payload.conversationId)
      if (conv) {
        const msg = conv.messages.find((m) => m.id === action.payload.messageId)
        if (msg?.attachments) {
          msg.attachments = msg.attachments.filter((a) => a.id !== action.payload.attachmentId)
        }
      }
    },

    clearAllConversations: (state) => {
      state.conversations = []
      state.activeConversationId = null
    },

    deleteMessage: (state, action: PayloadAction<{ conversationId: string; messageId: string }>) => {
      const conv = state.conversations.find((c) => c.id === action.payload.conversationId)
      if (conv) {
        conv.messages = conv.messages.filter((m) => m.id !== action.payload.messageId)
      }
    },

    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.conversations = action.payload.map((c) => ({ ...c, messages: c.messages || [] }))
    },

    setConversationsFromBackend: (state, action: PayloadAction<{ conversations: Conversation[]; total: number; page: number }>) => {
      const { conversations, total, page } = action.payload
      const normalized = conversations.map((c) => ({ ...c, messages: c.messages || [] }))
      if (page === 1) {
        state.conversations = normalized
      } else {
        const existingIds = new Set(state.conversations.map((c) => c.id))
        const newConvs = normalized.filter((c) => !existingIds.has(c.id))
        state.conversations.push(...newConvs)
      }
      state.historyTotal = total
      state.historyPage = page
      state.hasMoreHistory = state.conversations.length < total
    },

    setLoadingHistory: (state, action: PayloadAction<boolean>) => {
      state.isLoadingHistory = action.payload
    },

    updateConversationId: (state, action: PayloadAction<{ oldId: string; newId: string }>) => {
      const conv = state.conversations.find((c) => c.id === action.payload.oldId)
      if (conv) {
        conv.id = action.payload.newId
      }
      if (state.activeConversationId === action.payload.oldId) {
        state.activeConversationId = action.payload.newId
      }
    },
  },
})

export const {
  resetChat,
  createConversation,
  createStudioConversation,
  setActiveConversation,
  setConversationMessages,
  addMessage,
  updateMessage,
  deleteConversation,
  renameConversation,
  togglePinConversation,
  setStreaming,
  setGenerating,
  setStreamingMessageId,
  addRecentActivity,
  clearRecentActivity,
  addFavorite,
  removeFavorite,
  updateSettings,
  setSearchQuery,
  setSearchResults,
  setSearching,
  toggleChatHistory,
  setChatHistoryOpen,
  removeAttachment,
  clearAllConversations,
  setConversations,
  setConversationsFromBackend,
  setLoadingHistory,
  updateConversationId,
  deleteMessage,
} = aiWorkspaceSlice.actions

export const aiWorkspaceReducer = aiWorkspaceSlice.reducer
