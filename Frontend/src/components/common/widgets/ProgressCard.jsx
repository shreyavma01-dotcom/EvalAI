import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { LinearProgress } from '@/components/feedback/LinearProgress'
import { CircularProgress } from '@/components/feedback/CircularProgress'
import { Badge } from '@/components/feedback/Badge'
import { cn } from '@/utils/cn'

/**
 * Progress card — metric with linear or circular progress.
 */
export function ProgressCard({
  title,
  subtitle,
  value,
  variant = 'primary',
  mode = 'linear',
  max = 100,
  status,
  footer,
  className,
}) {
  const progress = Math.min((Number(value) / max) * 100, 100)

  return (
    <Card variant="default" radius="lg" padding="none" className={cn('overflow-hidden', className)}>
      <CardHeader className="flex-row items-start justify-between px-5 pt-5">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-base">{title}</CardTitle>
          {subtitle ? <span className="text-xs text-muted">{subtitle}</span> : null}
        </div>
        {status ? <Badge variant={status.variant ?? 'neutral'} size="sm">{status.label}</Badge> : null}
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-4">
        {mode === 'circular' ? (
          <div className="flex items-center gap-5">
            <CircularProgress value={progress} variant={variant} size={72} strokeWidth={7} />
            <div className="flex flex-col gap-1">
              <span className="text-lg font-bold text-foreground">{value}</span>
              <span className="text-xs text-muted">out of {max}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
              <span className="text-xs font-medium text-muted">{Math.round(progress)}% complete</span>
            </div>
            <LinearProgress value={progress} variant={variant} size="md" />
          </div>
        )}
        {footer ? <div className="mt-4 border-t border-border/60 pt-3.5">{footer}</div> : null}
      </CardContent>
    </Card>
  )
}

export default ProgressCard
