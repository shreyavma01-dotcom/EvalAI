import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ClipboardCheck, Search } from 'lucide-react'
import { teacherApi } from '@/services/submissions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/feedback/Badge'
import { Skeleton } from '@/components/feedback/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Card, CardContent } from '@/components/common/Card'
import { cn } from '@/utils/cn'
import { formatRelativeTime } from '@/utils/format'

const TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'evaluated', label: 'Evaluated' },
]

export function SubmissionsPage() {
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['teacher-submissions', status, search, page],
    queryFn: () => teacherApi.submissions({ status, search, page, limit: 10 }),
    placeholderData: (prev) => prev,
  })

  const items = data?.items ?? []
  const pagination = data?.pagination ?? { pages: 1, total: 0 }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Review queue</h1>
          <p className="mt-1 text-sm text-muted">Every submission is AI-previewed. You verify the verdict and publish the result.</p>
        </div>
        <Input
          className="w-full sm:w-72"
          placeholder="Search student, title or subject"
          leftIcon={Search}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
        />
      </div>

      <div className="flex gap-2 rounded-2xl border border-border/60 bg-surface p-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setStatus(tab.key)
              setPage(1)
            }}
            className={cn(
              'flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
              status === tab.key ? 'bg-primary text-white shadow-medium' : 'text-muted hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No submissions here"
          description="Nothing matches this filter yet. New submissions appear as soon as students upload them."
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
                      <Badge variant={item.status === 'evaluated' ? 'success' : 'warning'}>
                        {item.status === 'evaluated' ? 'Evaluated' : 'Pending review'}
                      </Badge>
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
                    <div className="flex flex-col items-end">
                      {typeof item.aiScore === 'number' ? (
                        <>
                          <span className="text-xs text-muted">AI preview</span>
                          <span className="text-base font-bold tracking-tight text-foreground">{item.aiScore}%</span>
                        </>
                      ) : item.aiStatus === 'running' ? (
                        <Badge variant="info">AI …</Badge>
                      ) : (
                        <Badge variant="neutral">No AI</Badge>
                      )}
                    </div>
                    {typeof item.teacherMarks === 'number' ? (
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-muted">Your score</span>
                        <span className="text-base font-bold tracking-tight text-foreground">{item.teacherMarks}</span>
                      </div>
                    ) : null}
                    <Link
                      to={item.status === 'evaluated' ? `/teacher/submission/${item._id}` : `/teacher/evaluation/${item._id}`}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors',
                        item.status === 'evaluated'
                          ? 'bg-background-soft text-foreground hover:bg-accent'
                          : 'bg-primary text-white shadow-medium hover:bg-primary-strong',
                      )}
                    >
                      {item.status === 'evaluated' ? 'View result' : 'Evaluate'} <ArrowRight className="size-3.5" />
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

export default SubmissionsPage