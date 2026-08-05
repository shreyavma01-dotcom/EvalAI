import { useQuery } from '@tanstack/react-query'
import { BarChart3, CheckCircle2, ClipboardCheck, FolderOpen } from 'lucide-react'
import { teacherApi } from '@/services/submissions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card'
import { StatCard } from '@/components/common/widgets/StatCard'
import { Skeleton } from '@/components/feedback/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState'
import { AreaChart, BarChart, DonutChart } from '@/components/charts/Charts'
import { formatDate } from '@/utils/format'

/**
 * Analytics dashboard. Uses the existing /teacher/analytics aggregation —
 * submission status, subject breakdown and recent score trends.
 */
export function AnalyticsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['teacher-analytics'], queryFn: teacherApi.analytics })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full rounded-3xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 w-full rounded-3xl" />
          <Skeleton className="h-72 w-full rounded-3xl" />
        </div>
      </div>
    )
  }

  const info = data ?? {}
  const distribution = info.statusDistribution ?? { pending: 0, evaluated: 0 }
  const subjects = Array.isArray(info.subjects) ? info.subjects : []
  const recent = Array.isArray(info.recentScores) ? info.recentScores : []

  const statusDonut = [
    { label: 'Evaluated', value: distribution.evaluated ?? 0 },
    { label: 'Pending', value: distribution.pending ?? 0 },
  ]

  const subjectBars = subjects.map((s) => ({
    label: s.subject,
    Total: s.total ?? 0,
    Evaluated: s.evaluated ?? 0,
  }))

  const trend = recent.map((s) => ({
    label: s.title.length > 18 ? `${s.title.slice(0, 18)}…` : s.title,
    value: s.marks ?? 0,
  }))

  const avg = recent.length
    ? (recent.reduce((acc, s) => acc + (s.marks ?? 0), 0) / recent.length).toFixed(1)
    : '0'

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#0F766E] to-[#22C55E] text-white">
            <BarChart3 className="size-4.5" />
          </span>
          Analytics
        </h1>
        <p className="mt-1.5 text-sm text-muted">Aggregated view of submissions, performance and subject coverage.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending" value={distribution.pending ?? 0} icon={ClipboardCheck} tone="warning" />
        <StatCard label="Evaluated" value={distribution.evaluated ?? 0} icon={CheckCircle2} tone="success" />
        <StatCard label="Subjects covered" value={subjects.length} icon={FolderOpen} tone="primary" />
        <StatCard label="Avg recent marks" value={Number(avg)} suffix="/ total" icon={BarChart3} tone="info" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card variant="default" radius="lg" padding="lg">
          <CardHeader>
            <CardTitle className="text-base">Status distribution</CardTitle>
            <CardDescription className="mt-1">Pending vs evaluated submissions.</CardDescription>
          </CardHeader>
          <CardContent className="mt-2 flex items-center justify-center">
            {statusDonut.some((d) => d.value > 0) ? (
              <DonutChart data={statusDonut} xKey="label" yKey="value" size={200} thickness={26} />
            ) : (
              <EmptyState icon={BarChart3} title="No data yet" description="Evaluate a submission to see the breakdown." />
            )}
          </CardContent>
        </Card>

        <Card variant="default" radius="lg" padding="lg">
          <CardHeader>
            <CardTitle className="text-base">Subjects</CardTitle>
            <CardDescription className="mt-1">Submissions per subject with the evaluated share.</CardDescription>
          </CardHeader>
          <CardContent className="mt-2">
            {subjectBars.length > 0 ? (
              <BarChart
                data={subjectBars}
                xKey="label"
                series={[
                  { key: 'Total', name: 'Total' },
                  { key: 'Evaluated', name: 'Evaluated' },
                ]}
                height={228}
              />
            ) : (
              <EmptyState icon={BarChart3} title="No submissions" description="Subject data appears after uploads." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card variant="default" radius="lg" padding="lg">
        <CardHeader>
          <CardTitle className="text-base">Recent score trend</CardTitle>
          <CardDescription className="mt-1">Teacher marks on the last 12 evaluated submissions.</CardDescription>
        </CardHeader>
        <CardContent className="mt-2">
          {trend.length > 0 ? (
            <AreaChart data={trend} xKey="label" series={[{ key: 'value', name: 'Marks' }]} height={220} />
          ) : (
            <EmptyState icon={BarChart3} title="No scores yet" description="Recent scores appear once you publish results." />
          )}
        </CardContent>
      </Card>

      {recent.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((s) => (
            <div key={`${s.title}-${s.date}`} className="rounded-2xl border border-border/60 bg-surface p-4">
              <div className="truncate text-sm font-semibold text-foreground">{s.title}</div>
              <div className="mt-1 text-xs text-muted">{s.subject}</div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xl font-bold tracking-tight text-foreground">{s.marks}</span>
                <span className="text-xs text-muted">{s.date ? formatDate(s.date, 'date') : ''}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default AnalyticsPage