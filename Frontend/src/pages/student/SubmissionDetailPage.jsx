import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Download, FileText, Sparkles, Target } from 'lucide-react'
import { studentApi } from '@/services/submissions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card'
import { Badge } from '@/components/feedback/Badge'
import { Skeleton } from '@/components/feedback/Skeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { AnnotatedSheetViewer } from '@/pages/evaluation/components/AnnotatedSheetViewer'
import { QuestionReview } from '@/pages/evaluation/components/QuestionReview'
import { formatDate } from '@/utils/format'

export function SubmissionDetailPage() {
  const { id } = useParams()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-result', id],
    queryFn: () => studentApi.result(id),
    enabled: Boolean(id),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full rounded-3xl" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <ErrorState title="Result not found" description="This evaluated submission is unavailable or was removed.">
        <Link to="/student/results" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="size-4" /> Back to results
        </Link>
      </ErrorState>
    )
  }

  const ai = data.aiEvaluation ?? {}
  const questions = Array.isArray(ai.questions) ? ai.questions : []
  const pages = Array.isArray(ai.pages) ? ai.pages : []
  const teacher = data.teacherId ?? {}

  return (
    <div className="flex flex-col gap-5">
      <Link to="/student/results" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to results
      </Link>

      <Card variant="gradient" radius="xl" padding="lg">
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{data.title}</h1>
              <Badge variant="success">Evaluated</Badge>
            </div>
            <CardDescription className="mt-2">
              {data.subject} · evaluated {formatDate(data.evaluatedAt, 'datetime')}
              {teacher?.name ? <> · reviewed by {teacher.name}</> : null}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end">
            {typeof data.teacherMarks === 'number' ? (
              <span className="text-4xl font-bold tracking-tight text-foreground">{data.teacherMarks}</span>
            ) : null}
            <span className="text-xs text-muted">teacher score</span>
          </div>
        </CardContent>
      </Card>

      {questions.length > 0 || pages.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          {pages.length > 0 ? <AnnotatedSheetViewer pages={pages} questions={questions} /> : null}
          <div className="flex flex-col gap-5">
            {questions.length > 0 ? <QuestionReview questions={questions} /> : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <Card variant="default" radius="lg" padding="lg">
          <CardHeader className="flex-row items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary-muted text-primary-strong">
              <Sparkles className="size-4.5" />
            </span>
            <div>
              <CardTitle className="text-base">Teacher feedback</CardTitle>
              <CardDescription className="mt-0.5">The note written for you when the result was published.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="mt-4">
            <p className="text-[15px] leading-7 text-foreground">{data.teacherFeedback || 'No teacher feedback was added for this submission.'}</p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-5">
          <Card variant="default" radius="lg" padding="lg">
            <CardHeader className="flex-row items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-secondary-muted text-secondary-strong">
                <Target className="size-4.5" />
              </span>
              <div>
                <CardTitle className="text-base">Topics to improve</CardTitle>
                <CardDescription className="mt-0.5">Areas highlighted by the AI teacher.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="mt-4">
              {ai.topicsToImprove?.length ? (
                <div className="flex flex-wrap gap-2">
                  {ai.topicsToImprove.map((topic) => (
                    <Badge key={topic} variant="primary-soft">
                      {topic}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No focus areas were flagged.</p>
              )}
            </CardContent>
          </Card>

          <Card variant="default" radius="lg" padding="lg">
            <CardHeader className="flex-row items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-success-muted text-success-strong">
                <FileText className="size-4.5" />
              </span>
              <div>
                <CardTitle className="text-base">Download</CardTitle>
                <CardDescription className="mt-0.5">The marked sheet and notes in one PDF.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="mt-4">
              {data.reportUrl ? (
                <a
                  href={data.reportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-medium transition-all hover:bg-primary-strong"
                >
                  <Download className="size-4" /> Download report
                </a>
              ) : (
                <p className="text-sm text-muted">{data.teacherRemarks || 'No report download is available for this submission.'}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SubmissionDetailPage