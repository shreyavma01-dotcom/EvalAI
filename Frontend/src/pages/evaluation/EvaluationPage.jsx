import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BookOpenCheck, RotateCcw, Sparkles } from 'lucide-react'
import { useEvaluation, PHASES } from './useEvaluation'
import { UploadCard } from './components/UploadCard'
import { ProcessingView } from './components/ProcessingView'
import { AnnotatedSheetViewer } from './components/AnnotatedSheetViewer'
import { QuestionReview } from './components/QuestionReview'
import { TeacherFeedback } from './components/TeacherFeedback'
import { DownloadCard } from './components/DownloadCard'

const STEPS = [
  'Upload answer sheets',
  'AI processing',
  'Annotated sheets',
  'Question review',
  'Teacher feedback',
  'Download corrected sheets',
]

export function EvaluationPage() {
  const { phase, files, setFiles, progress, logs, result, elapsed, error, run, reset, canRun } = useEvaluation()

  const isProcessing = phase === PHASES.processing
  const isComplete = phase === PHASES.complete
  const isError = phase === PHASES.error
  const hasFiles = files.length > 0

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-3 rounded-[2rem] border border-[#D8ECE2] bg-white/80 p-6 shadow-[0_10px_32px_-18px_rgba(47,143,107,0.28)] backdrop-blur sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#2F8F6B] to-[#58C49B] text-white shadow-[0_10px_24px_-8px_rgba(47,143,107,0.55)]">
              <Sparkles className="size-5.5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#17332A] sm:text-3xl">AI Teacher Answer Sheet Evaluation</h1>
              <p className="mt-1 text-sm text-[#5B746B]">
                A notebook-style review experience powered by Gemini 2.5 Flash Vision.
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

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <UploadCard files={files} onFiles={setFiles} disabled={isProcessing} />
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
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default EvaluationPage
