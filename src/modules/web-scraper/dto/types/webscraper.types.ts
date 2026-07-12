export type ActiveTab = 'single' | 'bulk'
export type ScrapeMode = 'single' | 'entireWebsite'
export type URLQueueStatus = 'pending' | 'running' | 'completed' | 'failed'

export type ExtractionOption =
  | 'emails' | 'phoneNumbers' | 'images'
  | 'internalLinks' | 'externalLinks'
  | 'documentTitle' | 'metaTitle' | 'metaDescription' | 'metaKeywords'
  | 'headings' | 'paragraphs'
  | 'language' | 'wordCount' | 'imageCount' | 'linkCount'
  | 'favicon' | 'canonical' | 'robots' | 'openGraph' | 'twitterCards'
  | 'schemaMarkup' | 'scripts' | 'stylesheets'
  | 'forms' | 'tables' | 'buttons' | 'lists' | 'anchors'
  | 'html' | 'plainText'

export type ExtractionOptionsMap = Record<ExtractionOption, boolean>

export const ALL_EXTRACTION_OPTIONS: ExtractionOption[] = [
  'emails', 'phoneNumbers', 'images',
  'internalLinks', 'externalLinks',
  'documentTitle', 'metaTitle', 'metaDescription', 'metaKeywords',
  'headings', 'paragraphs',
  'language', 'wordCount', 'imageCount', 'linkCount',
  'favicon', 'canonical', 'robots', 'openGraph', 'twitterCards',
  'schemaMarkup', 'scripts', 'stylesheets',
  'forms', 'tables', 'buttons', 'lists', 'anchors',
  'html', 'plainText',
]

export function buildDefaultOptions(): ExtractionOptionsMap {
  const opts = {} as ExtractionOptionsMap
  for (const key of ALL_EXTRACTION_OPTIONS) opts[key] = true
  return opts
}

export interface ExtractionOptionDef {
  id: ExtractionOption
  label: string
  group: 'contact' | 'media' | 'links' | 'meta' | 'content' | 'code' | 'stats'
}

export const EXTRACTION_OPTION_DEFS: ExtractionOptionDef[] = [
  { id: 'emails', label: 'Emails', group: 'contact' },
  { id: 'phoneNumbers', label: 'Phone Numbers', group: 'contact' },
  { id: 'images', label: 'Images', group: 'media' },
  { id: 'internalLinks', label: 'Internal Links', group: 'links' },
  { id: 'externalLinks', label: 'External Links', group: 'links' },
  { id: 'documentTitle', label: 'Document Title', group: 'meta' },
  { id: 'metaTitle', label: 'Meta Title', group: 'meta' },
  { id: 'metaDescription', label: 'Meta Description', group: 'meta' },
  { id: 'metaKeywords', label: 'Meta Keywords', group: 'meta' },
  { id: 'favicon', label: 'Favicon', group: 'meta' },
  { id: 'canonical', label: 'Canonical URL', group: 'meta' },
  { id: 'robots', label: 'Robots', group: 'meta' },
  { id: 'openGraph', label: 'Open Graph', group: 'meta' },
  { id: 'twitterCards', label: 'Twitter Cards', group: 'meta' },
  { id: 'headings', label: 'Headings', group: 'content' },
  { id: 'paragraphs', label: 'Paragraphs', group: 'content' },
  { id: 'lists', label: 'Lists', group: 'content' },
  { id: 'forms', label: 'Forms', group: 'content' },
  { id: 'tables', label: 'Tables', group: 'content' },
  { id: 'buttons', label: 'Buttons', group: 'content' },
  { id: 'anchors', label: 'Anchors', group: 'content' },
  { id: 'scripts', label: 'Scripts', group: 'code' },
  { id: 'stylesheets', label: 'Stylesheets', group: 'code' },
  { id: 'schemaMarkup', label: 'Schema Markup', group: 'code' },
  { id: 'html', label: 'HTML', group: 'code' },
  { id: 'plainText', label: 'Plain Text', group: 'code' },
  { id: 'language', label: 'Language', group: 'stats' },
  { id: 'wordCount', label: 'Word Count', group: 'stats' },
  { id: 'imageCount', label: 'Image Count', group: 'stats' },
  { id: 'linkCount', label: 'Link Count', group: 'stats' },
]

