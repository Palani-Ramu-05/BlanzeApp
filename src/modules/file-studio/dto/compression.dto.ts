export enum CompressionLevel {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export interface CompressionOptions {
  level: CompressionLevel
  keepMetadata?: boolean
  targetFormat?: string
}

export interface CompressionEstimate {
  originalSize: number
  estimatedSize: number
  compressionRatio: number
  savingsPercent: number
}

export interface CompressionResult {
  blob: Blob
  filename: string
  mimeType: string
  originalSize: number
  compressedSize: number
  compressionRatio: number
  savingsPercent: number
}
