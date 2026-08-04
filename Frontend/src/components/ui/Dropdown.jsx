import { createContext, useContext, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useEscapeKey } from '@/hooks/useEscapeKey'

const DropdownContext = createContext(null)

/**
 * Dropdown menu — compose with Trigger, Content, Item, Label, Separator.
 */
export function DropdownMenu({ children, align = 'start', className }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useClickOutside(ref, () => setOpen(false), open)
  useEscapeKey(() => setOpen(false), open)

  const close = () => setOpen(false)

  return (
    <DropdownContext.Provider value={{ open, setOpen, close, align }}>
      <div ref={ref} className={cn('relative inline-flex', className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

export function DropdownMenuTrigger({ children, className, ...props }) {
  const { open, setOpen } = useContext(DropdownContext)
  const content = (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => setOpen((value) => !value)}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
  return content
}

export function DropdownMenuContent({ children, className, align = null, width = 'w-56' }) {
  const { open, align: ctxAlign } = useContext(DropdownContext)
  const resolvedAlign = align ?? ctxAlign

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="menu"
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -4 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'absolute top-full z-dropdown mt-2 rounded-xl border border-border/70 bg-surface p-1.5 shadow-pop',
            width,
            resolvedAlign === 'end' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export function DropdownMenuItem({ icon: Icon, label, shortcut, danger = false, disabled = false, onSelect, children, className }) {
  const { close } = useContext(DropdownContext)

  const handleSelect = () => {
    if (disabled) return
    close()
    onSelect?.()
  }

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={handleSelect}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors',
        danger ? 'text-danger hover:bg-danger/10' : 'text-foreground-soft hover:bg-accent hover:text-foreground',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      {Icon ? <Icon className="size-4 shrink-0 text-muted" /> : null}
      <span className="flex-1 truncate">{label ?? children}</span>
      {shortcut ? <kbd className="rounded border border-border bg-background-soft px-1.5 py-0.5 text-[10px] font-semibold text-muted">{shortcut}</kbd> : null}
    </button>
  )
}

export function DropdownMenuLabel({ children, className }) {
  return (
    <div className={cn('px-2.5 pb-1.5 pt-2 text-xs font-semibold uppercase tracking-wide text-muted', className)}>
      {children}
    </div>
  )
}

export function DropdownMenuSeparator({ className }) {
  return <div className={cn('my-1.5 h-px bg-border', className)} role="separator" />
}

export function DropdownMenuGroup({ children, className }) {
  return <div className={cn('flex flex-col', className)}>{children}</div>
}

export default DropdownMenu
