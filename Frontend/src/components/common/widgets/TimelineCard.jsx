import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { formatRelativeTime } from '@/utils/format'
import { cn } from '@/utils/cn'

const DOT_TONES = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  neutral: 'bg-muted',
}

/**
 * Vertical timeline card with animated dots and items.
 */
export function TimelineCard({ title = 'Timeline', description, items = [], className }) {
  return (
    <Card variant="default" radius="lg" padding="none" className={cn('overflow-hidden', className)}>
      <CardHeader className="flex-row items-center justify-between px-5 pt-5">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-base">{title}</CardTitle>
          {description ? <span className="text-xs text-muted">{description}</span> : null}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-2">
        <motion.ol initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }} className="relative flex flex-col">
          <span className="absolute bottom-2 left-[5px] top-2 w-px bg-border" aria-hidden="true" />
          {items.map((item, index) => (
            <motion.li
              key={item.id ?? index}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              className="relative flex gap-4 pb-5 last:pb-0"
            >
              <span className={cn('relative mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-surface', DOT_TONES[item.tone ?? 'primary'])} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{item.title}</span>
                  {item.time ? <span className="shrink-0 text-[11px] text-subtle">{formatRelativeTime(item.time)}</span> : null}
                </div>
                {item.description ? <span className="text-xs text-muted">{item.description}</span> : null}
                {item.action}
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </CardContent>
    </Card>
  )
}

export default TimelineCard
