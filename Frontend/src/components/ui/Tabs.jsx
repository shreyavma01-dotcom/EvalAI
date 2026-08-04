import { createContext, useContext, useEffect, useId, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

const TabsContext = createContext(null)

/**
 * Tabs with animated active indicator and keyboard navigation.
 */
export function Tabs({ defaultValue, value: controlledValue, onValueChange, variant = 'underline', children, className }) {
  const id = useId()
  const listRef = useRef(null)
  const [internal, setInternal] = useState(defaultValue)
  const value = controlledValue ?? internal

  const setValue = (next) => {
    if (!controlledValue) setInternal(next)
    onValueChange?.(next)
  }

  useEffect(() => {
    const list = listRef.current
    if (!list) return undefined

    const onKeyDown = (event) => {
      const triggers = Array.from(list.querySelectorAll('[role="tab"]:not(:disabled)'))
      const currentIndex = triggers.findIndex((el) => el.getAttribute('aria-selected') === 'true')
      let nextIndex = currentIndex
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % triggers.length
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + triggers.length) % triggers.length
      else if (event.key === 'Home') nextIndex = 0
      else if (event.key === 'End') nextIndex = triggers.length - 1
      else return
      event.preventDefault()
      triggers[nextIndex]?.click()
      triggers[nextIndex]?.focus()
    }

    list.addEventListener('keydown', onKeyDown)
    return () => list.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <TabsContext.Provider value={{ id, value, setValue, variant, listRef }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, ...props }) {
  const { id, variant, listRef } = useContext(TabsContext)
  return (
    <div
      ref={listRef}
      id={`${id}-list`}
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        'relative inline-flex w-full items-center gap-1',
        variant === 'underline' ? 'border-b border-border' : 'rounded-xl bg-background-soft p-1',
        className,
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ value, children, className, disabled = false }) {
  const { id, value: active, setValue, variant } = useContext(TabsContext)
  const selected = active === value
  const isUnderline = variant === 'underline'
  const indicatorId = `${id}-indicator`

  return (
    <button
      type="button"
      role="tab"
      id={`${id}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${id}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      onClick={() => setValue(value)}
      className={cn(
        'relative flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium outline-none transition-colors',
        isUnderline ? 'border-b-2 px-3.5 pb-2.5 pt-2' : 'rounded-lg px-3.5 py-2',
        selected ? (isUnderline ? 'border-transparent text-primary' : 'text-foreground') : 'border-transparent text-muted hover:text-foreground',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      {children}
      {selected ? (
        isUnderline ? (
          <motion.span
            layoutId={indicatorId}
            className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          />
        ) : (
          <motion.span
            layoutId={indicatorId}
            className="absolute inset-0 rounded-lg bg-surface shadow-sm ring-1 ring-border"
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          />
        )
      ) : null}
    </button>
  )
}

export function TabsContent({ value, children, className, ...props }) {
  const { id, value: active } = useContext(TabsContext)
  if (active !== value) return null
  return (
    <div
      id={`${id}-panel-${value}`}
      role="tabpanel"
      aria-labelledby={`${id}-tab-${value}`}
      tabIndex={0}
      className={cn('mt-4 outline-none', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export default Tabs
