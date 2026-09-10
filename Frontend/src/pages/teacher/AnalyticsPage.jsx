import { BarChart3 } from 'lucide-react'
import { Badge } from '@/components/feedback/Badge'
import { ComingSoon } from '@/components/feedback/ComingSoon'

/**
 * Analytics — coming soon. Advanced insights and performance analytics are
 * being prepared; this placeholder keeps the route alive without fake data.
 * Basic per-submission scores remain visible on the dashboard.
 */
export function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="flex flex-wrap items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#0F766E] to-[#22C55E] text-white">
            <BarChart3 className="size-4.5" />
          </span>
          Analytics
          <Badge variant="warning" size="sm">
            Coming soon
          </Badge>
        </h1>
        <p className="mt-1.5 text-sm text-muted">Advanced insights into submissions, performance and subject coverage.</p>
      </div>

      <ComingSoon
        icon={BarChart3}
        description="Advanced insights and performance analytics will be available here soon. Until then, recent scores and submission status live on your dashboard."
      />
    </div>
  )
}

export default AnalyticsPage
