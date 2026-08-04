import { motion } from 'framer-motion'
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'
import { clamp } from '@/utils/format'

const barVariants = cva('relative h-full rounded-full', {
  variants: {
    variant: {
      primary: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-danger',
      info: 'bg-info',
      muted: 'bg-muted',
      gradient: 'bg-gradient-to-r from-primary via-info to-secondary',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
})

/**
 * Linear progress bar with optional value label and indeterminate mode.
 */
export function LinearProgress({
  value = 0,
  variant = 'primary',
  size = 'md',
  indeterminate = false,
  showValue = false,
  label,
  className,
}) {
  const safeValue = clamp(Number(value) || 0, 0, 100)
  const height = { sm: 'h-1', md: 'h-1.5', lg: 'h-2', xl: 'h-3' }[size]

  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      {label || showValue ? (
        <div className="flex items-center justify-between gap-2 text-xs">
          {label ? <span className="font-medium text-foreground-soft">{label}</span> : <span />}
          {showValue && !indeterminate ? (
            <span className="font-semibold tabular-nums text-muted">{Math.round(safeValue)}%</span>
          ) : null}
        </div>
      ) : null}
      <div
        className={cn('relative w-full overflow-hidden rounded-full bg-background-soft', height)}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : safeValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {indeterminate ? (
          <span className="animate-indeterminate absolute top-0 h-full rounded-full bg-primary" />
        ) : (
          <motion.span
            className={cn(barVariants({ variant }), 'block')}
            initial={{ width: 0 }}
            animate={{ width: `${safeValue}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
      </div>
    </div>
  )
}

export default LinearProgress
