import { apiPost } from '@core/http/methods/axios-api'
import type { CompressionOptions } from '../dto/compression.dto'

const BASE = '/file-studio/compress'

export const compressionService = {
  compress(file: File, options: CompressionOptions) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('level', options.level)
    if (options.keepMetadata !== undefined) {
      fd.append('keepMetadata', String(options.keepMetadata))
    }
    if (options.targetFormat) {
      fd.append('targetFormat', options.targetFormat)
    }
    return apiPost<Blob>(BASE, fd, {
      responseType: 'blob',
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
