import { apiPost } from '@core/http/methods/axios-api'
import type {
  PdfMergeOptions,
  PdfSplitOptions,
  PdfExtractPagesOptions,
  PdfDeletePagesOptions,
  PdfRotatePagesOptions,
  PdfReorderPagesOptions,
  PdfExtractTextOptions,
  PdfCompressOptions,
  PdfMetadataResponse,
} from '../dto/pdf.dto'

const BASE = '/file-studio/pdf'

function buildFormData(file: File | File[], options: Record<string, unknown>): FormData {
  const fd = new FormData()
  if (Array.isArray(file)) {
    file.forEach((f) => fd.append('files', f))
  } else {
    fd.append('file', file)
  }
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      fd.append(key, String(value))
    }
  })
  return fd
}

export const pdfService = {
  merge(files: File[], options: PdfMergeOptions) {
    const fd = buildFormData(files, { operation: 'merge' })
    return apiPost<Blob>(`${BASE}/merge`, fd, {
      responseType: 'blob',
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  split(file: File, options: PdfSplitOptions) {
    const fd = buildFormData(file, { ...options, operation: 'split' })
    return apiPost<Blob>(`${BASE}/split`, fd, {
      responseType: 'blob',
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  extractPages(file: File, options: PdfExtractPagesOptions) {
    const fd = buildFormData(file, { ...options, operation: 'extract-pages' })
    return apiPost<Blob>(`${BASE}/extract-pages`, fd, {
      responseType: 'blob',
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  deletePages(file: File, options: PdfDeletePagesOptions) {
    const fd = buildFormData(file, { ...options, operation: 'delete-pages' })
    return apiPost<Blob>(`${BASE}/delete-pages`, fd, {
      responseType: 'blob',
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  rotatePages(file: File, options: PdfRotatePagesOptions) {
    const fd = buildFormData(file, { ...options, operation: 'rotate-pages' })
    return apiPost<Blob>(`${BASE}/rotate-pages`, fd, {
      responseType: 'blob',
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  reorderPages(file: File, options: PdfReorderPagesOptions) {
    const fd = buildFormData(file, { ...options, operation: 'reorder-pages' })
    return apiPost<Blob>(`${BASE}/reorder-pages`, fd, {
      responseType: 'blob',
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  extractText(file: File, options: PdfExtractTextOptions) {
    const fd = buildFormData(file, { ...options, operation: 'extract-text' })
    return apiPost<string>(`${BASE}/extract-text`, fd, {
      responseType: 'text',
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  compress(file: File, options: PdfCompressOptions) {
    const fd = buildFormData(file, { ...options, operation: 'compress' })
    return apiPost<Blob>(`${BASE}/compress`, fd, {
      responseType: 'blob',
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getMetadata(file: File) {
    const fd = buildFormData(file, { operation: 'metadata' })
    return apiPost<PdfMetadataResponse>(`${BASE}/metadata`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
