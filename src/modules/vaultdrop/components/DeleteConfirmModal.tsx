import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { Button } from '@components/index'
import { getFileIcon } from './FileIconHelper'
import { formatBytes } from '@utils/index'
import type { VaultFile } from '../dto/types/vaultdrop.types'

interface DeleteConfirmModalProps {
  file: VaultFile | null
  open: boolean
  deleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const DeleteConfirmModal = ({
  file,
  open,
  deleting,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) => {
  return (
    <AnimatePresence>
      {open && file && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onCancel}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="bg-surface-900 border border-surface-700/60 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start justify-between p-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={18} className="text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Delete File</h3>
                    <p className="text-xs text-surface-400 mt-0.5">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={onCancel}
                  className="text-surface-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-surface-800"
                >
                  <X size={16} />
                </button>
              </div>

              {/* File info */}
              <div className="mx-5 mb-4 flex items-center gap-3 p-3 rounded-xl bg-surface-800/60 border border-surface-700/40">
                <div className="w-9 h-9 rounded-lg bg-surface-700/60 flex items-center justify-center flex-shrink-0">
                  {getFileIcon(file.mime_type, 18)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{file.file_name}</p>
                  <p className="text-xs text-surface-400">{formatBytes(file.file_size)}</p>
                </div>
              </div>

              <p className="px-5 pb-5 text-sm text-surface-300">
                Are you sure you want to permanently delete{' '}
                <span className="text-white font-semibold">"{file.file_name}"</span>? The file
                will be removed from storage and cannot be recovered.
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2.5 px-5 pb-5">
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={onCancel}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  loading={deleting}
                  icon={!deleting ? <Trash2 size={15} /> : undefined}
                  onClick={onConfirm}
                >
                  {deleting ? 'Deleting…' : 'Delete File'}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
