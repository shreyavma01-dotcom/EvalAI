import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { drawerPanel } from '@/components/animations/variants'

const sizeClasses = {
  left: { sm: 'w-72', md: 'w-80', lg: 'w-96', xl: 'w-[28rem]' },
  right: { sm: 'w-72', md: 'w-80', lg: 'w-96', xl: 'w-[28rem]' },
  bottom: { sm: 'h-64', md: 'h-80', lg: 'h-96', xl: 'h-[32rem]' },
}

/**
 * Slide-over drawer from left, right or bottom.
 */
export function Drawer({ open = false, onClose, side = 'right', size = 'md', title, description, children, footer, hideClose = false, className }) {
  useEscapeKey(onClose, open)
  useLockBodyScroll(open)

  useEffect(() => {
    if (!open) return undefined
    const id = window.setTimeout(() => {
      document.getElementById('drawer-heading')?.focus?.()
    }, 50)
    return () => window.clearTimeout(id)
  }, [open])

  const panelStyle = side === 'bottom' ? 'inset-x-0 bottom-0 rounded-t-3xl max-h-[85dvh]' : 'inset-y-0 max-w-[85dvw]'

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-drawer">
          <motion.div
            className="absolute inset-0 bg-overlay/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            id="drawer-heading"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={drawerPanel(side)}
            className={cn(
              'absolute flex flex-col bg-surface shadow-floating outline-none',
              side === 'left' && 'left-0',
              side === 'right' && 'right-0',
              side === 'bottom' && 'bottom-0',
              panelStyle,
              sizeClasses[side][size],
              className,
            )}
          >
            {title || !hideClose ? (
              <div className="flex items-start justify-between gap-4 border-b border-border/60 px-5 pb-4 pt-5">
                <div className="flex flex-col gap-1">
                  {title ? <h2 className="type-title text-foreground">{title}</h2> : null}
                  {description ? <p className="text-sm text-muted">{description}</p> : null}
                </div>
                {!hideClose ? (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close drawer"
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-background-soft hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer ? (
              <div className="flex items-center justify-end gap-3 border-t border-border/60 bg-background-soft/50 px-5 py-4">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

export default Drawer
