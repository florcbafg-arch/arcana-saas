'use client'

import { AnimatePresence, motion } from 'framer-motion'

type FloatingToastProps = {
  toast: {
    type: 'success' | 'error' | 'warning'
    message: string
  } | null
  onClose?: () => void
}

export default function FloatingToast({
  toast,
  onClose,
}: FloatingToastProps) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          className="fixed left-4 right-4 top-4 z-[9999] md:left-auto md:right-6 md:top-6 md:w-[380px]"
        >
          <div
            className={`rounded-2xl border px-4 py-4 shadow-2xl backdrop-blur-xl ${
              toast.type === 'success'
                ? 'border-green-500/30 bg-green-950/90 text-green-300'
                : toast.type === 'warning'
                ? 'border-yellow-500/30 bg-yellow-950/90 text-yellow-300'
                : 'border-red-500/30 bg-red-950/90 text-red-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold leading-relaxed">
                {toast.message}
              </p>

              {onClose && (
                <button
                  onClick={onClose}
                  className="text-white/50 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}