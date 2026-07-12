import { useCallback, useEffect, memo } from 'react'
import { FileArchive } from 'lucide-react'
import { ToolLayout } from '../components/ui/ToolLayout'
import { FileDropzone } from '../components/ui/FileDropzone'
import { FilePreview } from '../components/ui/FilePreview'
import { FileDetails } from '../components/ui/FileDetails'
import { FileInspector } from '../components/ui/FileInspector'
import { SplitPreview } from '../components/ui/SplitPreview'
import { ZoomControls } from '../components/ui/ZoomControls'
import { ProcessingOverlay } from '../components/ui/ProcessingOverlay'
import { ErrorState } from '../components/ui/ErrorState'
import { CompressionSettings } from '../components/compression/CompressionSettings'
import { useFileUpload } from '../hooks/useFileUpload'
import { useCompression } from '../hooks/useCompression'
import { useFileDownload } from '../hooks/useFileDownload'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { setActiveTool, clearError, resetAll } from '../store/fileStudioSlice'
import { UploadStatus, COMPRESSIBLE_MIME_TYPES, FILE_SIZE_LIMITS } from '../dto/common'
import { CompressionLevel } from '../dto/compression.dto'

export const CompressionPage = memo(function CompressionPage() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(setActiveTool('compression'))
    return () => { dispatch(resetAll()) }
  }, [dispatch])

  const { uploadStatus, result, errorMessage, errorCode } = useAppSelector((s) => s.fileStudio)

  const { currentFile, fileDetails, handleFile, clearFile, createPreviewUrl } = useFileUpload({
    allowedMimeTypes: [...COMPRESSIBLE_MIME_TYPES],
    maxSizeBytes: FILE_SIZE_LIMITS.compression,
  })

  const compression = useCompression(currentFile, createPreviewUrl, fileDetails?.name)
  const { downloadBlob } = useFileDownload()

  const handleCompress = useCallback(
    (level: CompressionLevel) => {
      if (!currentFile) return
      compression.compress.mutate({
        level,
        keepMetadata: true,
      })
    },
    [currentFile, compression],
  )

  const handleDownload = useCallback(async () => {
    if (result.blob && result.filename) {
      await downloadBlob(result.blob, result.filename)
    }
  }, [result.blob, result.filename, downloadBlob])

  const isProcessing = uploadStatus === UploadStatus.Processing || uploadStatus === UploadStatus.Uploading
  const hasResult = result.blob && result.previewUrl

  return (
    <ToolLayout
      title="Compression"
      subtitle="Reduce file size while maintaining quality"
      icon={<FileArchive size={20} className="text-brand-400" />}
      sidebar={
        <>
          {fileDetails && <FileDetails details={fileDetails} />}
          {currentFile && <FileInspector file={currentFile} />}
        </>
      }
    >
      <FileDropzone
        onFile={(file) => handleFile(file)}
        accept=".png,.jpg,.jpeg,.webp,.pdf"
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

      {hasResult && (
        <ZoomControls>
          <FilePreview
            previewUrl={result.previewUrl}
            mimeType={result.mimeType || ''}
            filename={result.filename || 'compressed'}
            onDownload={handleDownload}
          />
        </ZoomControls>
      )}

      {currentFile && !isProcessing && (
        <CompressionSettings
          onCompress={handleCompress}
          disabled={isProcessing}
          fileSize={fileDetails?.size}
        />
      )}
    </ToolLayout>
  )
})
