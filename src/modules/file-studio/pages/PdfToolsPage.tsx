import { useCallback, useEffect, useState, memo } from 'react'
import { FileText } from 'lucide-react'
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
import { PdfOperations } from '../components/pdf-tools/PdfOperations'
import { useFileUpload } from '../hooks/useFileUpload'
import { usePdfTools } from '../hooks/usePdfTools'
import { useFileDownload } from '../hooks/useFileDownload'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import { setActiveTool, clearError, resetAll } from '../store/fileStudioSlice'
import { UploadStatus, PDF_MIME_TYPES, FILE_SIZE_LIMITS } from '../dto/common'
import { PdfOperation } from '../dto/pdf.dto'
import { Button } from '@components/Button'
import { motion } from 'framer-motion'

export const PdfToolsPage = memo(function PdfToolsPage() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(setActiveTool('pdf-tools'))
    return () => { dispatch(resetAll()) }
  }, [dispatch])

  const { uploadStatus, result, errorMessage, errorCode } = useAppSelector((s) => s.fileStudio)

  const { currentFile, fileDetails, handleFile, clearFile, createPreviewUrl } = useFileUpload({
    allowedMimeTypes: [...PDF_MIME_TYPES],
    maxSizeBytes: FILE_SIZE_LIMITS.pdf,
  })

  const [multipleFiles, setMultipleFiles] = useState<File[]>([])

  const fileForTools: File | null = currentFile || (multipleFiles.length > 0 ? multipleFiles[0] : null)
  const pdfTools = usePdfTools(fileForTools, createPreviewUrl)
  const { downloadBlob } = useFileDownload()

  const handleOperation = useCallback(
    (operation: PdfOperation, options: unknown) => {
      if (!fileForTools) return
      switch (operation) {
        case PdfOperation.Split:
          pdfTools.split.mutate(options as Parameters<typeof pdfTools.split.mutate>[0])
          break
        case PdfOperation.ExtractPages:
          pdfTools.extractPages.mutate(options as Parameters<typeof pdfTools.extractPages.mutate>[0])
          break
        case PdfOperation.DeletePages:
          pdfTools.deletePages.mutate(options as Parameters<typeof pdfTools.deletePages.mutate>[0])
          break
        case PdfOperation.RotatePages:
          pdfTools.rotatePages.mutate(options as Parameters<typeof pdfTools.rotatePages.mutate>[0])
          break
        case PdfOperation.ReorderPages:
          pdfTools.reorderPages.mutate(options as Parameters<typeof pdfTools.reorderPages.mutate>[0])
          break
        case PdfOperation.ExtractText:
          pdfTools.extractText.mutate(options as Parameters<typeof pdfTools.extractText.mutate>[0])
          break
        case PdfOperation.Compress:
          pdfTools.compress.mutate(options as Parameters<typeof pdfTools.compress.mutate>[0])
          break
      }
    },
    [fileForTools, pdfTools],
  )

  const handleMerge = useCallback(() => {
    if (multipleFiles.length < 2) return
    pdfTools.merge.mutate({ files: multipleFiles })
  }, [multipleFiles, pdfTools])

  const handleDownload = useCallback(async () => {
    if (result.blob && result.filename) {
      await downloadBlob(result.blob, result.filename)
    }
  }, [result.blob, result.filename, downloadBlob])

  const handleRetry = useCallback(() => {
    dispatch(clearError())
  }, [dispatch])

  const handleFiles = useCallback(
    (files: File[]) => {
      dispatch(clearError())
      files.forEach((f) => {
        handleFile(f)
      })
      setMultipleFiles((prev) => [...prev, ...files])
    },
    [handleFile, dispatch],
  )

  const handleSingleFile = useCallback(
    (file: File) => {
      clearFile()
      dispatch(clearError())
      handleFile(file)
      setMultipleFiles([file])
    },
    [clearFile, handleFile, dispatch],
  )

  const handleClear = useCallback(() => {
    clearFile()
    setMultipleFiles([])
  }, [clearFile])

  const isProcessing = uploadStatus === UploadStatus.Processing || uploadStatus === UploadStatus.Uploading
  const hasResult = result.blob && result.previewUrl

  return (
    <ToolLayout
      title="PDF Tools"
      subtitle="Merge, split, extract, rotate, and compress PDF documents"
      icon={<FileText size={20} className="text-brand-400" />}
      actions={
        currentFile && (
          <Button size="xs" variant="ghost" onClick={handleClear}>
            Clear
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
        onFile={handleSingleFile}
        accept=".pdf"
        currentFile={currentFile}
        onClear={handleClear}
        multiple
        onFiles={handleFiles}
      />

      {multipleFiles.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-surface-700/50 bg-surface-800/30 p-3"
        >
          <p className="text-xs text-surface-400 mb-2">
            {multipleFiles.length} files loaded. Use Merge to combine them.
          </p>
          <div className="space-y-1">
            {multipleFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-surface-300">
                <span className="w-5 h-5 rounded bg-surface-700/50 flex items-center justify-center text-[10px] font-mono">
                  {i + 1}
                </span>
                {f.name}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <ErrorState
        message={errorMessage}
        code={errorCode}
        onRetry={handleRetry}
        onClear={() => dispatch(clearError())}
      />

      {isProcessing && <ProcessingOverlay status={uploadStatus} />}

      {hasResult && (
        <ZoomControls>
          <FilePreview
            previewUrl={result.previewUrl}
            mimeType={result.mimeType || ''}
            filename={result.filename || 'result.pdf'}
            onDownload={handleDownload}
          />
        </ZoomControls>
      )}

      {fileForTools && !isProcessing && !hasResult && (
        <EmptyState
          title="Ready to process"
          description="Select an operation below to process this PDF"
        />
      )}

      {fileForTools && !isProcessing && (
        <PdfOperations
          onOperation={handleOperation}
          disabled={isProcessing}
          hasMultipleFiles={multipleFiles.length > 1}
          onMergeFiles={handleMerge}
        />
      )}
    </ToolLayout>
  )
})
