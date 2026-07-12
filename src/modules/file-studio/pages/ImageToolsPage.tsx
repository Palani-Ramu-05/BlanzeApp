import { useCallback, useEffect, useMemo, memo } from 'react'
import { Image, RefreshCw } from 'lucide-react'
import { ToolLayout } from '../components/ui/ToolLayout'
import { FileDropzone } from '../components/ui/FileDropzone'
import { FilePreview } from '../components/ui/FilePreview'
import { FileDetails } from '../components/ui/FileDetails'
import { FileInspector } from '../components/ui/FileInspector'
import { SplitPreview } from '../components/ui/SplitPreview'
import { ZoomControls } from '../components/ui/ZoomControls'
import { ProcessingOverlay } from '../components/ui/ProcessingOverlay'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { ImageOperations } from '../components/image-tools/ImageOperations'
import { useFileUpload } from '../hooks/useFileUpload'
import { useImageTools } from '../hooks/useImageTools'
import { useFileDownload } from '../hooks/useFileDownload'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { setActiveTool, clearError, resetAll } from '../store/fileStudioSlice'
import { UploadStatus, IMAGE_MIME_TYPES, FILE_SIZE_LIMITS } from '../dto/common'
import { ImageOperation } from '../dto/image.dto'
import { Button } from '@components/Button'
import { motion } from 'framer-motion'

export const ImageToolsPage = memo(function ImageToolsPage() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(setActiveTool('image-tools'))
    return () => { dispatch(resetAll()) }
  }, [dispatch])

  const { uploadStatus, result, errorMessage, errorCode } = useAppSelector((s) => s.fileStudio)

  const { currentFile, fileDetails, handleFile, clearFile, createPreviewUrl } = useFileUpload({
    allowedMimeTypes: [...IMAGE_MIME_TYPES],
    maxSizeBytes: FILE_SIZE_LIMITS.image,
  })

  const imageTools = useImageTools(currentFile, createPreviewUrl, fileDetails)
  const { downloadBlob } = useFileDownload()

  const handleOperation = useCallback(
    (operation: ImageOperation, options: unknown) => {
      if (!currentFile) return
      switch (operation) {
        case ImageOperation.Compress:
          imageTools.compress.mutate(options as Parameters<typeof imageTools.compress.mutate>[0])
          break
        case ImageOperation.Resize:
          imageTools.resize.mutate(options as Parameters<typeof imageTools.resize.mutate>[0])
          break
        case ImageOperation.Crop:
          imageTools.crop.mutate(options as Parameters<typeof imageTools.crop.mutate>[0])
          break
        case ImageOperation.Rotate:
          imageTools.rotate.mutate(options as Parameters<typeof imageTools.rotate.mutate>[0])
          break
        case ImageOperation.Flip:
          imageTools.flip.mutate(options as Parameters<typeof imageTools.flip.mutate>[0])
          break
        case ImageOperation.Convert:
          imageTools.convert.mutate(options as Parameters<typeof imageTools.convert.mutate>[0])
          break
        case ImageOperation.Watermark:
          imageTools.watermark.mutate(options as Parameters<typeof imageTools.watermark.mutate>[0])
          break
      }
    },
    [currentFile, imageTools],
  )

  const handleDownload = useCallback(async () => {
    if (result.blob && result.filename) {
      await downloadBlob(result.blob, result.filename)
    }
  }, [result.blob, result.filename, downloadBlob])

  const handleReset = useCallback(() => {
    clearFile()
    dispatch(resetAll())
  }, [clearFile, dispatch])

  const isProcessing = uploadStatus === UploadStatus.Processing || uploadStatus === UploadStatus.Uploading
  const hasResult = result.blob && result.previewUrl

  const originalUrl = useMemo(() => {
    if (!currentFile) return null
    return URL.createObjectURL(currentFile)
  }, [currentFile])

  return (
    <ToolLayout
      title="Image Tools"
      subtitle="Compress, resize, crop, rotate, flip, watermark, convert"
      icon={<Image size={20} className="text-brand-400" />}
      actions={
        currentFile && (
          <Button size="xs" variant="ghost" icon={<RefreshCw size={12} />} onClick={handleReset}>
            Reset
          </Button>
        )
      }
      sidebar={
        <>
          {fileDetails && <FileDetails details={fileDetails} />}
          {currentFile && <FileInspector file={currentFile} />}
        </>
      }
    >
      <FileDropzone
        onFile={handleFile}
        accept=".png,.jpg,.jpeg,.webp,.avif"
        currentFile={currentFile}
        onClear={clearFile}
      />

      <ErrorState
        message={errorMessage}
        code={errorCode}
        onRetry={() => dispatch(clearError())}
        onClear={() => dispatch(clearError())}
      />

      {isProcessing && <ProcessingOverlay status={uploadStatus} />}

      {currentFile && originalUrl && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl overflow-hidden border border-surface-700/50 bg-surface-800/30"
        >
          <div className="px-4 py-2 border-b border-surface-700/30">
            <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">Original Image</p>
          </div>
          <div className="p-2">
            <img
              src={originalUrl}
              alt="Original"
              className="w-full max-h-[300px] object-contain rounded-lg"
            />
          </div>
        </motion.div>
      )}

      {hasResult && currentFile && originalUrl && result.previewUrl && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <ZoomControls>
            <SplitPreview
              beforeUrl={originalUrl}
              afterUrl={result.previewUrl}
              beforeLabel="Original"
              afterLabel="Result"
            />
          </ZoomControls>
          <FilePreview
            previewUrl={result.previewUrl}
            mimeType={result.mimeType || ''}
            filename={result.filename || 'result'}
            onDownload={handleDownload}
          />
        </motion.div>
      )}

      {currentFile && !isProcessing && (
        <ImageOperations
          onOperation={handleOperation}
          disabled={isProcessing}
          imageUrl={originalUrl}
          imageFile={currentFile}
          createPreviewUrl={createPreviewUrl}
          fileDetails={fileDetails}
        />
      )}
    </ToolLayout>
  )
})
