import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, BookOpenCheck, CheckCircle2, Clock, PlusCircle, Target } from 'lucide-react'
import { studentApi } from '@/services/submissions'
import { useAuth } from '@/hooks/useAuth'
import { StatCard } from '@/components/common/widgets/StatCard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card'
import { Badge } from '@/components/feedback/Badge'
import { Skeleton } from '@/components/feedback/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState'
import { formatRelativeTime } from '@/utils/format'

function StatusBadge({ status }) {
  if (status === 'evaluated') return <Badge variant="success">Evaluated</Badge>
  if (status === 'pending') return <Badge variant="warning">Pending review</Badge>
  return <Badge variant="neutral">{status}</Badge>
}

export function StudentDashboard() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({ queryKey: ['student-dashboard'], queryFn: studentApi.dashboard })

  const stats = data?.stats ?? {}

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back, {user?.name.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-muted">Here is the state of your submitted answer sheets.</p>
        </div>
        <Link to="/student/submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-medium transition-all hover:bg-primary-strong">
          <PlusCircle className="size-4" /> New submission
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total submissions" value={stats.total ?? 0} icon={BookOpenCheck} tone="primary" />
        <StatCard label="Pending review" value={stats.pending ?? 0} icon={Clock} tone="warning" />
        <StatCard label="Evaluated" value={stats.evaluated ?? 0} icon={CheckCircle2} tone="success" />
        <StatCard label="Average score" value={stats.averageScore ?? 0} suffix="/ total" icon={Target} tone="info" />
      </div>

      <Card variant="default" radius="lg" padding="none" className="overflow-hidden">
        <CardContent className="p-6">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent submissions</CardTitle>
              <CardDescription className="mt-1">Latest five answer sheets you submitted.</CardDescription>
            </div>
            <Link to="/student/results" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>

          {isLoading ? (
            <div className="mt-5 flex flex-col gap-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : (data?.recent?.length ?? 0) === 0 ? (
            <EmptyState
              className="mt-5"
              title="No submissions yet"
              description="Upload your first handwritten answer sheet to get an AI teacher review."
              action={
                <Link to="/student/submit" className="text-sm font-semibold text-primary hover:underline">
                  Submit a sheet
                </Link>
              }
            />
          ) : (
            <div className="mt-5 flex flex-col gap-3">
              {data.recent.map((item) => (
                <Link
                  key={item._id}
                  to={
                    item.status === 'evaluated'
                      ? `/student/results/submission/${item._id}`
                      : '/student/results'
                  }
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-surface p-4 transition-all hover:border-primary/40 hover:shadow-medium"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{item.title}</div>
                    <div className="mt-1 text-xs text-muted">
                      {item.subject} · submitted {formatRelativeTime(item.submittedAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {typeof item.teacherMarks === 'number' ? (
                      <span className="text-sm font-bold text-foreground">{item.teacherMarks}</span>
                    ) : null}
                    <StatusBadge status={item.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StudentDashboard