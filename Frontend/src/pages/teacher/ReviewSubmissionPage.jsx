import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ArrowLeft, CheckCircle2, FileText, Send, Sparkles, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { teacherApi } from '@/services/submissions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card'
import { Badge } from '@/components/feedback/Badge'
import { Skeleton } from '@/components/feedback/Skeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { AnnotatedSheetViewer } from '@/pages/evaluation/components/AnnotatedSheetViewer'
import { QuestionReview } from '@/pages/evaluation/components/QuestionReview'
import { formatDate, formatRelativeTime } from '@/utils/format'

function AiSummary({ ai }) {
  const counts = ai.statusCounts ?? {}
  const summary = [
    { label: 'Correct', value: counts.correct ?? 0, tone: 'success' },
    { label: 'Partial', value: counts.partial ?? 0, tone: 'warning' },
    { label: 'Incorrect', value: counts.incorrect ?? 0, tone: 'danger' },
    { label: 'Not attempted', value: counts.unattempted ?? 0, tone: 'neutral' },
  ]
  return (
    <div className="flex flex-wrap items-center gap-3">
      {typeof ai.score === 'number' ? (
        <div className="flex flex-col items-center rounded-2xl bg-primary-muted px-4 py-2.5">
          <span className="text-xl font-bold tracking-tight text-primary-strong">{ai.score}</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted">AI score</span>
        </div>
      ) : null}
      {summary.map(({ label, value, tone }) => (
        <div key={label} className="flex flex-col items-center rounded-2xl bg-background-soft px-4 py-2.5">
          <span className="text-lg font-bold tracking-tight text-foreground">{value}</span>
          <span className={tone === 'success' ? 'text-[10px] uppercase tracking-[0.2em] text-success-strong' : tone === 'warning' ? 'text-[10px] uppercase tracking-[0.2em] text-warning-strong' : tone === 'danger' ? 'text-[10px] uppercase tracking-[0.2em] text-danger-strong' : 'text-[10px] uppercase tracking-[0.2em] text-muted'}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ReviewSubmissionPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [published, setPublished] = useState(null)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['teacher-submission', id],
    queryFn: () => teacherApi.submission(id),
    enabled: Boolean(id),
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: { marks: '', feedback: '', remarks: '' } })

  const publish = useMutation({
    mutationFn: (values) => teacherApi.publishEvaluation({ id, ...values }),
    onSuccess: (submission) => {
      setPublished(submission)
      queryClient.invalidateQueries({ queryKey: ['teacher-submissions'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] })
      toast.success('Result published. The student has been notified.')
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? 'Failed to publish the result.')
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-28 w-full rounded-3xl" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <ErrorState title="Submission not found" description="This submission is unavailable or was removed.">
        <Link to="/teacher/submissions" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="size-4" /> Back to review queue
        </Link>
      </ErrorState>
    )
  }

  const ai = data.aiEvaluation ?? {}
  const questions = Array.isArray(ai.questions) ? ai.questions : []
  const pages = Array.isArray(ai.pages) ? ai.pages : []
  const isEvaluated = data.status === 'evaluated' && published === null
  const aiTotal = ai.percentage ?? null

  const onOpenPublish = () => {
    if (isEvaluated && typeof data.teacherMarks === 'number') setValue('marks', String(data.teacherMarks))
    if (isEvaluated && data.teacherFeedback) setValue('feedback', data.teacherFeedback)
    if (isEvaluated && data.teacherRemarks) setValue('remarks', data.teacherRemarks)
  }

  const onSubmit = (values) => {
    publish.mutate({
      marks: Number(values.marks),
      feedback: values.feedback,
      remarks: values.remarks,
    })
  }

  const showResult = published ?? (isEvaluated ? { teacherMarks: data.teacherMarks, teacherFeedback: data.teacherFeedback, teacherRemarks: data.teacherRemarks, reportUrl: data.reportUrl } : null)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/teacher/submissions" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to review queue
        </Link>
        <Link
          to={`/teacher/evaluation/${id}`}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-muted px-3.5 py-2 text-sm font-semibold text-primary-strong transition-colors hover:bg-primary/15"
        >
          <Sparkles className="size-4" /> Open AI evaluation studio
        </Link>
      </div>

      <Card variant="gradient" radius="xl" padding="lg">
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{data.title}</h1>
              <Badge variant={data.status === 'evaluated' ? 'success' : 'warning'}>
                {data.status === 'evaluated' ? 'Evaluated' : 'Pending review'}
              </Badge>
            </div>
            <CardDescription className="mt-2">
              {data.subject} · submitted {formatRelativeTime(data.submittedAt)}
              {data.evaluatedAt ? <> · evaluated {formatDate(data.evaluatedAt, 'datetime')}</> : null}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-background-soft px-4 py-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-primary-muted text-primary-strong">
              <UserRound className="size-4" />
            </span>
            <div>
              <div className="text-sm font-semibold text-foreground">{data.studentId?.name ?? 'Student'}</div>
              <div className="text-xs text-muted">{data.studentId?.email ?? ''}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {data.description ? (
        <Card variant="default" radius="lg" padding="md">
          <CardDescription>{data.description}</CardDescription>
        </Card>
      ) : null}

      {ai.status === 'completed' && (questions.length > 0 || pages.length > 0) ? (
        <>
          <Card variant="default" radius="lg" padding="lg">
            <CardHeader>
              <CardTitle className="text-base">AI preview</CardTitle>
              <CardDescription className="mt-1">Machine reading before you publish the final result.</CardDescription>
            </CardHeader>
            <CardContent className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <AiSummary ai={ai} />
              {typeof aiTotal === 'number' ? (
                <div className="flex flex-col items-center rounded-2xl border border-border px-4 py-2.5">
                  <span className="text-xl font-bold tracking-tight text-foreground">{aiTotal}%</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted">match</span>
                </div>
              ) : null}
            </CardContent>
            {ai.topicsToImprove?.length ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-4">
                <span className="text-xs font-semibold text-muted">Flags:</span>
                {ai.topicsToImprove.map((topic) => (
                  <Badge key={topic} variant="warning">
                    {topic}
                  </Badge>
                ))}
              </div>
            ) : null}
          </Card>

          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            {pages.length > 0 ? <AnnotatedSheetViewer pages={pages} questions={questions} /> : null}
            {questions.length > 0 ? <QuestionReview questions={questions} /> : null}
          </div>
        </>
      ) : ai.status === 'running' ? (
        <Card variant="default" radius="lg" padding="lg">
          <CardHeader>
            <CardTitle className="text-base">AI evaluation in progress</CardTitle>
            <CardDescription className="mt-1">
              The machine is still reading the sheets. You can publish a manual result below or wait for the preview.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-3">
            <Badge variant="info">Evaluating…</Badge>
          </CardContent>
        </Card>
      ) : null}

      {data.answerSheet?.length ? (
        <Card variant="default" radius="lg" padding="lg">
          <CardHeader className="flex-row items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-background-soft text-muted">
              <FileText className="size-4.5" />
            </span>
            <div>
              <CardTitle className="text-base">Original sheets</CardTitle>
              <CardDescription className="mt-0.5">The files the student uploaded.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="mt-4 flex flex-wrap gap-2">
            {data.answerSheet.map((sheet) => (
              <a
                key={sheet.fileUrl}
                href={sheet.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-border/60 bg-surface px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                {sheet.originalName}
              </a>
            ))}
            {data.questionPaper?.map((sheet) => (
              <a
                key={sheet.fileUrl}
                href={sheet.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-dashed border-border bg-surface px-3 py-2 text-xs font-medium text-muted transition-colors hover:text-primary"
              >
                {sheet.originalName}
              </a>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {showResult ? (
        <Card variant="success" radius="lg" padding="lg">
          <CardHeader className="flex-row items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-success-muted text-success-strong">
              <CheckCircle2 className="size-4.5" />
            </span>
            <div>
              <CardTitle className="text-base">Published result</CardTitle>
              <CardDescription className="mt-0.5">This is what the student sees.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl bg-background-soft px-4 py-3">
              <span className="text-2xl font-bold tracking-tight text-foreground">{showResult.teacherMarks}</span>
              <span className="text-xs text-muted">marks awarded</span>
            </div>
            <div className="rounded-2xl bg-background-soft px-4 py-3 text-sm text-foreground">
              {showResult.teacherFeedback || 'No feedback written.'}
            </div>
            {showResult.reportUrl ? (
              <a
                href={showResult.reportUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-medium transition-all hover:bg-primary-strong sm:col-span-2"
              >
                <FileText className="size-4" /> Download the report PDF
              </a>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {!showResult ? (
        <Card variant="default" radius="lg" padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="size-4.5 text-muted" /> Publish your verdict
            </CardTitle>
            <CardDescription className="mt-1">Award marks, write feedback and send the result to the student.</CardDescription>
          </CardHeader>
          <CardContent className="mt-5">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  label="Marks awarded"
                  placeholder={typeof ai.score === 'number' ? `AI suggests ${ai.score}` : '0'}
                  error={errors.marks?.message}
                  onClick={onOpenPublish}
                  {...register('marks', {
                    required: 'Marks are required.',
                    min: { value: 0, message: 'Marks cannot be negative.' },
                  })}
                />
                <div className="flex items-end pb-1">
                  <Button type="button" variant="soft" size="lg" className="w-full" onClick={onOpenPublish}>
                    Pre-fill from AI preview
                  </Button>
                </div>
              </div>
              <Textarea
                label="Feedback to the student"
                rows={3}
                placeholder="Write a short, encouraging note."
                error={errors.feedback?.message}
                {...register('feedback', { required: 'Feedback is required.' })}
              />
              <Textarea
                label="Private remarks (visible to teachers only)"
                rows={2}
                placeholder="Optional internal notes about this submission."
                {...register('remarks')}
              />
              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-xs text-muted">The student will be notified instantly.</span>
                <Button type="submit" size="lg" loading={publish.isPending}>
                  <Send className="size-4" /> Publish result
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

export default ReviewSubmissionPage