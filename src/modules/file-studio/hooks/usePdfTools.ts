import { useMutation } from '@tanstack/react-query'
import { pdfService } from '../services/pdf.service'
import { useAppDispatch } from '@core/hooks/useStore'
import { setResult, setError, setUploadStatus } from '../store/fileStudioSlice'
import { UploadStatus } from '../dto/common'
import type {
  PdfMergeOptions,
  PdfSplitOptions,
  PdfExtractPagesOptions,
  PdfDeletePagesOptions,
  PdfRotatePagesOptions,
  PdfReorderPagesOptions,
  PdfExtractTextOptions,
  PdfCompressOptions,
} from '../dto/pdf.dto'
import toast from 'react-hot-toast'

export function usePdfTools(
  files: File | File[] | null,
  createPreviewUrl: (blob: Blob) => string,
) {
  const dispatch = useAppDispatch()

  const handleSuccess = (operation: string) => (response: { data: Blob }) => {
    const blob = response.data
    const previewUrl = createPreviewUrl(blob)
    dispatch(
      setResult({
        blob,
        filename: `result-${operation}.pdf`,
        mimeType: 'application/pdf',
        previewUrl,
      }),
    )
    dispatch(setUploadStatus(UploadStatus.Complete))
    toast.success(`${operation} completed`)
  }

  const handleError = (err: Error) => {
    dispatch(setError({ code: 'PROCESSING_ERROR', message: err.message }))
    dispatch(setUploadStatus(UploadStatus.Error))
    toast.error(`Failed: ${err.message}`)
  }

  const merge = useMutation({
    mutationFn: (options: PdfMergeOptions) => pdfService.merge(options.files, options),
    onSuccess: handleSuccess('merge'),
    onError: handleError,
  })

  const split = useMutation({
    mutationFn: (options: PdfSplitOptions) => pdfService.split(files as File, options),
    onSuccess: handleSuccess('split'),
    onError: handleError,
  })

  const extractPages = useMutation({
    mutationFn: (options: PdfExtractPagesOptions) => pdfService.extractPages(files as File, options),
    onSuccess: handleSuccess('extract-pages'),
    onError: handleError,
  })

  const deletePages = useMutation({
    mutationFn: (options: PdfDeletePagesOptions) => pdfService.deletePages(files as File, options),
    onSuccess: handleSuccess('delete-pages'),
    onError: handleError,
  })

  const rotatePages = useMutation({
    mutationFn: (options: PdfRotatePagesOptions) => pdfService.rotatePages(files as File, options),
    onSuccess: handleSuccess('rotate-pages'),
    onError: handleError,
  })

  const reorderPages = useMutation({
    mutationFn: (options: PdfReorderPagesOptions) => pdfService.reorderPages(files as File, options),
    onSuccess: handleSuccess('reorder-pages'),
    onError: handleError,
  })

  const extractText = useMutation({
    mutationFn: (options: PdfExtractTextOptions) => pdfService.extractText(files as File, options),
    onSuccess: (response: { data: string }) => {
      const blob = new Blob([response.data], { type: 'text/plain' })
      const previewUrl = createPreviewUrl(blob)
      dispatch(
        setResult({
          blob,
          filename: 'extracted-text.txt',
          mimeType: 'text/plain',
          previewUrl,
        }),
      )
      dispatch(setUploadStatus(UploadStatus.Complete))
      toast.success('Text extracted')
    },
    onError: handleError,
  })

  const compress = useMutation({
    mutationFn: (options: PdfCompressOptions) => pdfService.compress(files as File, options),
    onSuccess: handleSuccess('compress'),
    onError: handleError,
  })

  return { merge, split, extractPages, deletePages, rotatePages, reorderPages, extractText, compress }
}
