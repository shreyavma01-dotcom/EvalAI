import { cva } from 'class-variance-authority'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '@/components/common/Card'
import { AnimatedNumber } from '@/components/common/AnimatedNumber'
import { Badge } from '@/components/feedback/Badge'
import { cn } from '@/utils/cn'

const toneStyles = cva('', {
  variants: {
    tone: {
      primary: 'bg-primary-muted text-primary-strong',
      secondary: 'bg-secondary-muted text-secondary-strong',
      success: 'bg-success-muted text-success-strong',
      warning: 'bg-warning-muted text-warning-strong',
      danger: 'bg-danger-muted text-danger-strong',
      info: 'bg-info-muted text-info-strong',
      neutral: 'bg-background-soft text-muted',
    },
  },
  defaultVariants: { tone: 'primary' },
})

/**
 * Stat card — label, animated value, delta and optional sparkline slot.
 */
export function StatCard({
  label,
  value,
  prefix,
  suffix,
  delta,
  deltaLabel = 'vs last period',
  tone = 'primary',
  icon: Icon,
  decimals = 0,
  format,
  spark,
  className,
}) {
  const positive = (delta ?? 0) >= 0
  const DeltaIcon = positive ? ArrowUpRight : ArrowDownRight

  return (
    <Card variant="default" radius="lg" padding="none" className={cn('group relative overflow-hidden transition-all duration-300 hover:shadow-hover', className)}>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="type-label text-muted">{label}</span>
          {Icon ? (
            <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', toneStyles({ tone }))}>
              <Icon className="size-4.5" />
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="flex items-baseline gap-1 text-2xl font-bold tracking-tight text-foreground">
            {prefix ? <span className="text-base font-semibold text-muted">{prefix}</span> : null}
            <AnimatedNumber value={value} decimals={decimals} format={format} />
            {suffix ? <span className="text-base font-semibold text-muted">{suffix}</span> : null}
          </span>
          {delta !== undefined ? (
            <span className="flex items-center gap-1.5 text-xs">
              <Badge variant={positive ? 'success' : 'danger'} size="xs" className="gap-0.5">
                <DeltaIcon className="size-3" />
                {Math.abs(delta)}%
              </Badge>
              <span className="text-muted">{deltaLabel}</span>
            </span>
          ) : null}
        </div>
        {spark}
      </CardContent>
    </Card>
  )
}

export default StatCard
