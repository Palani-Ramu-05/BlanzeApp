import { useMutation } from '@tanstack/react-query'
import { compressionService } from '../services/compression.service'
import { useAppDispatch } from '@core/hooks/useStore'
import { setResult, setError, setUploadStatus } from '../store/fileStudioSlice'
import { UploadStatus } from '../dto/common'
import type { CompressionOptions } from '../dto/compression.dto'
import toast from 'react-hot-toast'

export function useCompression(
  file: File | null,
  createPreviewUrl: (blob: Blob) => string,
  filename?: string | null,
) {
  const dispatch = useAppDispatch()

  const compress = useMutation({
    mutationFn: (options: CompressionOptions) => compressionService.compress(file!, options),
    onSuccess: (response: { data: Blob }) => {
      const blob = response.data
      const previewUrl = createPreviewUrl(blob)
      dispatch(
        setResult({
          blob,
          filename: `compressed-${filename || file?.name || 'file'}`,
          mimeType: blob.type || file?.type || 'application/octet-stream',
          previewUrl,
        }),
      )
      dispatch(setUploadStatus(UploadStatus.Complete))
      toast.success('File compressed')
    },
    onError: (err: Error) => {
      dispatch(setError({ code: 'PROCESSING_ERROR', message: err.message }))
      dispatch(setUploadStatus(UploadStatus.Error))
      toast.error(`Compression failed: ${err.message}`)
    },
  })

  return { compress }
}
