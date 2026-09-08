import { motion } from 'framer-motion'
import { BrainCircuit, CheckCircle2, Eye, GraduationCap, RefreshCw, ShieldCheck, Target, Wrench } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Agent Activity Timeline — renders the real structured trace of the
 * evaluation agent (goal → observe → decide → act → verify → adapt →
 * escalate → complete). Only concise, auditable summaries are shown; the
 * events come from the backend's agent:trace socket updates and from the
 * persisted agentTrace on the evaluation record.
 */
const EVENT_META = {
  goal: { icon: Target, label: 'Goal', chip: 'bg-[#2F8F6B]/15 text-[#7FD8AE]' },
  observation: { icon: Eye, label: 'Observed', chip: 'bg-[#2563EB]/15 text-[#93B7F5]' },
  decision: { icon: BrainCircuit, label: 'Decided', chip: 'bg-[#7C5CFC]/15 text-[#BBA9FB]' },
  action: { icon: Wrench, label: 'Acted', chip: 'bg-[#0E7490]/20 text-[#7CD3E4]' },
  verification: { icon: ShieldCheck, label: 'Verified', chip: 'bg-[#15803D]/20 text-[#8FE0AC]' },
  adaptation: { icon: RefreshCw, label: 'Adapted', chip: 'bg-[#B45309]/20 text-[#F0B26B]' },
  escalation: { icon: GraduationCap, label: 'Escalated', chip: 'bg-[#B45309]/25 text-[#F6C084]' },
  completion: { icon: CheckCircle2, label: 'Completed', chip: 'bg-[#35B36E]/15 text-[#8FE0AC]' },
}

function formatTime(timestamp) {
  const date = timestamp ? new Date(timestamp) : null
  if (!date || Number.isNaN(date.getTime())) return null
  return date.toLocaleTimeString([], { hour12: false })
}

export function AgentTimeline({ events = [], className }) {
  return (
    <div className={cn('rounded-3xl border border-[#D8ECE2] bg-[#0F231B] p-4', className)}>
      <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.24em] text-[#84B79D]">
        <span className="flex items-center gap-2">
          <BrainCircuit className="size-3.5" /> Agent activity
        </span>
        <span>{events.length ? `${events.length} steps` : 'Waiting'}</span>
      </div>

      {events.length === 0 ? (
        <p className="mt-3 text-sm text-[#9FD8BC]">
          The agent&apos;s observations, decisions and verifications will stream here in real time.
        </p>
      ) : (
        <div className="mt-3 flex max-h-72 flex-col gap-0 overflow-y-auto pr-1">
          {events.map((event, index) => {
            const meta = EVENT_META[event.type] ?? EVENT_META.verification
            const Icon = meta.icon
            const time = formatTime(event.timestamp)
            const isLast = index === events.length - 1

            return (
              <motion.div key={`${event.timestamp}-${index}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="relative flex gap-3 pb-3">
                {!isLast ? <span className="absolute left-[13px] top-8 h-[calc(100%-1.5rem)] w-px bg-white/10" /> : null}
                <span className={cn('grid size-7 shrink-0 place-items-center rounded-full', meta.chip)}>
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]', meta.chip)}>
                      {meta.label}
                    </span>
                    {event.step ? <span className="text-[10px] uppercase tracking-[0.18em] text-[#5E8B72]">{event.step}</span> : null}
                    {time ? <span className="ml-auto text-[10px] text-[#5E8B72]">{time}</span> : null}
                  </div>
                  {event.title ? <div className="mt-1 text-sm font-semibold text-[#DDF7E7]">{event.title}</div> : null}
                  {event.message ? <div className="mt-0.5 text-sm leading-6 text-[#B9DFC9]">{event.message}</div> : null}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AgentTimeline