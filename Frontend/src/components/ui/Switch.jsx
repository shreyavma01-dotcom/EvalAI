import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

/**
 * Animated switch (toggle).
 */
export const Switch = forwardRef(function Switch(
  { className, id, label, description, checked = false, onCheckedChange, disabled = false, size = 'md', ...props },
  ref,
) {
  const trackSize = {
    sm: 'h-5 w-9',
    md: 'h-6 w-11',
    lg: 'h-7 w-13',
  }[size]
  const knobSize = {
    sm: 'size-3.5',
    md: 'size-4.5',
    lg: 'size-5.5',
  }[size]
  const knobOffset = {
    sm: 'translate-x-4',
    md: 'translate-x-5',
    lg: 'translate-x-6',
  }[size]

  const switchEl = (
    <button
      ref={ref}
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-[var(--duration-fast)]',
        trackSize,
        checked ? 'bg-primary' : 'bg-border-strong',
        disabled && 'cursor-not-allowed opacity-50',
        label || description ? '' : className,
      )}
      {...props}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          'absolute left-0.5 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm',
          knobSize,
          checked && knobOffset,
        )}
      />
    </button>
  )

  if (!label && !description) return switchEl

  return (
    <div className={cn('inline-flex items-center gap-3', disabled && 'opacity-60', label || description ? className : '')}>
      {switchEl}
      <label htmlFor={id} className="flex cursor-pointer flex-col gap-0.5">
        {label ? <span className="text-sm font-medium leading-5 text-foreground">{label}</span> : null}
        {description ? <span className="text-xs leading-4 text-muted">{description}</span> : null}
      </label>
    </div>
  )
})

export default Switch
