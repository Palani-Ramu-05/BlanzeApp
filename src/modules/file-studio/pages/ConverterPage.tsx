import { useCallback, useEffect, memo } from 'react'
import { Shuffle } from 'lucide-react'
import { ToolLayout } from '../components/ui/ToolLayout'
import { FileDropzone } from '../components/ui/FileDropzone'
import { FilePreview } from '../components/ui/FilePreview'
import { FileDetails } from '../components/ui/FileDetails'
import { FileInspector } from '../components/ui/FileInspector'
import { ZoomControls } from '../components/ui/ZoomControls'
import { ProcessingOverlay } from '../components/ui/ProcessingOverlay'
import { ErrorState } from '../components/ui/ErrorState'
import { ConverterSettings } from '../components/converter/ConverterSettings'
import { useFileUpload } from '../hooks/useFileUpload'
import { useConverter } from '../hooks/useConverter'
import { useFileDownload } from '../hooks/useFileDownload'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { setActiveTool, clearError, resetAll } from '../store/fileStudioSlice'
import { UploadStatus, FILE_SIZE_LIMITS } from '../dto/common'
import type { ConversionType } from '../dto/converter.dto'

export const ConverterPage = memo(function ConverterPage() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(setActiveTool('converter'))
    return () => { dispatch(resetAll()) }
  }, [dispatch])

  const { uploadStatus, result, errorMessage, errorCode } = useAppSelector((s) => s.fileStudio)

  const { currentFile, fileDetails, handleFile, clearFile, createPreviewUrl } = useFileUpload({
    maxSizeBytes: FILE_SIZE_LIMITS.converter,
  })

  const converter = useConverter(currentFile, createPreviewUrl, fileDetails?.name)
  const { downloadBlob } = useFileDownload()

  const handleConvert = useCallback(
    (conversionType: ConversionType) => {
      if (!currentFile) return
      converter.convert.mutate({ conversionType })
    },
    [currentFile, converter],
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
      title="Format Converter"
      subtitle="Convert between images and data formats"
      icon={<Shuffle size={20} className="text-brand-400" />}
      sidebar={
        <>
          {fileDetails && <FileDetails details={fileDetails} />}
          {currentFile && <FileInspector file={currentFile} />}
        </>
      }
    >
      <FileDropzone
        onFile={(file) => handleFile(file)}
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
            filename={result.filename || 'converted'}
            onDownload={handleDownload}
          />
        </ZoomControls>
      )}

      {currentFile && !isProcessing && (
        <ConverterSettings
          onConvert={handleConvert}
          disabled={isProcessing}
          fileMimeType={fileDetails?.mimeType}
        />
      )}
    </ToolLayout>
  )
})
