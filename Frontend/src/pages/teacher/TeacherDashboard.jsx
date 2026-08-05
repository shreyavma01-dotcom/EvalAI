import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CheckCircle2, ClipboardCheck, Clock, GraduationCap, Target } from 'lucide-react'
import { teacherApi } from '@/services/submissions'
import { useAuth } from '@/hooks/useAuth'
import { StatCard } from '@/components/common/widgets/StatCard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card'
import { Badge } from '@/components/feedback/Badge'
import { Skeleton } from '@/components/feedback/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState'
import { formatRelativeTime } from '@/utils/format'

export function TeacherDashboard() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({ queryKey: ['teacher-dashboard'], queryFn: teacherApi.dashboard })

  const stats = data?.stats ?? {}

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome, {user?.name.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-muted">Review incoming answer sheets, add your verdict and send results to students.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total students" value={stats.totalStudents ?? 0} icon={GraduationCap} tone="primary" />
        <StatCard label="Pending reviews" value={stats.pendingReviews ?? 0} icon={Clock} tone="warning" />
        <StatCard label="Completed reviews" value={stats.completedReviews ?? 0} icon={CheckCircle2} tone="success" />
        <StatCard label="Average score given" value={stats.averageScoreGiven ?? 0} suffix="/ total" icon={Target} tone="info" />
      </div>

      <Card variant="default" radius="lg" padding="none" className="overflow-hidden">
        <CardContent className="p-6">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Latest submissions</CardTitle>
              <CardDescription className="mt-1">The five most recent submissions from your classes.</CardDescription>
            </div>
            <Link to="/teacher/submissions" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              Open review queue <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>

          {isLoading ? (
            <div className="mt-5 flex flex-col gap-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : (data?.recent?.length ?? 0) === 0 ? (
            <EmptyState
              className="mt-5"
              icon={ClipboardCheck}
              title="No submissions yet"
              description="When a student submits an answer sheet it will show up here, AI-previewed and ready for you."
              action={
                <span className="text-sm text-muted">Submitted sheets appear automatically.</span>
              }
            />
          ) : (
            <div className="mt-5 flex flex-col gap-3">
              {data.recent.map((item) => (
                <Link
                  key={item._id}
                  to={item.status === 'evaluated' ? `/teacher/submission/${item._id}` : `/teacher/evaluation/${item._id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-surface p-4 transition-all hover:border-primary/40 hover:shadow-medium"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{item.title}</div>
                    <div className="mt-1 text-xs text-muted">
                      {item.subject} · {item.studentId?.name ?? 'Student'} · {formatRelativeTime(item.submittedAt)}
                    </div>
                  </div>
                  <Badge variant={item.status === 'evaluated' ? 'success' : 'warning'}>
                    {item.status === 'evaluated' ? 'Evaluated' : 'Pending'}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TeacherDashboard