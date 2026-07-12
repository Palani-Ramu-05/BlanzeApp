import { apiPost } from '@core/http/methods/axios-api'
import type {
  ImageCompressOptions,
  ImageResizeOptions,
  ImageCropOptions,
  ImageRotateOptions,
  ImageFlipOptions,
  ImageConvertOptions,
  ImageWatermarkOptions,
} from '../dto/image.dto'

const BASE = '/file-studio/image'

function buildFormData(file: File, options: Record<string, unknown>): FormData {
  const fd = new FormData()
  fd.append('file', file)
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      fd.append(key, String(value))
    }
  })
  return fd
}

export const imageService = {
  compress(file: File, options: ImageCompressOptions) {
    const fd = buildFormData(file, { ...options, operation: 'compress' })
    return apiPost<Blob>(`${BASE}/compress`, fd, {
      responseType: 'blob',
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  resize(file: File, options: ImageResizeOptions) {
    const fd = buildFormData(file, { ...options, operation: 'resize' })
    return apiPost<Blob>(`${BASE}/resize`, fd, {
      responseType: 'blob',
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  crop(file: File, options: ImageCropOptions) {
    const fd = buildFormData(file, { ...options, operation: 'crop' })
    return apiPost<Blob>(`${BASE}/crop`, fd, {
      responseType: 'blob',
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  rotate(file: File, options: ImageRotateOptions) {
    const fd = buildFormData(file, { ...options, operation: 'rotate' })
    return apiPost<Blob>(`${BASE}/rotate`, fd, {
      responseType: 'blob',
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  flip(file: File, options: ImageFlipOptions) {
    const fd = buildFormData(file, { ...options, operation: 'flip' })
    return apiPost<Blob>(`${BASE}/flip`, fd, {
      responseType: 'blob',
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  convert(file: File, options: ImageConvertOptions) {
    const fd = buildFormData(file, { ...options, operation: 'convert' })
    return apiPost<Blob>(`${BASE}/convert`, fd, {
      responseType: 'blob',
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  watermark(file: File, options: ImageWatermarkOptions) {
    const fd = buildFormData(file, { ...options, operation: 'watermark' })
    if (options.image) {
      fd.append('watermarkImage', options.image)
    }
    return apiPost<Blob>(`${BASE}/watermark`, fd, {
      responseType: 'blob',
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
