import { useMutation } from '@tanstack/react-query'
import { imageService } from '../services/image.service'
import { useAppDispatch } from '@core/hooks/useStore'
import { setResult, setError, setUploadStatus } from '../store/fileStudioSlice'
import { UploadStatus } from '../dto/common'
import type { FileDetails } from '../dto/common'
import type {
  ImageCompressOptions,
  ImageResizeOptions,
  ImageCropOptions,
  ImageRotateOptions,
  ImageFlipOptions,
  ImageConvertOptions,
  ImageWatermarkOptions,
} from '../dto/image.dto'
import toast from 'react-hot-toast'

export function useImageTools(
  file: File | null,
  createPreviewUrl: (blob: Blob) => string,
  fileDetails?: FileDetails | null,
) {
  const dispatch = useAppDispatch()

  const baseMutation = (operation: string) => ({
    onSuccess: (response: { data: Blob }) => {
      const blob = response.data
      const previewUrl = createPreviewUrl(blob)
      const ext = fileDetails?.extension || file?.name.split('.').pop() || 'bin'
      const baseName = file?.name?.replace(/\.[^.]+$/, '') || 'image'
      const filename = `${baseName}-${operation}.${ext}`
      dispatch(
        setResult({
          blob,
          filename,
          mimeType: blob.type || 'application/octet-stream',
          previewUrl,
        }),
      )
      dispatch(setUploadStatus(UploadStatus.Complete))
      toast.success(`${operation} completed`)
    },
    onError: (err: Error) => {
      dispatch(setError({ code: 'PROCESSING_ERROR', message: err.message }))
      dispatch(setUploadStatus(UploadStatus.Error))
      toast.error(`Failed: ${err.message}`)
    },
  })

  const compress = useMutation({
    mutationFn: (options: ImageCompressOptions) => imageService.compress(file!, options),
    ...baseMutation('compress'),
  })

  const resize = useMutation({
    mutationFn: (options: ImageResizeOptions) => imageService.resize(file!, options),
    ...baseMutation('resize'),
  })

  const crop = useMutation({
    mutationFn: (options: ImageCropOptions) => imageService.crop(file!, options),
    ...baseMutation('crop'),
  })

  const rotate = useMutation({
    mutationFn: (options: ImageRotateOptions) => imageService.rotate(file!, options),
    ...baseMutation('rotate'),
  })

  const flip = useMutation({
    mutationFn: (options: ImageFlipOptions) => imageService.flip(file!, options),
    ...baseMutation('flip'),
  })

  const convert = useMutation({
    mutationFn: (options: ImageConvertOptions) => imageService.convert(file!, options),
    ...baseMutation('convert'),
  })

  const watermark = useMutation({
    mutationFn: (options: ImageWatermarkOptions) => imageService.watermark(file!, options),
    ...baseMutation('watermark'),
  })

  return { compress, resize, crop, rotate, flip, convert, watermark }
}
