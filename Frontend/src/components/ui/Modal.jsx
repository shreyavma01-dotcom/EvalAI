import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { modalOverlay, modalPanel } from '@/components/animations/variants'

const sizes = cva('', {
  variants: {
    size: {
      xs: 'sm:max-w-xs',
      sm: 'sm:max-w-sm',
      md: 'sm:max-w-md',
      lg: 'sm:max-w-lg',
      xl: 'sm:max-w-xl',
      '2xl': 'sm:max-w-2xl',
      '3xl': 'sm:max-w-3xl',
      '4xl': 'sm:max-w-4xl',
    },
  },
  defaultVariants: { size: 'md' },
})

/**
 * Accessible modal with overlay, esc/overlay close and scroll lock.
 */
export function Modal({
  open = false,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  hideClose = false,
  closeOnOverlay = true,
  className,
  ...props
}) {
  const panelRef = useRef(null)

  useEscapeKey(onClose, open)
  useLockBodyScroll(open)

  useEffect(() => {
    if (open) panelRef.current?.focus?.()
  }, [open])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-modal flex items-center justify-center p-4"
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="presentation"
        >
          <motion.div
            className="absolute inset-0 bg-overlay/60 backdrop-blur-sm"
            onClick={closeOnOverlay ? onClose : undefined}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            variants={modalPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-floating outline-none',
              sizes({ size }),
              className,
            )}
            {...props}
          >
            {title || !hideClose ? (
              <div className="flex items-start justify-between gap-4 border-b border-border/60 px-6 pb-4 pt-5">
                <div className="flex flex-col gap-1">
                  {title ? (
                    <h2 id="modal-title" className="type-title text-foreground">
                      {title}
                    </h2>
                  ) : null}
                  {description ? <p className="text-sm text-muted">{description}</p> : null}
                </div>
                {!hideClose ? (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-background-soft hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer ? (
              <div className="flex items-center justify-end gap-3 border-t border-border/60 bg-background-soft/50 px-6 py-4">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

export default Modal
