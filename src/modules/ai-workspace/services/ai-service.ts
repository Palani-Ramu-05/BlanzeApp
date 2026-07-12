import { AI_CONFIG } from '../config/ai-config'
import { apiPost, apiGet, apiPatch, apiDelete, apiStream } from '@core/http/methods/axios-api'
import envConfig from '@core/config/envConfig'
import { STORAGE_KEYS } from '@core/constants/constants'
import type {
  ApiResponse,
  ChatRequest,
  StudioRequest,
  StreamChunk,
  AiMessage,
  Conversation,
  VoiceHistoryItem,
} from '../dto/types'
import { generateId } from '@utils/index'

const AI_BASE_URL = `${envConfig.API_BASE_URL}/ai-workspace`

function getAccessToken(): string | null {
  const session = localStorage.getItem(STORAGE_KEYS.AI_SESSION)
  if (!session) return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  try {
    const parsed = JSON.parse(session)
    return parsed?.access_token || null
  } catch {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  }
}

interface RequestOptions {
  signal?: AbortSignal
  onProgress?: (progress: number) => void
}

function buildChatBody(request: ChatRequest) {
  return {
    message: request.message,
    conversationId: request.conversationId,
    attachments: request.attachments,
    stream: request.stream ?? true,
  }
}

function buildStudioBody(request: StudioRequest) {
  const body: Record<string, any> = {
    tool: request.tool,
    stream: request.stream ?? true,
  }
  if (request.input) body.input = request.input
  if (request.context) body.context = request.context
  if (request.attachments) body.attachments = request.attachments
  if (request.question) body.question = request.question
  if (request.format) body.format = request.format
  if (request.language) body.language = request.language
  if (request.targetLanguage) body.targetLanguage = request.targetLanguage
  if (request.sourceLanguage) body.sourceLanguage = request.sourceLanguage
  if (request.depth) body.depth = request.depth
  if (request.imageUrl) body.imageUrl = request.imageUrl
  return body
}

