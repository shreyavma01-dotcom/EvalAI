import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, BookOpenCheck, FileText, Search } from 'lucide-react'
import { studentApi } from '@/services/submissions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/feedback/Badge'
import { Skeleton } from '@/components/feedback/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Card, CardContent } from '@/components/common/Card'
import { formatDate } from '@/utils/format'

function MarkerBadge({ status }) {
  if (status === 'correct') return <Badge variant="success">✓</Badge>
  if (status === 'partial') return <Badge variant="warning" className="rounded-md">P</Badge>
  if (status === 'unattempted') return <Badge variant="neutral" className="rounded-md">?</Badge>
  return <Badge variant="danger" className="rounded-md">✗</Badge>
}

export function ResultsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['student-results', page, search],
    queryFn: () => studentApi.results({ page, limit: 10, search }),
    placeholderData: (prev) => prev,
  })

  const items = data?.items ?? []
  const pagination = data?.pagination ?? { pages: 1, total: 0 }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My results</h1>
          <p className="mt-1 text-sm text-muted">Evaluated answer sheets with the teacher’s marks and feedback.</p>
        </div>
        <Input
          className="w-full sm:w-72"
          placeholder="Search by title or subject"
          leftIcon={Search}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={BookOpenCheck}
          title="No evaluated results yet"
          description="Once a teacher publishes a result you will see it here with the full AI breakdown."
          actionLabel="Submit an answer sheet"
          onAction={() => window.location.assign('/student/submit')}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const aiCounts = item.aiEvaluation?.statusCounts ?? {}
            const correctCount = aiCounts.correct ?? item.aiEvaluation?.questions?.filter((q) => q.status === 'correct').length
            const totalQuestions = item.aiEvaluation?.questions?.length ?? 0
            return (
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
                        <span>{formatDate(item.evaluatedAt, 'datetime')}</span>
                        {item.teacherId?.name ? (
                          <>
                            <span>·</span>
                            <span>by {item.teacherId.name}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    {typeof item.teacherMarks === 'number' ? (
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-bold tracking-tight text-foreground">{item.teacherMarks}</span>
                        <span className="text-xs text-muted">teacher score</span>
                      </div>
                    ) : null}
                    <Link
                      to={`/student/results/submission/${item._id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary-muted px-3.5 py-2 text-sm font-semibold text-primary-strong transition-colors hover:bg-primary/15"
                    >
                      View result <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
                    {totalQuestions > 0 ? (
                      <span>{totalQuestions} questions</span>
                    ) : null}
                    <span className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1">
                        <MarkerBadge status="correct" /> {correctCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MarkerBadge status="partial" /> {aiCounts.partial ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MarkerBadge status="incorrect" /> {aiCounts.incorrect ?? 0}
                      </span>
                    </span>
                    {item.reportUrl ? (
                      <>
                        <span className="text-muted/40">|</span>
                        <a href={item.reportUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                          <FileText className="size-3.5" /> Download report
                        </a>
                      </>
                    ) : null}
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
                Page {page} of {pagination.pages} {isFetching ? '· loading…' : ''}
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

export default ResultsPage