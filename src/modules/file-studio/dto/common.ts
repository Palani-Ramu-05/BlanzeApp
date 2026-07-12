export enum UploadStatus {
  Idle = 'idle',
  Validating = 'validating',
  Uploading = 'uploading',
  Processing = 'processing',
  PreparingDownload = 'preparing-download',
  Downloading = 'downloading',
  Complete = 'complete',
  Error = 'error',
}

export interface FileDetails {
  name: string
  extension: string
  mimeType: string
  size: number
  sizeFormatted: string
  dimensions?: { width: number; height: number }
  resolution?: { dpi: number }
  lastModified?: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
}

export interface FileUploadResponse {
  file: Blob
  filename: string
  mimeType: string
  size: number
  details?: FileDetails
}

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: ApiError
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

export interface UploadConfig {
  maxSizeBytes: number
  allowedMimeTypes: string[]
  maxFiles?: number
}

export const IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
] as const

export const PDF_MIME_TYPES = ['application/pdf'] as const

export const COMPRESSIBLE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
] as const

export const FILE_SIZE_LIMITS = {
  image: 20 * 1024 * 1024,
  pdf: 50 * 1024 * 1024,
  compression: 30 * 1024 * 1024,
  converter: 10 * 1024 * 1024,
} as const

export interface ProcessingResult {
  blob: Blob
  filename: string
  mimeType: string
  size: number
  previewUrl: string
}
