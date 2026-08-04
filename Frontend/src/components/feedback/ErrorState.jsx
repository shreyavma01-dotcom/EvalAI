import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react'
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'

const errorIconVariants = cva('grid place-items-center rounded-2xl', {
  variants: {
    variant: {
      default: 'bg-danger-muted text-danger',
      offline: 'bg-warning-muted text-warning-strong',
      notFound: 'bg-info-muted text-info',
      forbidden: 'bg-primary-muted text-primary-strong',
    },
  },
})

const ICONS = {
  default: AlertTriangle,
  offline: WifiOff,
  notFound: AlertTriangle,
  forbidden: AlertTriangle,
}

/**
 * Error state with optional retry.
 */
export function ErrorState({
  variant = 'default',
  title,
  message = 'Something went wrong while loading this content. Please try again.',
  retryLabel = 'Try again',
  onRetry,
  className,
}) {
  const Icon = ICONS[variant] ?? AlertTriangle

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-3xl border border-border/60 bg-surface px-6 py-12 text-center shadow-sm',
        className,
      )}
    >
      <div className={cn(errorIconVariants({ variant }), 'size-14')}>
        <Icon className="size-7" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <h3 className="type-subtitle text-foreground">{title ?? 'Unable to load'}</h3>
        <p className="type-caption max-w-sm">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="soft" leftIcon={RefreshCw} onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  )
}

export default ErrorState