async function streamResponse(
  response: Response,
  onChunk: (chunk: StreamChunk) => void,
  signal?: AbortSignal,
): Promise<string> {
  if (!response.body) throw new Error('Response body is null')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''
  let buffer = ''

  try {
    while (true) {
      if (signal?.aborted) {
        reader.cancel()
        break
      }

      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const data = trimmed.slice(6)
        if (data === '[DONE]') {
          onChunk({ content: '', done: true })
          continue
        }

        try {
          const parsed: StreamChunk & { content?: string } = JSON.parse(data)
          const content = parsed.content || ''
          fullContent += content
          onChunk({ content, done: parsed.done || false, error: parsed.error, toolCalls: parsed.toolCalls, metadata: parsed.metadata })
        } catch {
          if (data) {
            fullContent += data
            onChunk({ content: data, done: false })
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return fullContent
}

async function streamStudioCall(
  endpoint: string,
  request: StudioRequest,
  onChunk: (chunk: StreamChunk) => void,
  options?: RequestOptions,
): Promise<string> {
  const response = await apiStream(
    endpoint,
    buildStudioBody(request),
    { baseURL: AI_BASE_URL, signal: options?.signal },
  )

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody?.error?.message || `HTTP ${response.status}`)
  }
  return streamResponse(response, onChunk, options?.signal)
}

export const aiService = {
  async chat(request: ChatRequest, options?: RequestOptions): Promise<ApiResponse<{ message: AiMessage; conversationId: string }>> {
    const response = await apiPost<any>(
      AI_CONFIG.endpoints.chat,
      buildChatBody(request),
      { baseURL: AI_BASE_URL, signal: options?.signal },
    )
    const body = response.data
    return { data: body?.data, success: body?.success !== false }
  },

  async streamChat(
    request: ChatRequest,
    onChunk: (chunk: StreamChunk) => void,
    options?: RequestOptions,
  ): Promise<{ conversationId: string; content: string }> {
    const response = await apiStream(
      AI_CONFIG.endpoints.stream,
      buildChatBody(request),
      { baseURL: AI_BASE_URL, signal: options?.signal },
    )

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      throw new Error(errorBody.message || `HTTP ${response.status}`)
    }

    const conversationId = response.headers.get('x-conversation-id') || generateId()
    const content = await streamResponse(response, onChunk, options?.signal)
    onChunk({ content: '', done: true })

    return { conversationId, content }
  },

  async writing(request: StudioRequest, options?: RequestOptions): Promise<ApiResponse<{ result: string }>> {
    const response = await apiPost<any>(
      AI_CONFIG.endpoints.writing,
      buildStudioBody(request),
      { baseURL: AI_BASE_URL, signal: options?.signal },
    )
    const body = response.data
    return { data: body?.data, success: body?.success !== false }
  },

  async streamWriting(
    request: StudioRequest,
    onChunk: (chunk: StreamChunk) => void,
    options?: RequestOptions,
  ): Promise<string> {
    return streamStudioCall(AI_CONFIG.endpoints.writing, request, onChunk, options)
  },

  async voice(request: StudioRequest, options?: RequestOptions): Promise<ApiResponse<{ result: string; audioUrl?: string }>> {
    const response = await apiPost<any>(
      AI_CONFIG.endpoints.voice,
      buildStudioBody(request),
      { baseURL: AI_BASE_URL, signal: options?.signal },
    )
    const body = response.data
    return { data: body?.data, success: body?.success !== false }
  },

  async streamVoice(
    request: StudioRequest,
    onChunk: (chunk: StreamChunk) => void,
    options?: RequestOptions,
  ): Promise<string> {
    return streamStudioCall(AI_CONFIG.endpoints.voice, request, onChunk, options)
  },

  async document(request: StudioRequest, options?: RequestOptions): Promise<ApiResponse<{ result: string }>> {
    const response = await apiPost<any>(
      AI_CONFIG.endpoints.document,
      buildStudioBody(request),
      { baseURL: AI_BASE_URL, signal: options?.signal },
    )
    const body = response.data
    return { data: body?.data, success: body?.success !== false }
  },

  async streamDocument(
    request: StudioRequest,
    onChunk: (chunk: StreamChunk) => void,
    options?: RequestOptions,
  ): Promise<string> {
    return streamStudioCall(AI_CONFIG.endpoints.document, request, onChunk, options)
  },

  async image(request: StudioRequest, options?: RequestOptions): Promise<ApiResponse<{ result: string; imageUrl?: string }>> {
    const response = await apiPost<any>(
      AI_CONFIG.endpoints.image,
      buildStudioBody(request),
      { baseURL: AI_BASE_URL, signal: options?.signal },
    )
    const body = response.data
    return { data: body?.data, success: body?.success !== false }
  },

  async streamImage(
    request: StudioRequest,
    onChunk: (chunk: StreamChunk) => void,
    options?: RequestOptions,
  ): Promise<string> {
    return streamStudioCall(AI_CONFIG.endpoints.image, request, onChunk, options)
  },

  async coding(request: StudioRequest, options?: RequestOptions): Promise<ApiResponse<{ result: string }>> {
    const response = await apiPost<any>(
      AI_CONFIG.endpoints.coding,
      buildStudioBody(request),
      { baseURL: AI_BASE_URL, signal: options?.signal },
    )
    const body = response.data
    return { data: body?.data, success: body?.success !== false }
  },

  async streamCoding(
    request: StudioRequest,
    onChunk: (chunk: StreamChunk) => void,
    options?: RequestOptions,
  ): Promise<string> {
    return streamStudioCall(AI_CONFIG.endpoints.coding, request, onChunk, options)
  },

  async translate(request: StudioRequest, options?: RequestOptions): Promise<ApiResponse<{ result: string; detectedLanguage?: string }>> {
    const response = await apiPost<any>(
      AI_CONFIG.endpoints.translation,
      buildStudioBody(request),
      { baseURL: AI_BASE_URL, signal: options?.signal },
    )
    const body = response.data
    return { data: body?.data, success: body?.success !== false }
  },

  async streamTranslate(
    request: StudioRequest,
    onChunk: (chunk: StreamChunk) => void,
    options?: RequestOptions,
  ): Promise<string> {
    return streamStudioCall(AI_CONFIG.endpoints.translation, request, onChunk, options)
  },

  async research(request: StudioRequest, options?: RequestOptions): Promise<ApiResponse<{ result: string; references?: string[] }>> {
    const response = await apiPost<any>(
      AI_CONFIG.endpoints.research,
      buildStudioBody(request),
      { baseURL: AI_BASE_URL, signal: options?.signal },
    )
    const body = response.data
    return { data: body?.data, success: body?.success !== false }
  },

  async streamResearch(
    request: StudioRequest,
    onChunk: (chunk: StreamChunk) => void,
    options?: RequestOptions,
  ): Promise<string> {
    return streamStudioCall(AI_CONFIG.endpoints.research, request, onChunk, options)
  },

  async speechToText(audioBlob: Blob, options?: RequestOptions): Promise<ApiResponse<{ text: string; confidence?: number; language?: string }>> {
    const formData = new FormData()
    formData.append('audio', audioBlob)
    const response = await apiPost<{ success: boolean; data: { text: string; confidence?: number; language?: string } }>(
      AI_CONFIG.endpoints.speechToText,
      formData,
      { baseURL: AI_BASE_URL, signal: options?.signal, headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return { data: response.data.data, success: response.data.success }
  },

  async textToSpeech(text: string, options?: RequestOptions): Promise<Blob> {
    const { data } = await apiPost<Blob>(
      AI_CONFIG.endpoints.textToSpeech,
      { text },
      { baseURL: AI_BASE_URL, signal: options?.signal, responseType: 'blob' },
    )
    return data
  },

  async uploadFile(file: File, onProgress?: (progress: number) => void, signal?: AbortSignal): Promise<ApiResponse<{ url: string; name: string; type: string; size: number }>> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await apiPost<{ url: string; name: string; type: string; size: number }>(
      AI_CONFIG.endpoints.upload,
      formData,
      {
        baseURL: AI_BASE_URL,
        signal,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress ? (e) => onProgress(Math.round((e.loaded / (e.total || 1)) * 100)) : undefined,
      },
    )
    return { data, success: true }
  },

  async detectLanguage(text: string, options?: RequestOptions): Promise<ApiResponse<{ language: string; confidence: number }>> {
    const { data } = await apiPost<{ language: string; confidence: number }>(
      AI_CONFIG.endpoints.detectLanguage,
      { text },
      { baseURL: AI_BASE_URL, signal: options?.signal },
    )
    return { data, success: true }
  },

  async getConversationHistory(page = 1, limit = 20, signal?: AbortSignal): Promise<ApiResponse<{ conversations: Conversation[]; total: number }>> {
    const response = await apiGet<any>(
      `/conversations?page=${page}&limit=${limit}`,
      { baseURL: AI_BASE_URL, signal },
    )
    const body = response.data
    const conversations = body?.data?.conversations || []
    const total = body?.data?.pagination?.total || 0
    return { data: { conversations, total }, success: true }
  },

  async getConversation(id: string, signal?: AbortSignal): Promise<ApiResponse<Conversation>> {
    const response = await apiGet<any>(
      `/conversations/${id}`,
      { baseURL: AI_BASE_URL, signal },
    )
    const body = response.data
    return { data: body?.data, success: body?.success !== false }
  },

  async deleteConversation(id: string): Promise<ApiResponse<void>> {
    const response = await apiDelete<any>(
      `/conversations/${id}`,
      { baseURL: AI_BASE_URL },
    )
    const body = response.data
    return { data: body?.data, success: body?.success !== false }
  },

  async renameConversation(id: string, title: string): Promise<ApiResponse<Conversation>> {
    const response = await apiPatch<any>(
      `/conversations/${id}`,
      { title },
      { baseURL: AI_BASE_URL },
    )
    const body = response.data
    return { data: body?.data, success: body?.success !== false }
  },

  async togglePinConversation(id: string, isPinned: boolean): Promise<ApiResponse<Conversation>> {
    const response = await apiPatch<any>(
      `/conversations/${id}/pin`,
      { isPinned },
      { baseURL: AI_BASE_URL },
    )
    const body = response.data
    return { data: body?.data, success: body?.success !== false }
  },

  async searchConversations(query: string, signal?: AbortSignal): Promise<ApiResponse<Conversation[]>> {
    const response = await apiGet<any>(
      `/conversations/search?q=${encodeURIComponent(query)}`,
      { baseURL: AI_BASE_URL, signal },
    )
    const body = response.data
    return { data: body?.data?.conversations || [], success: body?.success !== false }
  },

  async getVoiceHistory(page = 1, limit = 20, signal?: AbortSignal): Promise<ApiResponse<{ items: VoiceHistoryItem[]; total: number }>> {
    const response = await apiGet<any>(
      `${AI_CONFIG.endpoints.voiceHistory}?page=${page}&limit=${limit}`,
      { baseURL: AI_BASE_URL, signal },
    )
    return { data: response.data?.data, success: true }
  },

  async getVoiceHistoryItem(id: string, signal?: AbortSignal): Promise<ApiResponse<VoiceHistoryItem>> {
    const response = await apiGet<any>(
      `${AI_CONFIG.endpoints.voiceHistory}/${id}`,
      { baseURL: AI_BASE_URL, signal },
    )
    return { data: response.data?.data, success: true }
  },

  async deleteVoiceHistoryItem(id: string): Promise<ApiResponse<void>> {
    await apiDelete(`${AI_CONFIG.endpoints.voiceHistory}/${id}`, { baseURL: AI_BASE_URL })
    return { data: undefined, success: true }
  },

  async searchVoiceHistory(query: string, signal?: AbortSignal): Promise<ApiResponse<{ items: VoiceHistoryItem[] }>> {
    const response = await apiGet<any>(
      `${AI_CONFIG.endpoints.voiceHistorySearch}?q=${encodeURIComponent(query)}`,
      { baseURL: AI_BASE_URL, signal },
    )
    return { data: response.data?.data, success: true }
  },

  async processImage(
    file: File,
    tool: string,
    options?: {
      signal?: AbortSignal;
      onProgress?: (progress: number) => void;
      captionStyle?: string;
      explanationDepth?: string;
      textFormat?: string;
      targetLanguage?: string;
    }
  ): Promise<ApiResponse<{ result: string; metadata?: Record<string, unknown> }>> {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('tool', tool)
    formData.append('stream', 'false')
    if (options?.captionStyle) formData.append('captionStyle', options.captionStyle)
    if (options?.explanationDepth) formData.append('explanationDepth', options.explanationDepth)
    if (options?.textFormat) formData.append('textFormat', options.textFormat)
    if (options?.targetLanguage) formData.append('targetLanguage', options.targetLanguage)

    const { data } = await apiPost<{ result: string; metadata?: Record<string, unknown> }>(
      AI_CONFIG.endpoints.imageProcess,
      formData,
      {
        baseURL: AI_BASE_URL,
        signal: options?.signal,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: options?.onProgress ? (e) => options.onProgress!(Math.round((e.loaded / (e.total || 1)) * 100)) : undefined,
      },
    )
    return { data, success: true }
  },

  async streamProcessImage(
    file: File,
    tool: string,
    onChunk: (chunk: StreamChunk) => void,
    options?: {
      signal?: AbortSignal;
      onProgress?: (progress: number) => void;
      captionStyle?: string;
      explanationDepth?: string;
      textFormat?: string;
      targetLanguage?: string;
    }
  ): Promise<string> {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('tool', tool)
    formData.append('stream', 'true')
    if (options?.captionStyle) formData.append('captionStyle', options.captionStyle)
    if (options?.explanationDepth) formData.append('explanationDepth', options.explanationDepth)
    if (options?.textFormat) formData.append('textFormat', options.textFormat)
    if (options?.targetLanguage) formData.append('targetLanguage', options.targetLanguage)

    const token = getAccessToken()
    const response = await fetch(`${AI_BASE_URL}${AI_CONFIG.endpoints.imageProcess}`, {
      method: 'POST',
      body: formData,
      signal: options?.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      throw new Error(errorBody?.error?.message || `HTTP ${response.status}`)
    }

    return streamResponse(response, onChunk, options?.signal)
  },

  getStreamingResponseFallback(response: StreamChunk): AiMessage {
    return {
      id: generateId(),
      role: 'assistant',
      content: response.content,
      timestamp: Date.now(),
      isStreaming: !response.done,
      error: response.error,
    }
  },
}
