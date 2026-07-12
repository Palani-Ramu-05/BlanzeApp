import { useCallback, useRef, useState } from 'react'
import { useAppDispatch } from '@core/hooks/useStore'
import { aiService } from '../services/ai-service'
import { addRecentActivity } from '../store/aiWorkspaceSlice'
import type { StudioType, StreamChunk, StudioRequest } from '../dto/types'
import { generateId } from '@utils/index'
import toast from 'react-hot-toast'

interface UseAiStudioOptions {
  studio: StudioType
  tool: string
}

const STUDIO_SERVICE_MAP: Record<StudioType, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stream: (req: any, onChunk: (chunk: StreamChunk) => void, opts?: any) => Promise<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nonStream: (req: any, opts?: any) => Promise<any>
}> = {
  writing: {
    stream: aiService.streamWriting.bind(aiService),
    nonStream: aiService.writing.bind(aiService),
  },
  voice: {
    stream: aiService.streamVoice.bind(aiService),
    nonStream: aiService.voice.bind(aiService),
  },
  document: {
    stream: aiService.streamDocument.bind(aiService),
    nonStream: aiService.document.bind(aiService),
  },
  image: {
    stream: aiService.streamImage.bind(aiService),
    nonStream: aiService.image.bind(aiService),
  },
  coding: {
    stream: aiService.streamCoding.bind(aiService),
    nonStream: aiService.coding.bind(aiService),
  },
  translation: {
    stream: aiService.streamTranslate.bind(aiService),
    nonStream: aiService.translate.bind(aiService),
  },
  research: {
    stream: aiService.streamResearch.bind(aiService),
    nonStream: aiService.research.bind(aiService),
  },
  chat: {
    stream: aiService.streamChat.bind(aiService),
    nonStream: aiService.chat.bind(aiService),
  },
}

export function useAiStudio({ studio, tool }: UseAiStudioOptions) {
  const dispatch = useAppDispatch()
  const abortRef = useRef<AbortController | null>(null)
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (inputOrRequest: string | StudioRequest) => {
    const isObj = typeof inputOrRequest === 'object'
    const request: StudioRequest = isObj
      ? { ...inputOrRequest, stream: true }
      : { tool, input: inputOrRequest as string, stream: true }

    if (!request.input?.trim() && !request.question?.trim()) return

    setIsLoading(true)
    setIsStreaming(true)
    setError(null)
    setResult('')
    abortRef.current = new AbortController()

    const service = STUDIO_SERVICE_MAP[studio]
    if (!service) {
      setError(`Unknown studio type: ${studio}`)
      setIsLoading(false)
      setIsStreaming(false)
      return
    }

    try {
      let accumulated = ''
      await service.stream(
        { ...request, signal: abortRef.current.signal },
        (chunk: StreamChunk) => {
          accumulated += chunk.content
          setResult(accumulated)
        },
        { signal: abortRef.current.signal },
      )

      const displayInput = request.question || request.input || ''
      dispatch(addRecentActivity({
        id: generateId(),
        type: 'task',
        title: displayInput.slice(0, 60) + (displayInput.length > 60 ? '...' : ''),
        subtitle: `${studio} - ${tool}`,
        timestamp: Date.now(),
        studio,
      }))
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setResult((prev) => prev + '\n\n[Generation stopped]')
      } else {
        const errMsg = error instanceof Error ? error.message : 'An error occurred'
        setError(errMsg)
        toast.error(errMsg)
      }
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [dispatch, studio, tool])

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clearResult = useCallback(() => {
    setResult('')
    setError(null)
  }, [])

  const retry = useCallback(async (inputOrRequest: string | StudioRequest) => {
    await generate(inputOrRequest)
  }, [generate])

  return {
    result,
    isLoading,
    isStreaming,
    error,
    generate,
    stopGeneration,
    clearResult,
    retry,
  }
}
