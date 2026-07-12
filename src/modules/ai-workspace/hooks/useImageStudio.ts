import { useCallback, useRef, useState } from 'react'
import { aiService } from '../services/ai-service'
import type { StreamChunk } from '../dto/types'
import toast from 'react-hot-toast'

export type ImageTool =
  | 'ocr'
  | 'caption'
  | 'image-explanation'
  | 'image-to-text'
  | 'image-summary'
  | 'object-detection'
  | 'image-tagging'
  | 'color-analysis'
  | 'image-metadata'
  | 'face-analysis'
  | 'document-analysis'
  | 'table-detection'
  | 'chart-analysis'
  | 'qr-barcode'
  | 'image-translation'
  | 'background-analysis'
  | 'image-quality'
  | 'accessibility'
  | 'smart-search'

export interface ImageMetadata {
  tool?: string
  format?: string
  width?: number
  height?: number
  fileSize?: number
  aspectRatio?: string
  provider?: string
  model?: string
  latency?: number
  tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number } | null
  finishReason?: string
}

export interface ProcessOptions {
  captionStyle?: string
  explanationDepth?: string
  textFormat?: string
  targetLanguage?: string
}

export function useImageStudio() {
  const abortRef = useRef<AbortController | null>(null)
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null)
  const [processingStage, setProcessingStage] = useState<string | null>(null)
  const stageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateStage = useCallback((stage: string | null) => {
    setProcessingStage(stage)
    if (stageTimeoutRef.current) {
      clearTimeout(stageTimeoutRef.current)
    }
  }, [])

  const process = useCallback(async (
    file: File,
    tool: ImageTool | string,
    opts?: ProcessOptions,
  ) => {
    if (!file) return

    setIsLoading(true)
    setIsStreaming(true)
    setError(null)
    setMetadata(null)
    setResult('')
    setUploadProgress(0)
    updateStage('uploading')
    abortRef.current = new AbortController()

    try {
      let accumulated = ''
      await aiService.streamProcessImage(
        file, tool,
        (chunk: StreamChunk) => {
          if (chunk.content) {
            accumulated += chunk.content
            setResult(accumulated)
          }
          if (chunk.metadata) {
            setMetadata(chunk.metadata as ImageMetadata)
          }
          if (chunk.done) {
            updateStage(null)
          }
        },
        {
          signal: abortRef.current.signal,
          onProgress: (progress: number) => {
            setUploadProgress(progress)
            if (progress < 100) {
              updateStage('uploading')
            } else {
              updateStage('analyzing')
            }
          },
          captionStyle: opts?.captionStyle,
          explanationDepth: opts?.explanationDepth,
          textFormat: opts?.textFormat,
          targetLanguage: opts?.targetLanguage,
        },
      )

      updateStage('done')
      setTimeout(() => updateStage(null), 2000)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setResult((prev) => prev + '\n\n[Processing stopped]')
        updateStage(null)
      } else {
        const msg = err instanceof Error ? err.message : 'An error occurred'
        setError(msg)
        updateStage('error')
        toast.error(msg)
      }
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      if (abortRef.current) {
        abortRef.current = null
      }
    }
  }, [updateStage])

  const processNonStreaming = useCallback(async (
    file: File,
    tool: ImageTool | string,
    opts?: ProcessOptions,
  ) => {
    if (!file) return

    setIsLoading(true)
    setIsStreaming(false)
    setError(null)
    setMetadata(null)
    setResult('')
    setUploadProgress(0)
    updateStage('uploading')
    abortRef.current = new AbortController()

    try {
      const response = await aiService.processImage(
        file, tool,
        {
          signal: abortRef.current.signal,
          onProgress: (progress: number) => {
            setUploadProgress(progress)
          },
          captionStyle: opts?.captionStyle,
          explanationDepth: opts?.explanationDepth,
          textFormat: opts?.textFormat,
          targetLanguage: opts?.targetLanguage,
        },
      )

      if (response.success && response.data?.result) {
        setResult(response.data.result)
        setMetadata(response.data.metadata || null)
      } else {
        setError('No result returned from server')
      }

      updateStage('done')
      setTimeout(() => updateStage(null), 2000)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        updateStage(null)
      } else {
        const msg = err instanceof Error ? err.message : 'An error occurred'
        setError(msg)
        updateStage('error')
        toast.error(msg)
      }
    } finally {
      setIsLoading(false)
      if (abortRef.current) {
        abortRef.current = null
      }
    }
  }, [updateStage])

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clear = useCallback(() => {
    setResult('')
    setError(null)
    setMetadata(null)
    setUploadProgress(0)
    updateStage(null)
    if (stageTimeoutRef.current) {
      clearTimeout(stageTimeoutRef.current)
    }
  }, [updateStage])

  const retry = useCallback(async (
    file: File,
    tool: ImageTool | string,
    opts?: ProcessOptions,
  ) => {
    await process(file, tool, opts)
  }, [process])

  return {
    result,
    isLoading,
    isStreaming,
    error,
    uploadProgress,
    metadata,
    processingStage,
    process,
    processNonStreaming,
    stop,
    clear,
    retry,
  }
}
