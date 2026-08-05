import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpenCheck, CheckCircle2, Clock, GraduationCap, ShieldCheck, UserRound } from 'lucide-react'
import { adminApi } from '@/services/submissions'
import { useAuth } from '@/hooks/useAuth'
import { StatCard } from '@/components/common/widgets/StatCard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card'
import { Badge } from '@/components/feedback/Badge'
import { Skeleton } from '@/components/feedback/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState'
import { formatRelativeTime } from '@/utils/format'

export function AdminDashboard() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: adminApi.dashboard })

  const stats = data?.stats ?? {}

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform overview</h1>
        <p className="mt-1 text-sm text-muted">
          Signed in as {user?.name} with platform admin access.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={stats.students ?? 0} icon={GraduationCap} tone="primary" />
        <StatCard label="Teachers" value={stats.teachers ?? 0} icon={UserRound} tone="secondary" />
        <StatCard label="Submissions" value={stats.submissions ?? 0} icon={BookOpenCheck} tone="info" />
        <StatCard label="Pending review" value={stats.pending ?? 0} icon={Clock} tone="warning" />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card variant="default" radius="lg" padding="lg">
          <CardHeader className="flex-row items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-success-muted text-success-strong">
              <CheckCircle2 className="size-4.5" />
            </span>
            <div>
              <CardTitle className="text-base">Evaluated submissions</CardTitle>
              <CardDescription className="mt-0.5">Completed reviews across the platform.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="mt-4">
            <span className="text-4xl font-bold tracking-tight text-foreground">{stats.evaluated ?? 0}</span>
            <span className="ml-2 text-sm text-muted">results published</span>
          </CardContent>
        </Card>

        <Card variant="default" radius="lg" padding="lg">
          <CardHeader className="flex-row items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary-muted text-primary-strong">
              <ShieldCheck className="size-4.5" />
            </span>
            <div>
              <CardTitle className="text-base">Accounts</CardTitle>
              <CardDescription className="mt-0.5">Roles managed through the platform.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="mt-4 flex flex-wrap gap-2">
            <Badge variant="primary">{stats.students ?? 0} students</Badge>
            <Badge variant="secondary">{stats.teachers ?? 0} teachers</Badge>
            <Badge variant="warning">{stats.admins ?? 0} admins</Badge>
          </CardContent>
        </Card>
      </div>

      <Card variant="default" radius="lg" padding="none" className="overflow-hidden">
        <CardContent className="p-6">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent submissions</CardTitle>
              <CardDescription className="mt-1">The latest activity across the platform.</CardDescription>
            </div>
          </CardHeader>

          {isLoading ? (
            <div className="mt-5 flex flex-col gap-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : (data?.recent?.length ?? 0) === 0 ? (
            <EmptyState className="mt-5" title="No submissions yet" description="Platform activity will appear here once students start submitting." />
          ) : (
            <div className="mt-5 flex flex-col gap-3">
              {data.recent.map((item) => (
                <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-surface p-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{item.title}</div>
                    <div className="mt-1 text-xs text-muted">
                      {item.subject} · {item.studentId?.name ?? 'Student'} · {formatRelativeTime(item.submittedAt)}
                    </div>
                  </div>
                  <Badge variant={item.status === 'evaluated' ? 'success' : 'warning'}>
                    {item.status === 'evaluated' ? 'Evaluated' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard