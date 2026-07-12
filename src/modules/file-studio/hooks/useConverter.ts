import { useMutation } from '@tanstack/react-query'
import { converterService } from '../services/converter.service'
import { useAppDispatch } from '@core/hooks/useStore'
import { setResult, setError, setUploadStatus } from '../store/fileStudioSlice'
import { UploadStatus } from '../dto/common'
import type { ConversionType } from '../dto/converter.dto'
import toast from 'react-hot-toast'

export function useConverter(
  file: File | null,
  createPreviewUrl: (blob: Blob) => string,
  filename?: string | null,
) {
  const dispatch = useAppDispatch()

  const convert = useMutation({
    mutationFn: ({
      conversionType,
      quality,
    }: {
      conversionType: ConversionType
      quality?: number
    }) => converterService.convert(file!, conversionType, quality),
    onSuccess: (response: { data: Blob | string }) => {
      const raw = response.data
      const blob: Blob = raw instanceof Blob ? raw : new Blob([raw], { type: 'text/plain' })
      const previewUrl = createPreviewUrl(blob)
      const mime = blob.type
      const ext = mime.includes('json') ? 'json' : mime.includes('csv') ? 'csv' : mime.split('/')[1] || 'bin'
      const base = (filename || file?.name || 'file').replace(/\.[^.]+$/, '')
      dispatch(
        setResult({
          blob,
          filename: `${base}-converted.${ext}`,
          mimeType: mime,
          previewUrl,
        }),
      )
      dispatch(setUploadStatus(UploadStatus.Complete))
      toast.success('Conversion completed')
    },
    onError: (err: Error) => {
      dispatch(setError({ code: 'CONVERSION_ERROR', message: err.message }))
      dispatch(setUploadStatus(UploadStatus.Error))
      toast.error(`Conversion failed: ${err.message}`)
    },
  })

  return { convert }
}
