import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type {
  WebScraperState, ActiveTab, ScrapeMode, ExtractionOption,
  ExtractionOptionsMap, URLQueueItem, ScraperApiResponse,
} from '../dto/types/webscraper.types'
import { buildDefaultOptions } from '../dto/types/webscraper.types'

const initial: WebScraperState = {
  activeTab: 'single',
  singleURL: '',
  bulkURLEntries: [],
  scrapeMode: 'single',
  extractionOptions: buildDefaultOptions(),
  isRunning: false,
  queue: [],
  currentURLIndex: 0,
  responses: [],
  startTime: null,
  expandedResultIds: [],
  searchQuery: '',
}

const webscraperSlice = createSlice({
  name: 'webScraper',
  initialState: initial,
  reducers: {
    setActiveTab(state, action: PayloadAction<ActiveTab>) {
      state.activeTab = action.payload
    },
    setSingleURL(state, action: PayloadAction<string>) {
      state.singleURL = action.payload
    },

    setBulkURLEntries(state, action: PayloadAction<string[]>) {
      state.bulkURLEntries = action.payload
    },
    addBulkURLEntry(state, action: PayloadAction<string>) {
      if (state.bulkURLEntries.length < 5) {
        state.bulkURLEntries.push(action.payload)
      }
    },
    removeBulkURLEntry(state, action: PayloadAction<number>) {
      state.bulkURLEntries.splice(action.payload, 1)
    },
    clearBulkURLEntries(state) {
      state.bulkURLEntries = []
    },

    setScrapeMode(state, action: PayloadAction<ScrapeMode>) {
      state.scrapeMode = action.payload
    },

    setExtractionOption(state, action: PayloadAction<{ key: ExtractionOption; value: boolean }>) {
      state.extractionOptions[action.payload.key] = action.payload.value
    },
    toggleExtractionOption(state, action: PayloadAction<ExtractionOption>) {
      state.extractionOptions[action.payload] = !state.extractionOptions[action.payload]
    },
    setAllExtractionOptions(state, action: PayloadAction<ExtractionOptionsMap>) {
      state.extractionOptions = action.payload
    },

    // ── Scraping lifecycle ────────────────────────────────
    startScraping(state, action: PayloadAction<{ queue: URLQueueItem[] }>) {
      state.isRunning = true
      state.queue = action.payload.queue
      state.currentURLIndex = 0
      state.responses = []
      state.startTime = Date.now()
      state.expandedResultIds = []
      state.searchQuery = ''
    },
    setQueueItemStatus(state, action: PayloadAction<{ index: number; status: URLQueueItem['status']; error?: string }>) {
      const item = state.queue[action.payload.index]
      if (item) {
        item.status = action.payload.status
        if (action.payload.error) item.error = action.payload.error
      }
    },
    setCurrentURLIndex(state, action: PayloadAction<number>) {
      state.currentURLIndex = action.payload
    },
    addResponse(state, action: PayloadAction<ScraperApiResponse>) {
      state.responses.push(action.payload)
    },
    finishScraping(state) {
      state.isRunning = false
      state.startTime = null
      state.expandedResultIds = state.responses.map((_, i) => String(i))
    },
    clearResults(state) {
      state.responses = []
      state.queue = []
      state.currentURLIndex = 0
      state.isRunning = false
      state.startTime = null
      state.expandedResultIds = []
      state.searchQuery = ''
    },

    // ── UI ────────────────────────────────────────────────
    toggleExpandResult(state, action: PayloadAction<string>) {
      const idx = state.expandedResultIds.indexOf(action.payload)
      if (idx >= 0) state.expandedResultIds.splice(idx, 1)
      else state.expandedResultIds.push(action.payload)
    },
    expandAllResults(state) {
      state.expandedResultIds = state.responses.map((_, i) => String(i))
    },
    collapseAllResults(state) {
      state.expandedResultIds = []
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload
    },
  },
})

export const {
  setActiveTab, setSingleURL, setBulkURLEntries, addBulkURLEntry, removeBulkURLEntry, clearBulkURLEntries,
  setScrapeMode, setExtractionOption, toggleExtractionOption, setAllExtractionOptions,
  startScraping, setQueueItemStatus, setCurrentURLIndex, addResponse, finishScraping, clearResults,
  toggleExpandResult, expandAllResults, collapseAllResults, setSearchQuery,
} = webscraperSlice.actions

export default webscraperSlice.reducer
