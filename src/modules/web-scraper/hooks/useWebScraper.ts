import { useCallback, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@core/hooks/useStore'
import {
  startScraping, setQueueItemStatus, setCurrentURLIndex, addResponse, finishScraping, clearResults,
} from '../store/webscraperSlice'
import { apiScrape, exportJSON, exportCSV, exportTXT, exportHTML, exportMarkdown, downloadFile } from '../services/webscraper.service'
import type { URLQueueItem } from '../dto/types/webscraper.types'

export function useWebScraper() {
  const dispatch = useAppDispatch()
  const state = useAppSelector(s => s.webScraper)
  const stopRef = useRef(false)

  const start = useCallback(async () => {
    stopRef.current = false

    const urls = state.activeTab === 'single'
      ? [state.singleURL.trim()]
      : state.bulkURLEntries.filter(Boolean)

    const queue: URLQueueItem[] = urls.map(url => ({ url, status: 'pending' }))
    dispatch(startScraping({ queue }))

    for (let i = 0; i < queue.length; i++) {
      if (stopRef.current) break

      dispatch(setQueueItemStatus({ index: i, status: 'running' }))
      dispatch(setCurrentURLIndex(i))

      try {
        const response = await apiScrape({
          url: queue[i].url,
          scrapeMode: state.scrapeMode,
          extractionOptions: state.extractionOptions,
        })
        dispatch(addResponse(response))
        dispatch(setQueueItemStatus({ index: i, status: 'completed' }))
      } catch (err) {
        dispatch(setQueueItemStatus({
          index: i,
          status: 'failed',
          error: (err as Error).message || 'Unknown error',
        }))
      }
    }

    dispatch(finishScraping())
  }, [dispatch, state.activeTab, state.singleURL, state.bulkURLEntries, state.scrapeMode, state.extractionOptions])

  const stop = useCallback(() => {
    stopRef.current = true
    dispatch(finishScraping())
  }, [dispatch])

  const clear = useCallback(() => {
    stopRef.current = true
    dispatch(clearResults())
  }, [dispatch])

  const exportAs = useCallback((format: 'json' | 'csv' | 'txt' | 'html' | 'md') => {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const name = `scrape-${ts}`
    switch (format) {
      case 'json': downloadFile(exportJSON(state.responses), `${name}.json`, 'application/json'); break
      case 'csv':  downloadFile(exportCSV(state.responses),  `${name}.csv`,  'text/csv'); break
      case 'txt':  downloadFile(exportTXT(state.responses),  `${name}.txt`,  'text/plain'); break
      case 'html': downloadFile(exportHTML(state.responses),  `${name}.html`, 'text/html'); break
      case 'md':   downloadFile(exportMarkdown(state.responses), `${name}.md`, 'text/markdown'); break
    }
  }, [state.responses])

  return { start, stop, clear, exportAs }
}
