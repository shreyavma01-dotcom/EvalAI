import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Lock,
  LockOpen,
  RotateCcw,
  Send,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { useEvaluation, PHASES } from './useEvaluation'
import { teacherApi } from '@/services/submissions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/feedback/Badge'
import { UploadCard } from './components/UploadCard'
import { ProcessingView } from './components/ProcessingView'
import { AnnotatedSheetViewer } from './components/AnnotatedSheetViewer'
import { QuestionReview } from './components/QuestionReview'
import { TeacherFeedback } from './components/TeacherFeedback'
import { DownloadCard } from './components/DownloadCard'
import { formatRelativeTime } from '@/utils/format'

const STEPS = [
  'Upload answer sheets',
  'AI processing',
  'Annotated sheets',
  'Question review',
  'Teacher feedback',
  'Download corrected sheets',
]

/**
 * The AI teacher evaluation workspace. Teacher-only — mounted behind the
 * /teacher/evaluation/:submissionId protected route. When opened from a
 * submission it auto-loads the student's answer sheets, runs the existing AI
 * evaluation automatically, guards the uploaded sheets behind a "Replace
 * Sheet" toggle and lets the teacher award/publish the final marks.
 */
export function EvaluationStudioPage({ initialFiles = null, submissionId, submission = null, autoRun = false }) {
  const { phase, files, setFiles, progress, logs, result, elapsed, error, run, reset, canRun } = useEvaluation()
  const hydrated = useRef(false)
  const autoRan = useRef(false)
  const [replaceMode, setReplaceMode] = useState(false)
  const [published, setPublished] = useState(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!initialFiles?.length || hydrated.current || phase !== PHASES.idle) return
    hydrated.current = true
    setFiles(initialFiles)
  }, [initialFiles, phase, setFiles])

  // Auto-run the existing AI pipeline once the submission's sheets are loaded.
  useEffect(() => {
    if (!autoRun || autoRan.current || !canRun) return
    autoRan.current = true
    run()
  }, [autoRun, canRun, run])

  const publishForm = useForm({
    defaultValues: {
      marks: typeof submission?.teacherMarks === 'number' ? String(submission.teacherMarks) : '',
      feedback: submission?.teacherFeedback ?? '',
      remarks: submission?.teacherRemarks ?? '',
    },
  })

  const publishEvaluation = useMutation({
    mutationFn: (values) =>
      teacherApi.publishEvaluation({
        id: submissionId,
        marks: Number(values.marks),
        feedback: values.feedback,
        remarks: values.remarks,
      }),
    onSuccess: (updated) => {
      setPublished(updated)
      queryClient.invalidateQueries({ queryKey: ['teacher-submissions'] })
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] })
      if (submissionId) queryClient.invalidateQueries({ queryKey: ['teacher-submission', submissionId] })
      toast.success('Result published. The student has been notified.')
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? 'Failed to publish the result.')
    },
  })

  const isProcessing = phase === PHASES.processing
  const isComplete = phase === PHASES.complete
  const isError = phase === PHASES.error
  const hasFiles = files.length > 0
  const fromSubmission = Boolean(initialFiles?.length)
  const uploadDisabled = isProcessing || (fromSubmission && !replaceMode)

  const aiTotal = useMemo(() => {
    if (!result) return null
    if (typeof result.aiScore === 'number') return result.aiScore
    const sum = result.questions.reduce(
      (acc, q) => acc + (typeof q.obtainedMarks === 'number' ? q.obtainedMarks : 0),
      0,
    )
    return result.questions.length ? sum : null
  }, [result])

  const acceptAiMarks = () => {
    publishForm.setValue('marks', aiTotal != null ? String(aiTotal) : '')
    publishForm.setValue('feedback', result?.teacherFeedback ?? submission?.teacherFeedback ?? '')
  }

  const alreadyEvaluated = submission?.status === 'evaluated' && published === null

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      {submissionId ? (
        <Link
          to={`/teacher/submission/${submissionId}`}
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to submission
        </Link>
      ) : null}

      <header className="flex flex-col gap-3 rounded-[2rem] border border-[#D8ECE2] bg-white/80 p-6 shadow-[0_10px_32px_-18px_rgba(47,143,107,0.28)] backdrop-blur sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#2F8F6B] to-[#58C49B] text-white shadow-[0_10px_24px_-8px_rgba(47,143,107,0.55)]">
              <Sparkles className="size-5.5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#17332A] sm:text-3xl">AI Teacher Answer Sheet Evaluation</h1>
              <p className="mt-1 text-sm text-[#5B746B]">
                A notebook-style review experience powered by Gemini Flash Vision.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#D8ECE2] px-3.5 py-2 text-sm font-semibold text-[#5B746B] transition-colors hover:border-[#58C49B] hover:bg-[#EAF8F0] hover:text-[#17332A]"
          >
            <RotateCcw className="size-3.5" /> Start over
          </button>
        </div>

        {submission ? (
          <div className="mt-1 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D8ECE2] bg-[#F7FCF9] px-4 py-3.5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-bold text-[#17332A]">{submission.title}</h2>
                <Badge variant={submission.status === 'evaluated' ? 'success' : 'warning'}>
                  {submission.status === 'evaluated' ? 'Evaluated' : 'Pending review'}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-[#5B746B]">
                {submission.subject} · submitted {formatRelativeTime(submission.submittedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl border border-[#D8ECE2] bg-white px-3.5 py-2">
              <span className="grid size-8 place-items-center rounded-xl bg-[#EAF8F0] text-[#2F8F6B]">
                <UserRound className="size-4" />
              </span>
              <div>
                <div className="text-sm font-semibold text-[#17332A]">{submission.studentId?.name ?? 'Student'}</div>
                <div className="text-xs text-[#5B746B]">{submission.studentId?.email ?? ''}</div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-2">
          {STEPS.map((step, index) => {
            const active = index <= (isComplete ? STEPS.length - 1 : isProcessing ? 1 : hasFiles ? 0 : 0)
            return (
              <span
                key={step}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${active ? 'bg-[#EAF8F0] text-[#2F8F6B]' : 'bg-[#F7FCF9] text-[#5B746B]'}`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em]">Step {index + 1}</span>
                {step}
                {index < STEPS.length - 1 ? <ArrowRight className="size-3.5" /> : null}
              </span>
            )
          })}
        </div>
      </header>

      {fromSubmission ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D8ECE2] bg-[#F7FCF9] px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-[#2F8F6B]">
            {replaceMode ? <LockOpen className="size-4" /> : <Lock className="size-4" />}
            {replaceMode
              ? 'Replacement enabled — you can add, remove or reorder the pages.'
              : 'Answer sheets loaded from the student’s submission. Reviewing in place.'}
          </p>
          <button
            type="button"
            onClick={() => setReplaceMode((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#58C49B]/60 bg-white px-3.5 py-2 text-sm font-semibold text-[#2F8F6B] transition-colors hover:border-[#2F8F6B]/70 hover:bg-[#EAF8F0]"
          >
            {replaceMode ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
            {replaceMode ? 'Lock sheets' : 'Replace Sheet'}
          </button>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-5">
          <UploadCard files={files} onFiles={setFiles} disabled={uploadDisabled} />
          {submission?.questionPaper?.length ? (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#D8ECE2] bg-white/80 px-4 py-3 backdrop-blur">
              <FileText className="size-4 text-[#5B746B]" />
              <span className="text-xs font-semibold text-[#5B746B]">Question paper:</span>
              {submission.questionPaper.map((sheet) => (
                <a
                  key={sheet.fileUrl}
                  href={sheet.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-[#D8ECE2] bg-[#F7FCF9] px-2.5 py-1 text-xs font-medium text-[#2F8F6B] transition-colors hover:bg-[#EAF8F0]"
                >
                  {sheet.originalName}
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <ProcessingView
          phase={phase}
          progress={progress}
          logs={logs}
          elapsed={elapsed}
          canRun={canRun}
          onRun={run}
          onReset={reset}
          hasFiles={hasFiles}
          error={error}
        />
      </div>

      <AnimatePresence>
        {isError ? (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-[2rem] border border-[#E15252]/25 bg-[#FFF5F5] p-5 text-sm text-[#C03434]"
          >
            {error || 'The review could not be completed. Please try again.'}
          </motion.section>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isComplete && result ? (
          <motion.div
            key="teacher-review"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-5"
          >
            <div className="flex items-center gap-2 rounded-[2rem] border border-[#D8ECE2] bg-[#F7FCF9] px-4 py-3 text-sm text-[#2F8F6B]">
              <BookOpenCheck className="size-4" />
              The notebook has been reviewed and the corrected pages are ready for your attention.
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <AnnotatedSheetViewer pages={result.pages} questions={result.questions} />
              <div className="flex flex-col gap-5">
                <QuestionReview questions={result.questions} />
                <TeacherFeedback feedback={result.teacherFeedback} topicsToImprove={result.topicsToImprove} />
              </div>
            </div>

            <DownloadCard evaluationId={result.id} correctedPdfUrl={result.correctedPdfUrl} />

            {submissionId ? (
              published ? (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-3 rounded-[2rem] border border-[#35B36E]/25 bg-[#F0FBF4] p-5"
                >
                  <div className="flex items-center gap-2 text-[#1E7A43]">
                    <CheckCircle2 className="size-5" />
                    <h3 className="text-base font-bold">Result published</h3>
                  </div>
                  <p className="text-sm text-[#5B746B]">
                    Marked {published.teacherMarks} — the student has been notified. The final report is stored with the
                    submission.
                  </p>
                  {published.reportUrl ? (
                    <a
                      href={published.reportUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#2F8F6B] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#277C5B]"
                    >
                      <FileText className="size-4" /> Download the report PDF
                    </a>
                  ) : null}
                  <Link
                    to={`/teacher/submission/${submissionId}`}
                    className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#2F8F6B] hover:underline"
                  >
                    <ArrowRight className="size-4" /> View the published submission
                  </Link>
                </motion.section>
              ) : (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[2rem] border border-[#D8ECE2] bg-white/85 p-5 backdrop-blur sm:p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid size-9 place-items-center rounded-xl bg-[#EAF8F0] text-[#2F8F6B]">
                        <Send className="size-4" />
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-[#17332A]">Publish evaluation</h3>
                        <p className="text-xs text-[#5B746B]">Award the final marks and send the result to the student.</p>
                      </div>
                    </div>
                    {alreadyEvaluated ? <Badge variant="info">Already evaluated — you can refine</Badge> : null}
                  </div>

                  {aiTotal != null ? (
                    <p className="mt-3 rounded-xl border border-[#D8ECE2] bg-[#F7FCF9] px-3 py-2 text-sm text-[#5B746B]">
                      Gemini suggests <span className="font-bold text-[#2F8F6B]">{aiTotal}</span> marks for this
                      submission. Adjust or accept below.
                    </p>
                  ) : null}

                  <form
                    onSubmit={publishForm.handleSubmit((values) => publishEvaluation.mutate(values))}
                    className="mt-4 flex flex-col gap-4"
                    noValidate
                  >
                    <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        size="xl"
                        label="Teacher final marks"
                        placeholder={aiTotal != null ? `AI suggests ${aiTotal}` : '0'}
                        error={publishForm.formState.errors.marks?.message}
                        {...publishForm.register('marks', {
                          required: 'Marks are required.',
                          min: { value: 0, message: 'Marks cannot be negative.' },
                        })}
                      />
                      <div className="flex items-end">
                        <Button type="button" variant="soft" size="xl" className="w-full sm:w-auto" onClick={acceptAiMarks}>
                          <ClipboardCheck className="size-4" /> Accept AI marks
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      label="Teacher feedback"
                      rows={3}
                      placeholder="Write a short, encouraging note for the student."
                      error={publishForm.formState.errors.feedback?.message}
                      {...publishForm.register('feedback', { required: 'Feedback is required.' })}
                    />
                    <Textarea
                      label="Remarks (visible to teachers only)"
                      rows={2}
                      placeholder="Optional internal notes about this submission."
                      {...publishForm.register('remarks')}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <span className="text-xs text-[#8FAAA0]">The student is notified instantly via Socket.IO.</span>
                      <Button type="submit" size="xl" loading={publishEvaluation.isPending}>
                        <Send className="size-4" /> Publish result
                      </Button>
                    </div>
                  </form>
                </motion.section>
              )
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export const EvaluationPage = EvaluationStudioPage

export default EvaluationStudioPage