export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'

export type StudioType =
  | 'writing'
  | 'voice'
  | 'document'
  | 'image'
  | 'coding'
  | 'translation'
  | 'research'
  | 'chat'

export type WritingTool =
  | 'email'
  | 'grammar-fix'
  | 'rewrite'
  | 'professional-tone'
  | 'friendly-tone'
  | 'summarize'
  | 'expand'
  | 'shorten'
  | 'seo'
  | 'blog'
  | 'linkedin'
  | 'instagram'
  | 'resume'
  | 'proposal'
  | 'product-description'
  | 'faq'

export type VoiceTool =
  | 'speech-to-text'
  | 'text-to-speech'
  | 'meeting-notes'
  | 'transcription'
  | 'translation'
  | 'voice-history'

export type DocumentTool =
  | 'summarize'
  | 'ask-questions'
  | 'extract-text'
  | 'table-extraction'
  | 'ocr-result'
  | 'document-translation'

export type ImageTool =
  | 'ocr'
  | 'caption'
  | 'image-explanation'
  | 'image-to-text'
  | 'image-summary'

export type CodingTool =
  | 'generate-code'
  | 'explain-code'
  | 'refactor'
  | 'optimize'
  | 'generate-sql'
  | 'regex-generator'
  | 'unit-test-generator'
  | 'api-generator'
  | 'documentation-generator'
  | 'code-review'
  | 'bug-fixer'
  | 'code-converter'
  | 'commit-message'
  | 'diagram-generator'
  | 'security-analysis'
  | 'performance-analysis'

export type TranslationTool =
  | 'translate'
  | 'detect-language'
  | 'compare-translation'
  | 'history'
  | 'document-translation'
  | 'image-translation'

export type ResearchTool =
  | 'research'
  | 'summary'
  | 'references'
  | 'export'

export type CodeTheme = 'github' | 'monokai' | 'dracula' | 'one-dark' | 'one-light' | 'nord'

export interface AiAttachment {
  id: string
  name: string
  type: string
  size: number
  url?: string
  progress?: number
  status: 'uploading' | 'uploaded' | 'error'
  error?: string
}

export interface MessageContent {
  text?: string
  attachments?: AiAttachment[]
}

export interface AiMessage {
  id: string
  role: MessageRole
  content: string
  attachments?: AiAttachment[]
  timestamp: number
  isLoading?: boolean
  isStreaming?: boolean
  error?: string
  toolCalls?: ToolCall[]
  metadata?: Record<string, unknown>
}

export interface ToolCall {
  id: string
  type: string
  name: string
  arguments: Record<string, unknown>
  result?: string
}

export interface Conversation {
  id: string
  title: string
  messages: AiMessage[]
  studio: StudioType
  createdAt: number
  updatedAt: number
  isPinned: boolean
  messageCount?: number
  lastMessage?: string
  metadata?: Record<string, unknown>
}

export interface AiStudio {
  id: StudioType
  title: string
  description: string
  icon: string
  color: string
  gradient: string
  tools: string[]
}

export interface RecentActivity {
  id: string
  type: 'chat' | 'document' | 'voice' | 'task' | 'translation'
  title: string
  subtitle: string
  timestamp: number
  conversationId?: string
  studio: StudioType
}

export interface FavoriteTool {
  id: string
  name: string
  icon: string
  studio: StudioType
  tool: string
}

export interface AiSettings {
  streamingEnabled: boolean
  autoScroll: boolean
  markdownRendering: boolean
  codeTheme: CodeTheme
  fontSize: 'sm' | 'md' | 'lg'
}

export interface AiSearchResult {
  id: string
  type: 'conversation' | 'message' | 'tool'
  title: string
  preview: string
  studio?: StudioType
  conversationId?: string
}

export interface StreamChunk {
  content: string
  done: boolean
  error?: string
  toolCalls?: ToolCall[]
  metadata?: Record<string, unknown>
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}

export interface ChatRequest {
  message: string
  conversationId?: string
  attachments?: AiAttachment[]
  stream?: boolean
  signal?: AbortSignal
}

export interface StudioRequest {
  tool: string
  input?: string
  context?: Record<string, unknown>
  attachments?: AiAttachment[]
  stream?: boolean
  signal?: AbortSignal
  question?: string
  format?: string
  language?: string
  targetLanguage?: string
  sourceLanguage?: string
  depth?: string
  imageUrl?: string
}

export interface VoiceHistoryItem {
  id: string
  tool: VoiceTool
  input: string
  result: string
  audioUrl?: string
  duration?: number
  language?: string
  confidence?: number
  wordCount?: number
  createdAt: number
}

export interface ApiResponse<T = unknown> {
  data: T
  error?: ApiError
  success: boolean
}

export interface StreamingResponse {
  content: string
  done: boolean
  error?: string
}
