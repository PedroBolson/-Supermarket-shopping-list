import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className={cn(
              'relative z-10 w-full rounded-[28px] border border-border/60 bg-card/95 p-8 shadow-[var(--shadow-lg)] backdrop-blur-xl dark:border-border/40 dark:bg-surface/90',
              sizeClasses[size],
            )}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          >
            <button
              type="button"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-card text-muted transition hover:text-primary-500"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-6">
              {(title || description) && (
                <header className="space-y-2 pr-10">
                  {title ? <h2 className="text-2xl font-semibold text-foreground">{title}</h2> : null}
                  {description ? <p className="text-sm text-muted">{description}</p> : null}
                </header>
              )}

              <div className="space-y-4">{children}</div>

              {footer ? <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">{footer}</div> : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
