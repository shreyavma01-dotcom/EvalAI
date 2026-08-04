import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Badge } from '@/components/feedback/Badge'
import { BarChart } from '@/components/charts/Charts'
import { cn } from '@/utils/cn'

/**
 * Analytics card — headline metrics + bar chart.
 */
export function AnalyticsCard({
  title = 'Analytics',
  description,
  total,
  totalLabel,
  delta,
  data = [],
  series = [{ key: 'value', name: 'Value' }],
  xKey = 'label',
  className,
}) {
  const positive = (delta ?? 0) >= 0

  return (
    <Card variant="default" radius="lg" padding="none" className={cn('overflow-hidden', className)}>
      <CardHeader className="flex-row items-start justify-between gap-3 px-5 pt-5">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4 text-muted" />
            {title}
          </CardTitle>
          {description ? <span className="text-xs text-muted">{description}</span> : null}
        </div>
        {delta !== undefined ? (
          <Badge variant={positive ? 'success' : 'danger'} size="sm" className="gap-0.5">
            {positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {Math.abs(delta)}%
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-3 pb-4 pt-3">
        <div className="flex items-baseline gap-2 px-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">{total}</span>
          <span className="text-xs text-muted">{totalLabel}</span>
        </div>
        <BarChart data={data} series={series} xKey={xKey} height={200} />
      </CardContent>
    </Card>
  )
}

export default AnalyticsCard
