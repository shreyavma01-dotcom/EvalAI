import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Sparkles } from 'lucide-react'
import { teacherApi } from '@/services/submissions'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/feedback/Badge'
import { Skeleton } from '@/components/feedback/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Card, CardContent } from '@/components/common/Card'
import { formatRelativeTime } from '@/utils/format'

/**
 * AI Evaluation workspace queue. Every pending submission is listed here and
 * opens the evaluation studio (/teacher/evaluation/:submissionId) where the
 * existing OCR + Gemini pipeline runs automatically.
 */
export function AiEvaluationPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-ai-queue', page],
    queryFn: () => teacherApi.submissions({ status: 'pending', page, limit: 10 }),
    placeholderData: (prev) => prev,
  })

  const items = data?.items ?? []
  const pagination = data?.pagination ?? { pages: 1, total: 0 }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#0F766E] to-[#22C55E] text-white">
            <Sparkles className="size-4.5" />
          </span>
          AI Evaluation
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Pending answer sheets open in the AI evaluation studio — OCR + Gemini run automatically, then you review and
          publish.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Queue is clear"
          description="No pending submissions right now. New ones appear here as soon as students upload them."
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
                      <Badge variant="warning">Pending</Badge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span>{item.subject}</span>
                      <span>·</span>
                      <span>{item.student?.name ?? 'Unknown student'}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(item.submittedAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {typeof item.aiScore === 'number' ? (
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-muted">AI preview</span>
                        <span className="text-base font-bold tracking-tight text-foreground">{item.aiScore}%</span>
                      </div>
                    ) : (
                      <Badge variant="info">AI …</Badge>
                    )}
                    <Link
                      to={`/teacher/evaluation/${item._id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0F766E] to-[#22C55E] px-4 py-2 text-sm font-semibold text-white shadow-medium transition-all hover:shadow-large hover:brightness-110"
                    >
                      Evaluate <ArrowRight className="size-3.5" />
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

export default AiEvaluationPage