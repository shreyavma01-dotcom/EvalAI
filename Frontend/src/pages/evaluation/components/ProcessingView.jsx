import { AnimatePresence, motion } from 'framer-motion'
import { BookOpenCheck, BrainCircuit, CheckCircle2, Loader2, RotateCcw, Sparkles, TriangleAlert } from 'lucide-react'
import { PHASES } from '../useEvaluation'
import { AgentTimeline } from './AgentTimeline'
import { cn } from '@/utils/cn'

function formatStageLabel(stage) {
  switch (stage) {
    case 'uploading':
      return 'Preparing images'
    case 'preparing':
      return 'Preparing images'
    case 'ocr':
      return 'Reading handwriting'
    case 'sending':
      return 'Understanding answers'
    case 'evaluating':
      return 'Evaluating responses'
    case 'annotating':
      return 'Drawing teacher annotations'
    case 'report':
      return 'Generating corrected sheet'
    default:
      return 'AI processing'
  }
}

export function ProcessingView({ phase, progress, logs, agentEvents = [], elapsed, canRun, onRun, onReset, hasFiles, error }) {
  const isProcessing = phase === PHASES.processing
  const isComplete = phase === PHASES.complete
  const isError = phase === PHASES.error

  return (
    <section className="rounded-[2rem] border border-[#D8ECE2] bg-white/85 p-6 shadow-[0_10px_32px_-18px_rgba(47,143,107,0.28)] backdrop-blur sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#2F8F6B] to-[#58C49B] text-white shadow-[0_10px_24px_-8px_rgba(47,143,107,0.55)]">
            <BrainCircuit className="size-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-[#17332A]">AI processing</h2>
            <p className="text-sm text-[#5B746B]">Real OCR and Gemini vision work from the handwritten pages.</p>
          </div>
        </div>
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.span
              key="running"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#2F8F6B]/10 px-2.5 py-1 text-xs font-semibold text-[#2F8F6B]"
            >
              <Loader2 className="size-3.5 animate-spin" /> Working
            </motion.span>
          ) : isComplete ? (
            <motion.span
              key="done"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#35B36E]/10 px-2.5 py-1 text-xs font-semibold text-[#35B36E]"
            >
              <CheckCircle2 className="size-3.5" /> Ready for review
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-6 rounded-3xl border border-[#D8ECE2] bg-[#F7FCF9] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 font-medium text-[#17332A]">
            <BookOpenCheck className="size-4 text-[#2F8F6B]" />
            {formatStageLabel(progress?.currentStep ? undefined : progress?.label)}
          </span>
          <span className="text-xs text-[#5B746B]">{elapsed ? `${elapsed}s` : 'Waiting'}</span>
        </div>
        <div className="mt-3 rounded-2xl border border-[#D8ECE2] bg-white/80 p-3">
          <p className="text-sm leading-6 text-[#17332A]">
            {isProcessing ? progress?.message || 'The teacher is reviewing the notebook now.' : isComplete ? 'The notebook has been reviewed and the corrected sheet is ready.' : hasFiles ? 'Upload complete. Start the teacher review to inspect every answer.' : 'Add handwritten pages to begin the teacher-style review.'}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={isComplete ? onReset : onRun}
          disabled={!canRun && !isComplete}
          className={cn(
            'flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all',
            isProcessing
              ? 'cursor-wait bg-[#17332A] text-white'
              : isComplete
                ? 'bg-gradient-to-r from-[#2F8F6B] to-[#58C49B] text-white shadow-[0_12px_28px_-12px_rgba(47,143,107,0.65)]'
                : canRun
                  ? 'bg-gradient-to-r from-[#2F8F6B] to-[#58C49B] text-white shadow-[0_12px_28px_-12px_rgba(47,143,107,0.65)]'
                  : 'cursor-not-allowed bg-[#DDEFE6] text-[#5B746B]',
          )}
        >
          {isProcessing ? <Loader2 className="size-4 animate-spin" /> : isComplete ? <Sparkles className="size-4" /> : <Sparkles className="size-4" />}
          {isProcessing ? 'Evaluating…' : isComplete ? 'Review again' : canRun ? 'Start teacher review' : 'Upload pages to begin'}
        </button>
        {isError ? (
          <div className="flex items-center justify-between rounded-2xl border border-[#E15252]/25 bg-[#FFF3F3] px-3 py-2 text-sm text-[#C03434]">
            <span>{error || 'The review could not be completed.'}</span>
            <button type="button" onClick={onReset} className="inline-flex items-center gap-1 font-semibold">
              <RotateCcw className="size-3.5" /> Retry
            </button>
          </div>
        ) : null}
      </div>

      <AgentTimeline events={agentEvents} className="mt-5" />

      <div className="mt-5 rounded-3xl border border-[#D8ECE2] bg-[#0F231B] p-4">
        <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.24em] text-[#84B79D]">
          <span>Live logs</span>
          <span>{logs.length ? `${logs.length} updates` : 'Waiting'}</span>
        </div>
        <div className="mt-3 flex max-h-56 flex-col gap-2 overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <p className="text-sm text-[#9FD8BC]">The live teacher notes will appear here as the review progresses.</p>
          ) : (
            logs.map((log, index) => (
              <motion.div
                key={`${log.message}-${index}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#DDF7E7]"
              >
                <div className="text-[10px] uppercase tracking-[0.22em] text-[#5E8B72]">
                  {log.time.toLocaleTimeString([], { hour12: false })}
                </div>
                <div className="mt-1">{log.message}</div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {isError ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#E15252]/20 bg-[#FFF5F5] px-3 py-3 text-sm text-[#C03434]">
          <TriangleAlert className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
    </section>
  )
}

export default ProcessingView
