import { Loader2 } from 'lucide-react'
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const spinnerVariants = cva('shrink-0 animate-spin', {
  variants: {
    size: {
      xs: 'size-3',
      sm: 'size-4',
      md: 'size-5',
      lg: 'size-6',
      xl: 'size-8',
    },
    variant: {
      default: 'text-primary',
      muted: 'text-muted',
      subtle: 'text-muted-foreground',
      inverted: 'text-white',
      current: 'text-current',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
})

/**
 * Loading spinner.
 * @param {{ size?: 'xs'|'sm'|'md'|'lg'|'xl', variant?: 'default'|'muted'|'subtle'|'inverted'|'current', label?: string, className?: string }} props
 */
export function Spinner({ size = 'md', variant = 'default', label, className, ...props }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2', className)}>
      <Loader2 className={spinnerVariants({ size, variant })} {...props} />
      {label ? <span className="text-sm font-medium text-muted">{label}</span> : null}
      <span className="sr-only">Loading{label ? ` ${label}` : ''}</span>
    </span>
  )
}

export default Spinner