export const GROUP_LABELS: Record<string, string> = {
  contact: 'Contact',
  media: 'Media',
  links: 'Links',
  meta: 'Meta & SEO',
  content: 'Content',
  code: 'Code',
  stats: 'Statistics',
}

export const GROUP_ORDER: string[] = ['contact', 'media', 'links', 'meta', 'content', 'code', 'stats']

// ── Queue item ──────────────────────────────────────────
export interface URLQueueItem {
  url: string
  status: URLQueueStatus
  error?: string
}

// ── API request payload ────────────────────────────────
export interface ScrapePayload {
  url: string
  scrapeMode: string
  extractionOptions: Record<string, boolean>
}

// ── API response types (matching backend exactly) ──────
export interface PageImage {
  src: string
  alt: string
  title: string
  width: number
  height: number
  isLazyLoaded: boolean
}

export interface PageLink {
  href: string
  text: string
}

export interface PageHeadings {
  h1: string[]
  h2: string[]
  h3: string[]
  h4: string[]
  h5: string[]
  h6: string[]
}

export interface PageMeta {
  description: string
  title: string
}

export interface PageStatistics {
  wordCount: number
  imageCount: number
  linkCount: number
}

export interface FormInput {
  name: string
  type: string
  placeholder: string
}

export interface PageForm {
  action: string
  method: string
  inputs: FormInput[]
}

export interface PageAnchor {
  text: string
  href: string
}

export interface ScrapedPage {
  url: string
  title: string
  language: string
  emails: string[]
  phoneNumbers: string[]
  images: PageImage[]
  internalLinks: PageLink[]
  externalLinks: PageLink[]
  headings: PageHeadings
  paragraphs: string[]
  meta: PageMeta
  statistics: PageStatistics
  favicon: string
  canonical: string
  robots: string
  openGraph: Record<string, string>
  twitterCards: Record<string, string>
  schemaMarkup: unknown[]
  scripts: string[]
  stylesheets: string[]
  forms: PageForm[]
  tables: unknown[]
  buttons: string[]
  lists: string[][]
  anchors: PageAnchor[]
  html: string
  plainText: string
  wordCount: number
  imageCount: number
  linkCount: number
}

export interface ScraperSummary {
  pagesScraped: number
  totalEmails: number
  totalPhoneNumbers: number
  totalImages: number
  totalInternalLinks: number
  totalExternalLinks: number
  totalWordCount: number
  durationMs?: number
}

export interface ScraperResponseData {
  url: string
  scrapeMode: string
  summary: ScraperSummary
  pages: ScrapedPage[]
}

export interface ScraperApiResponse {
  error: boolean
  status: number
  message: string
  data: ScraperResponseData
}

// ── Redux state ────────────────────────────────────────
export interface WebScraperState {
  activeTab: ActiveTab
  singleURL: string
  bulkURLEntries: string[]
  scrapeMode: ScrapeMode
  extractionOptions: ExtractionOptionsMap
  isRunning: boolean
  queue: URLQueueItem[]
  currentURLIndex: number
  responses: ScraperApiResponse[]
  startTime: number | null
  expandedResultIds: string[]
  searchQuery: string
}

export const URL_STATUS_CONFIG: Record<URLQueueStatus, { label: string; color: string; bgColor: string; dotColor: string }> = {
  pending:   { label: 'Pending',   color: 'text-surface-400', bgColor: 'bg-surface-800',   dotColor: 'bg-surface-500' },
  running:   { label: 'Running',   color: 'text-blue-400',   bgColor: 'bg-blue-500/10',   dotColor: 'bg-blue-400' },
  completed: { label: 'Completed', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', dotColor: 'bg-emerald-400' },
  failed:    { label: 'Failed',    color: 'text-red-400',     bgColor: 'bg-red-500/10',    dotColor: 'bg-red-400' },
}
