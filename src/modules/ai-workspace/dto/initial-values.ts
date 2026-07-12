import type { AiSettings, Conversation, AiMessage, AiAttachment } from './types'

export const DEFAULT_AI_SETTINGS: AiSettings = {
  streamingEnabled: true,
  autoScroll: true,
  markdownRendering: true,
  codeTheme: 'one-dark',
  fontSize: 'md',
}

export const EMPTY_MESSAGE: AiMessage = {
  id: '',
  role: 'assistant',
  content: '',
  timestamp: 0,
}

export const EMPTY_CONVERSATION: Conversation = {
  id: '',
  title: 'New Chat',
  messages: [],
  studio: 'chat',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isPinned: false,
}

export const INITIAL_ATTACHMENT: AiAttachment = {
  id: '',
  name: '',
  type: '',
  size: 0,
  status: 'uploading',
}
