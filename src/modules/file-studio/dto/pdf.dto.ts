export enum PdfOperation {
  Merge = 'merge',
  Split = 'split',
  ExtractPages = 'extract-pages',
  DeletePages = 'delete-pages',
  RotatePages = 'rotate-pages',
  ReorderPages = 'reorder-pages',
  ExtractText = 'extract-text',
  Compress = 'compress',
  Metadata = 'metadata',
}

export interface PdfMergeOptions {
  files: File[]
}

export interface PdfSplitOptions {
  mode: 'range' | 'every' | 'all'
  range?: { start: number; end: number }
  every?: number
}

export interface PdfExtractPagesOptions {
  pages: number[]
}

export interface PdfDeletePagesOptions {
  pages: number[]
}

export interface PdfRotatePagesOptions {
  pages: number[]
  angle: 90 | 180 | 270
}

export interface PdfReorderPagesOptions {
  order: number[]
}

export interface PdfExtractTextOptions {
  pages?: number[]
  format: 'plain' | 'json'
}

export interface PdfCompressOptions {
  quality: 'low' | 'medium' | 'high'
  reduceImageResolution?: boolean
}

export interface PdfMetadata {
  title?: string
  author?: string
  subject?: string
  keywords?: string[]
  creator?: string
  producer?: string
  creationDate?: string
  modificationDate?: string
  pageCount: number
  pageSize?: string
  fileSize: number
  version?: string
}

export interface PdfMetadataResponse {
  metadata: PdfMetadata
}

export type PdfOperationOptions =
  | { operation: PdfOperation.Merge; options: PdfMergeOptions }
  | { operation: PdfOperation.Split; options: PdfSplitOptions }
  | { operation: PdfOperation.ExtractPages; options: PdfExtractPagesOptions }
  | { operation: PdfOperation.DeletePages; options: PdfDeletePagesOptions }
  | { operation: PdfOperation.RotatePages; options: PdfRotatePagesOptions }
  | { operation: PdfOperation.ReorderPages; options: PdfReorderPagesOptions }
  | { operation: PdfOperation.ExtractText; options: PdfExtractTextOptions }
  | { operation: PdfOperation.Compress; options: PdfCompressOptions }
  | { operation: PdfOperation.Metadata }
