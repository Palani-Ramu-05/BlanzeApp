import { useCallback, useState } from 'react'

export function useFileDownload() {
  const [isDownloading, setIsDownloading] = useState(false)

  const downloadBlob = useCallback(
    (blob: Blob, filename: string): Promise<void> => {
      setIsDownloading(true)
      return new Promise((resolve, reject) => {
        try {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          setTimeout(() => URL.revokeObjectURL(url), 10000)
          setIsDownloading(false)
          resolve()
        } catch (err) {
          setIsDownloading(false)
          reject(err)
        }
      })
    },
    [],
  )

  const downloadFromUrl = useCallback(
    async (url: string, filename: string) => {
      setIsDownloading(true)
      try {
        const response = await fetch(url)
        const blob = await response.blob()
        await downloadBlob(blob, filename)
      } finally {
        setIsDownloading(false)
      }
    },
    [downloadBlob],
  )

  return { downloadBlob, downloadFromUrl, isDownloading }
}
