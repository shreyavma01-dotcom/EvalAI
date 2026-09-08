import { motion } from 'framer-motion'
import { Check, Circle, GraduationCap, MessageSquareQuote, Target, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/utils/cn'

const MARKERS = {
  correct: { icon: Check, color: 'text-[#35B36E]', bg: 'bg-[#35B36E]/12 border-[#35B36E]/35', label: 'Correct', chip: 'bg-[#35B36E]/10 text-[#35B36E]' },
  partial: { icon: TriangleAlert, color: 'text-[#F4A62A]', bg: 'bg-[#F4A62A]/12 border-[#F4A62A]/40', label: 'Partial', chip: 'bg-[#F4A62A]/12 text-[#F4A62A]' },
  wrong: { icon: X, color: 'text-[#E15252]', bg: 'bg-[#E15252]/12 border-[#E15252]/35', label: 'Incorrect', chip: 'bg-[#E15252]/12 text-[#E15252]' },
  incorrect: { icon: X, color: 'text-[#E15252]', bg: 'bg-[#E15252]/12 border-[#E15252]/35', label: 'Incorrect', chip: 'bg-[#E15252]/12 text-[#E15252]' },
  unattempted: { icon: Circle, color: 'text-[#8FAAA0]', bg: 'bg-[#8FAAA0]/10 border-[#8FAAA0]/30', label: 'Not attempted', chip: 'bg-[#8FAAA0]/12 text-[#8FAAA0]' },
}

function Block({ label, value, empty }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8FAAA0]">{label}</span>
      <p className={cn('text-sm leading-7', value ? 'text-[#17332A]' : 'text-[#92A9A0]')}>
        {value || empty || '—'}
      </p>
    </div>
  )
}

export function QuestionReview({ questions }) {
  const items = questions ?? []

  return (
    <section className="rounded-[2rem] border border-[#D8ECE2] bg-white/85 p-6 shadow-[0_10px_32px_-18px_rgba(47,143,107,0.28)] backdrop-blur sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#17332A]">Question review</h2>
          <p className="text-sm text-[#5B746B]">Every detected question appears here with the teacher’s notes.</p>
        </div>
        <span className="rounded-full bg-[#F7FCF9] px-3 py-1 text-sm font-semibold text-[#2F8F6B]">{items.length} questions</span>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {items.map((answer, index) => {
          const marker = MARKERS[answer.status] ?? MARKERS.incorrect
          const Icon = marker.icon

          return (
            <motion.article
              key={answer.id ?? `${answer.questionNumber ?? index + 1}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * index }}
              className="rounded-3xl border border-[#D8ECE2] bg-[#FCFDFB] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={cn('grid size-10 place-items-center rounded-2xl border', marker.bg)}>
                    <Icon className={cn('size-4.5', marker.color)} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-[#17332A]">Question {answer.questionNumber ?? index + 1}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold', marker.chip)}>
                        {marker.label}
                      </span>
                      {answer.needsTeacherReview ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F4A62A]/15 px-2.5 py-1 text-[10px] font-semibold text-[#B45309]">
                          <GraduationCap className="size-3" /> Needs your review
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                {answer.page ? <span className="text-sm text-[#5B746B]">Page {answer.page}</span> : null}
              </div>

              {answer.needsTeacherReview && answer.reviewReason ? (
                <p className="mt-3 rounded-2xl border border-[#F4A62A]/30 bg-[#FFF8EC] px-3 py-2 text-sm text-[#8A5A12]">
                  <span className="font-semibold">Why this was escalated: </span>
                  {answer.reviewReason}
                </p>
              ) : null}

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Block label="Student answer" value={answer.studentAnswer} empty="No answer written" />
                <Block label="Corrected answer" value={answer.correctedAnswer} empty="No correction provided" />
              </div>

              <div className="mt-4 rounded-2xl border border-[#D8ECE2] bg-[#F7FCF9] p-4">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2F8F6B]">
                  <Target className="size-3.5" /> Teacher comment
                </div>
                <p className="mt-2 text-sm leading-7 text-[#17332A]">{answer.teacherComment || answer.whyWrong || 'The teacher note will appear here.'}</p>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8FAAA0]">
                    <MessageSquareQuote className="size-3.5" /> Why it needs work
                  </span>
                  <p className="text-sm leading-7 text-[#17332A]">{answer.whyWrong || 'The teacher’s explanation will appear here.'}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8FAAA0]">Suggestion</span>
                  <p className="text-sm leading-7 text-[#17332A]">{answer.suggestion || 'A small next step for revision will be added here.'}</p>
                </div>
              </div>

              {answer.missingPoints?.length ? (
                <div className="mt-4 rounded-2xl border border-[#D8ECE2] bg-white/70 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8FAAA0]">Missing points</div>
                  <ul className="mt-2 flex flex-col gap-2 text-sm text-[#17332A]">
                    {answer.missingPoints.map((point) => (
                      <li key={point} className="flex gap-2">
                        <span className="mt-1.5 size-1.5 rounded-full bg-[#2F8F6B]" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}

export default QuestionReview
