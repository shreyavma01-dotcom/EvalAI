import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { GraduationCap, Search } from 'lucide-react'
import { teacherApi } from '@/services/submissions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/feedback/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState'
import { CardContent } from '@/components/common/Card'
import { formatRelativeTime } from '@/utils/format'

export function StudentsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-students', page, search],
    queryFn: () => teacherApi.students({ page, limit: 10, search }),
    placeholderData: (prev) => prev,
  })

  const items = data?.items ?? []
  const pagination = data?.pagination ?? { pages: 1, total: 0 }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Students</h1>
          <p className="mt-1 text-sm text-muted">Everyone who has submitted answer sheets, with their progress at a glance.</p>
        </div>
        <Input
          className="w-full sm:w-72"
          placeholder="Search by name"
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
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No students found"
          description="Students appear here after their first submission."
        />
      ) : (
        <CardContent className="flex flex-col gap-3 p-0">
          {items.map((student) => {
            const total = student.submitted ?? 0
            const evaluated = student.evaluated ?? 0
            const progress = total ? Math.round((evaluated / total) * 100) : 0
            return (
              <div key={student._id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-surface p-4 transition-all hover:border-primary/40 hover:shadow-medium">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-muted text-primary-strong">
                    <GraduationCap className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{student.name}</div>
                    <div className="mt-0.5 truncate text-xs text-muted">
                      {student.email} · joined {formatRelativeTime(student.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted">Submissions</span>
                    <span className="text-sm font-bold text-foreground">{total}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted">Pending</span>
                    <span className="text-sm font-bold text-foreground">{Math.max(0, total - evaluated)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted">Avg</span>
                    <span className="text-sm font-bold text-foreground">{typeof student.averageMarks === 'number' ? student.averageMarks : '—'}</span>
                  </div>
                  <div className="hidden w-28 sm:block">
                    <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-muted">{progress}% graded</div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-background-soft">
                      <div className="h-full rounded-full bg-success" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      )}

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
  )
}

export default StudentsPage