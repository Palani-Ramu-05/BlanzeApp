import { apiPost } from '@core/http/methods/axios-api'
import type { ConversionType } from '../dto/converter.dto'

const BASE = '/file-studio/convert'

export const converterService = {
  convert(file: File, conversionType: ConversionType, quality?: number) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('conversionType', conversionType)
    if (quality !== undefined) {
      fd.append('quality', String(quality))
    }

    const isImage = conversionType.startsWith('png') || conversionType.startsWith('jpg') || conversionType.startsWith('webp')

    return apiPost<Blob>(BASE, fd, {
      responseType: isImage ? 'blob' : 'text',
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
