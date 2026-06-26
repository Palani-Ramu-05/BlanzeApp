export interface VaultFile {
  id: string
  user_id: string
  file_name: string
  file_size: number
  file_url: string
  storage_path: string
  mime_type: string
  created_at: string
}

export interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

export type SortBy = 'name' | 'size' | 'date'
export type SortOrder = 'asc' | 'desc'

export interface VaultDropState {
  files: VaultFile[]
  loading: boolean
  uploading: boolean
  uploadProgress: UploadProgress[]
  error: string | null
  deleting: boolean
  selectedFileIds: string[]
  pendingDeletion: VaultFile[]
}

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'text/plain',
  'application/json',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
]

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.txt', '.json', '.pdf', '.zip']
export const MAX_FILE_SIZE = 30 * 1024 * 1024 // 30 MB
export const BUCKET_NAME = 'vaultdrop-storage'
