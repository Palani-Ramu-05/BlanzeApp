import { supabase } from '@core/config/supabaseClient'
import { generateId } from '@utils/index'
import type { VaultFile } from '../dto/types/vaultdrop.types'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, BUCKET_NAME } from '../dto/types/vaultdrop.types'

export interface ValidationError {
  valid: false
  message: string
}
export interface ValidationOk {
  valid: true
}
export type ValidationResult = ValidationError | ValidationOk

// ── Validation ──────────────────────────────────────────────

export const validateFile = (file: File): ValidationResult => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `"${file.name}" exceeds the 30 MB limit (${(file.size / 1024 / 1024).toFixed(2)} MB).`,
    }
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: `"${file.name}" has an unsupported file type. Allowed: images, GIFs, TXT, JSON, PDF, ZIP.`,
    }
  }
  return { valid: true }
}

// ── Storage path helper ─────────────────────────────────────

const buildStoragePath = (userId: string, file: File): string => {
  const ts = Date.now()
  const uid = generateId()
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${userId}/${ts}_${uid}_${sanitized}`
}

// ── Upload ──────────────────────────────────────────────────

export const uploadFile = async (
  file: File,
  userId: string,
  onProgress?: (pct: number) => void,
): Promise<VaultFile> => {
  const storagePath = buildStoragePath(userId, file)

  // Supabase JS v2 does not expose XHR progress; simulate with a timer tick
  let ticker: ReturnType<typeof setInterval> | null = null
  let simPct = 0
  if (onProgress) {
    ticker = setInterval(() => {
      simPct = Math.min(simPct + 10, 90)
      onProgress(simPct)
    }, 120)
  }

  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (ticker) clearInterval(ticker)
  if (onProgress) onProgress(100)

  if (storageError) throw new Error(storageError.message)

  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath)

  const { data: meta, error: dbError } = await supabase
    .from('vaultdrop_files')
    .insert({
      user_id: userId,
      file_name: file.name,
      file_size: file.size,
      file_url: urlData.publicUrl,
      storage_path: storagePath,
      mime_type: file.type,
    })
    .select()
    .single()

  if (dbError) {
    // Rollback storage
    await supabase.storage.from(BUCKET_NAME).remove([storagePath])
    throw new Error(dbError.message)
  }

  return meta as VaultFile
}

// ── Fetch list ──────────────────────────────────────────────

export const fetchFiles = async (userId: string): Promise<VaultFile[]> => {
  const { data, error } = await supabase
    .from('vaultdrop_files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []) as VaultFile[]
}

// ── Delete ──────────────────────────────────────────────────

export const deleteFile = async (file: VaultFile): Promise<void> => {
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([file.storage_path])

  if (storageError) throw new Error(storageError.message)

  const { error: dbError } = await supabase
    .from('vaultdrop_files')
    .delete()
    .eq('id', file.id)

  if (dbError) throw new Error(dbError.message)
}

// ── Download ────────────────────────────────────────────────

export const downloadFile = async (file: VaultFile): Promise<void> => {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(file.storage_path)

  if (error) throw new Error(error.message)

  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = file.file_name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
