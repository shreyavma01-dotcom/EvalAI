import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Badge } from '@/components/feedback/Badge'
import { Avatar } from '@/components/common/Avatar'
import { formatRelativeTime } from '@/utils/format'
import { cn } from '@/utils/cn'

const TYPE_STYLES = {
  success: 'bg-success-muted text-success-strong',
  warning: 'bg-warning-muted text-warning-strong',
  danger: 'bg-danger-muted text-danger-strong',
  info: 'bg-info-muted text-info-strong',
  neutral: 'bg-background-soft text-muted',
}

/**
 * Activity feed card — icon, headline, timestamp, optional avatar.
 */
export function ActivityCard({ title, items = [], badgeLabel, className }) {
  return (
    <Card variant="default" radius="lg" padding="none" className={cn('overflow-hidden', className)}>
      <CardHeader className="flex-row items-center justify-between px-5 pt-5">
        <CardTitle className="text-base">{title}</CardTitle>
        {badgeLabel ? <Badge variant="neutral" size="sm">{badgeLabel}</Badge> : null}
      </CardHeader>
      <CardContent className="px-2 pb-3 pt-1">
        <motion.ul initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }} className="flex flex-col">
          {items.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.li
                key={item.id ?? index}
                variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-background-soft/60"
              >
                <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', TYPE_STYLES[item.tone ?? 'neutral'])}>
                  {Icon ? <Icon className="size-4" /> : null}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{item.title}</span>
                  {item.description ? <span className="truncate text-xs text-muted">{item.description}</span> : null}
                  <span className="text-[11px] text-subtle">{formatRelativeTime(item.time)}</span>
                </span>
                {item.avatar ? <Avatar {...item.avatar} size="sm" className="mt-0.5" /> : null}
              </motion.li>
            )
          })}
        </motion.ul>
      </CardContent>
    </Card>
  )
}

export default ActivityCard
