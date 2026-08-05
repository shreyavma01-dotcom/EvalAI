import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, History } from 'lucide-react'
import { studentApi } from '@/services/submissions'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/feedback/Badge'
import { Skeleton } from '@/components/feedback/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Card, CardContent } from '@/components/common/Card'
import { formatRelativeTime } from '@/utils/format'

/**
 * Student submission history — every upload with its evaluation status,
 * AI preview and a link to the result when evaluated.
 */
export function HistoryPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['student-history', page],
    queryFn: () => studentApi.submissions({ page, limit: 10 }),
    placeholderData: (prev) => prev,
  })

  const items = data?.items ?? []
  const pagination = data?.pagination ?? { pages: 1, total: 0 }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#0F766E] to-[#22C55E] text-white">
            <History className="size-4.5" />
          </span>
          History
        </h1>
        <p className="mt-1.5 text-sm text-muted">Every assignment you've submitted and where it stands.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={History}
          title="No submissions yet"
          description="Once you submit an assignment it appears here with its evaluation status."
          actionLabel="Submit an assignment"
          onAction={() => window.location.assign('/student/submit')}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const evaluated = item.status === 'evaluated'
            return (
              <Card key={item._id} variant="default" radius="lg" padding="none" className="overflow-hidden transition-all hover:border-primary/40 hover:shadow-medium">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-foreground">{item.title}</h3>
                        <Badge variant={evaluated ? 'success' : 'warning'}>
                          {evaluated ? 'Evaluated' : 'In review'}
                        </Badge>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                        <span>{item.subject}</span>
                        <span>·</span>
                        <span>submitted {formatRelativeTime(item.submittedAt)}</span>
                        {typeof item.aiScore === 'number' ? (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-primary-strong">AI preview {item.aiScore}%</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    {evaluated ? (
                      <Link
                        to={`/student/results/submission/${item._id}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-medium transition-colors hover:bg-primary-strong"
                      >
                        View result <ArrowRight className="size-3.5" />
                      </Link>
                    ) : (
                      <span className="text-xs font-medium text-muted">Awaiting teacher review</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {pagination.pages > 1 ? (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="px-2 text-sm text-muted">
                Page {page} of {pagination.pages}
              </span>
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

export default HistoryPage