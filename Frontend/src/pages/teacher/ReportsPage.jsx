import { FileText } from 'lucide-react'
import { Badge } from '@/components/feedback/Badge'
import { ComingSoon } from '@/components/feedback/ComingSoon'

/**
 * Reports — coming soon. The full reporting experience is being prepared;
 * this placeholder keeps the route alive without fake data. Published
 * results stay available from each submission's review page.
 */
export function ReportsPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="flex flex-wrap items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#0F766E] to-[#22C55E] text-white">
            <FileText className="size-4.5" />
          </span>
          Reports
          <Badge variant="warning" size="sm">
            Coming soon
          </Badge>
        </h1>
        <p className="mt-1.5 text-sm text-muted">Downloadable evaluation reports for every published submission.</p>
      </div>

      <ComingSoon
        icon={FileText}
        description="We're working on powerful reports to help teachers and institutions better understand student performance. Published results remain available from each submission's review page."
      />
    </div>
  )
}

export default ReportsPage