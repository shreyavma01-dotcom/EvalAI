import { motion } from 'framer-motion'
import { Bell, CheckCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card'
import { Badge } from '@/components/feedback/Badge'
import { Button } from '@/components/ui/Button'
import { formatRelativeTime } from '@/utils/format'
import { cn } from '@/utils/cn'

const TONE_STYLES = {
  success: 'bg-success-muted text-success-strong',
  warning: 'bg-warning-muted text-warning-strong',
  danger: 'bg-danger-muted text-danger-strong',
  info: 'bg-info-muted text-info-strong',
  neutral: 'bg-background-soft text-muted',
}

/**
 * Notification list card with read/unread states.
 */
export function NotificationCard({
  title = 'Notifications',
  items = [],
  onMarkAllRead,
  emptyText = 'You’re all caught up.',
  className,
}) {
  const unread = items.filter((item) => !item.read).length

  return (
    <Card variant="default" radius="lg" padding="none" className={cn('overflow-hidden', className)}>
      <CardHeader className="flex-row items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {unread > 0 ? <Badge variant="primary" size="xs">{unread}</Badge> : null}
        </div>
        {onMarkAllRead && unread > 0 ? (
          <Button variant="ghost" size="sm" leftIcon={CheckCheck} onClick={onMarkAllRead}>
            Mark all read
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="px-2 pb-3 pt-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-background-soft text-muted">
              <Bell className="size-5" />
            </span>
            <p className="text-sm font-medium text-foreground">{emptyText}</p>
          </div>
        ) : (
          <motion.ul initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }} className="flex flex-col">
            {items.map((item, index) => {
              const Icon = item.icon ?? Bell
              return (
                <motion.li
                  key={item.id ?? index}
                  variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}
                  className={cn(
                    'flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-background-soft/60',
                    !item.read && 'bg-primary-muted/40',
                  )}
                >
                  <span className={cn('relative grid size-8 shrink-0 place-items-center rounded-lg', TONE_STYLES[item.tone ?? 'neutral'])}>
                    {Icon ? <Icon className="size-4" /> : null}
                    {!item.read ? <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary ring-2 ring-surface" /> : null}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{item.title}</span>
                    {item.description ? <span className="line-clamp-2 text-xs text-muted">{item.description}</span> : null}
                    <span className="text-[11px] text-subtle">{formatRelativeTime(item.time)}</span>
                  </span>
                </motion.li>
              )
            })}
          </motion.ul>
        )}
      </CardContent>
    </Card>
  )
}

export default NotificationCard
