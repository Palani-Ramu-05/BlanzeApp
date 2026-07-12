import { useState, useCallback, useEffect, useRef } from 'react'
import { useAppDispatch } from '@core/hooks/useStore'
import { setError } from '../store/fileStudioSlice'
import { FILE_SIZE_LIMITS } from '../dto/common'
import type { FileDetails, UploadConfig } from '../dto/common'

function buildFileDetails(file: File): FileDetails {
  const parts = file.name.split('.')
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : ''
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(file.size) / Math.log(1024)))
  const sizeFormatted = `${(file.size / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`

  const details: FileDetails = {
    name: file.name,
    extension: ext,
    mimeType: file.type,
    size: file.size,
    sizeFormatted,
    lastModified: new Date(file.lastModified).toISOString(),
  }

  if (file.type.startsWith('image/')) {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      details.dimensions = { width: img.naturalWidth, height: img.naturalHeight }
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  return details
}

export function useFileUpload(config?: Partial<UploadConfig>) {
  const dispatch = useAppDispatch()
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [fileDetails, setFileDetailsState] = useState<FileDetails | null>(null)
  const urlRefs = useRef<string[]>([])

  useEffect(() => {
    return () => {
      urlRefs.current.forEach(URL.revokeObjectURL)
      urlRefs.current = []
    }
  }, [])

  const validateFile = useCallback(
    (file: File): string | null => {
      const maxSize = config?.maxSizeBytes ?? FILE_SIZE_LIMITS.image
      const allowed = config?.allowedMimeTypes ?? []

      if (allowed.length > 0 && !allowed.includes(file.type)) {
        return `Unsupported file type "${file.type}". Allowed: ${allowed.join(', ')}`
      }
      if (file.size > maxSize) {
        const mb = maxSize / (1024 * 1024)
        return `File is too large. Maximum size is ${mb}MB.`
      }
      if (file.size === 0) {
        return 'File is empty.'
      }
      return null
    },
    [config?.maxSizeBytes, config?.allowedMimeTypes],
  )

  const handleFile = useCallback(
    (file: File): boolean => {
      const error = validateFile(file)
      if (error) {
        dispatch(setError({ code: 'VALIDATION_ERROR', message: error }))
        return false
      }

      urlRefs.current.forEach(URL.revokeObjectURL)
      urlRefs.current = []

      setCurrentFile(file)
      setFileDetailsState(buildFileDetails(file))
      return true
    },
    [validateFile, dispatch],
  )

  const clearFile = useCallback(() => {
    urlRefs.current.forEach(URL.revokeObjectURL)
    urlRefs.current = []
    setCurrentFile(null)
    setFileDetailsState(null)
  }, [])

  const createPreviewUrl = useCallback((blob: Blob): string => {
    const url = URL.createObjectURL(blob)
    urlRefs.current.push(url)
    return url
  }, [])

  return {
    currentFile,
    fileDetails,
    handleFile,
    clearFile,
    validateFile,
    createPreviewUrl,
  }
}
