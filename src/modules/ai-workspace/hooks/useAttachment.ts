import { useState, useCallback } from 'react'
import type { AiAttachment } from '../dto/types'
import { aiService } from '../services/ai-service'
import { generateId } from '@utils/index'

export function useAttachment() {
  const [attachments, setAttachments] = useState<AiAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const addFile = useCallback(async (file: File) => {
    const attachment: AiAttachment = {
      id: generateId(),
      name: file.name,
      type: file.type,
      size: file.size,
      status: 'uploading',
      progress: 0,
    }

    setAttachments((prev) => [...prev, attachment])
    setIsUploading(true)

    try {
      const response = await aiService.uploadFile(file, (progress) => {
        setAttachments((prev) =>
          prev.map((a) => (a.id === attachment.id ? { ...a, progress } : a)),
        )
      })

      if (response.success && response.data) {
        setAttachments((prev) =>
          prev.map((a) =>
            a.id === attachment.id
              ? { ...a, status: 'uploaded', url: response.data.url, progress: 100 }
              : a,
          ),
        )
      }
    } catch {
      setAttachments((prev) =>
        prev.map((a) =>
          a.id === attachment.id ? { ...a, status: 'error', error: 'Upload failed' } : a,
        ),
      )
    } finally {
      setIsUploading(false)
    }
  }, [])

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const clearAttachments = useCallback(() => {
    setAttachments([])
  }, [])

  return {
    attachments,
    isUploading,
    addFile,
    removeAttachment,
    clearAttachments,
    setAttachments,
  }
}
