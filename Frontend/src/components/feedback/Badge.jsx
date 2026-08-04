import { cva } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium transition-colors',
  {
    variants: {
      variant: {
        neutral: 'bg-background-soft text-foreground-soft border border-border',
        muted: 'bg-muted/10 text-muted border border-transparent',
        primary: 'bg-primary text-primary-foreground border border-transparent',
        'primary-soft': 'bg-primary-muted text-primary-strong border border-primary/15',
        secondary: 'bg-secondary/10 text-secondary-strong border border-secondary/20',
        success: 'bg-success/10 text-success-strong border border-success/20',
        warning: 'bg-warning/10 text-warning-strong border border-warning/25',
        danger: 'bg-danger/10 text-danger-strong border border-danger/20',
        info: 'bg-info/10 text-info-strong border border-info/20',
        outline: 'border border-border text-foreground bg-transparent',
        glass: 'glass-subtle text-foreground',
        gradient: 'bg-gradient-to-r from-primary to-secondary text-white border border-transparent',
      },
      size: {
        xs: 'h-4.5 px-2 text-[10px] gap-1',
        sm: 'h-5 px-2.5 text-[11px] gap-1',
        md: 'h-6 px-3 text-xs gap-1.5',
        lg: 'h-7 px-3.5 text-sm gap-1.5',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
    },
  },
)

/**
 * Badge with color variants, dot, icon and dismiss support.
 */
export function Badge({
  className,
  variant = 'neutral',
  size = 'md',
  dot = false,
  icon: Icon,
  onDismiss,
  children,
  ...props
}) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {Icon ? <Icon className={size === 'lg' ? 'size-3.5' : 'size-3'} aria-hidden="true" /> : null}
      {children}
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="-mr-0.5 grid size-4 place-items-center rounded-full opacity-60 transition-opacity hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="size-3" />
        </button>
      ) : null}
    </span>
  )
}

export default Badge
