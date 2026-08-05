import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, FileText, Target } from 'lucide-react'
import { teacherApi } from '@/services/submissions'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/feedback/Badge'
import { Skeleton } from '@/components/feedback/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Card, CardContent } from '@/components/common/Card'
import { StatCard } from '@/components/common/widgets/StatCard'
import { formatDate } from '@/utils/format'

/**
 * Evaluation reports. Summary cards come from the dashboard stats; the list
 * shows every evaluated submission and routes to the existing review page
 * where the report PDF can be downloaded.
 */
export function ReportsPage() {
  const [page, setPage] = useState(1)
  const { data: dash } = useQuery({ queryKey: ['teacher-dashboard'], queryFn: teacherApi.dashboard })
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-reports', page],
    queryFn: () => teacherApi.submissions({ status: 'evaluated', page, limit: 10 }),
    placeholderData: (prev) => prev,
  })

  const stats = dash?.stats ?? {}
  const items = data?.items ?? []
  const pagination = data?.pagination ?? { pages: 1, total: 0 }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#0F766E] to-[#22C55E] text-white">
            <FileText className="size-4.5" />
          </span>
          Reports
        </h1>
        <p className="mt-1.5 text-sm text-muted">Every published evaluation with the final scores and report files.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Reports generated" value={stats.completedReviews ?? 0} icon={FileText} tone="primary" />
        <StatCard label="Pending reviews" value={stats.pendingReviews ?? 0} icon={Target} tone="warning" />
        <StatCard label="Average score given" value={stats.averageScoreGiven ?? 0} suffix="/ total" icon={Target} tone="info" />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nothing published yet"
          description="Once you evaluate and publish a submission, the report summary appears here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Card key={item._id} variant="default" radius="lg" padding="none" className="overflow-hidden transition-all hover:border-primary/40 hover:shadow-medium">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-foreground">{item.title}</h3>
                      <Badge variant="success">Evaluated</Badge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span>{item.subject}</span>
                      <span>·</span>
                      <span>{item.student?.name ?? 'Unknown student'}</span>
                      <span>·</span>
                      <span>{item.evaluatedAt ? formatDate(item.evaluatedAt, 'datetime') : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {typeof item.teacherMarks === 'number' ? (
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-muted">Final marks</span>
                        <span className="text-base font-bold tracking-tight text-foreground">{item.teacherMarks}</span>
                      </div>
                    ) : null}
                    <Link
                      to={`/teacher/submission/${item._id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-medium transition-colors hover:bg-primary-strong"
                    >
                      View report <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {pagination.pages > 1 ? (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="px-2 text-sm text-muted">Page {page} of {pagination.pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default ReportsPage