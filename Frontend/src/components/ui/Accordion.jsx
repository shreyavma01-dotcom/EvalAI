import { createContext, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

const AccordionContext = createContext(null)

export function Accordion({ type = 'single', defaultValue = [], children, className }) {
  const [openItems, setOpenItems] = useState(() => (Array.isArray(defaultValue) ? defaultValue : [defaultValue]))

  const toggleItem = (value) => {
    setOpenItems((current) => {
      if (type === 'single') {
        return current.includes(value) ? [] : [value]
      }
      return current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    })
  }

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div className={cn('flex flex-col gap-2.5', className)}>{children}</div>
    </AccordionContext.Provider>
  )
}

export function AccordionItem({ children, className }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border/60 bg-surface shadow-sm transition-colors', className)}>
      {children}
    </div>
  )
}

export function AccordionTrigger({ value, icon: Icon, children, className, chevron = true }) {
  const { openItems, toggleItem } = useContext(AccordionContext)
  const open = openItems.includes(value)

  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => toggleItem(value)}
      className={cn(
        'flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-background-soft/60',
        open && 'text-primary',
        className,
      )}
    >
      <span className="flex items-center gap-2.5">
        {Icon ? <Icon className="size-4 text-muted" /> : null}
        {children}
      </span>
      {chevron ? (
        <ChevronDown
          className={cn('size-4 shrink-0 text-muted transition-transform duration-300 ease-[var(--ease-expo-out)]', open && 'rotate-180')}
        />
      ) : null}
    </button>
  )
}

export function AccordionContent({ value, children, className }) {
  const { openItems } = useContext(AccordionContext)
  const open = openItems.includes(value)

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className={cn('px-4 pb-4 text-sm text-muted-foreground', className)}>{children}</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default Accordion
