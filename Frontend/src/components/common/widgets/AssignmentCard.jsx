import { motion } from 'framer-motion'
import { CalendarDays, FileText, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/common/Card'
import { Badge } from '@/components/feedback/Badge'
import { AvatarGroup } from '@/components/common/Avatar'
import { LinearProgress } from '@/components/feedback/LinearProgress'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'

const STATUS_VARIANTS = {
  draft: 'neutral',
  active: 'primary',
  graded: 'success',
  published: 'info',
  archived: 'muted',
}

/**
 * Assignment card — status, subject, dates, students and progress.
 */
export function AssignmentCard({
  title,
  subject,
  status = 'draft',
  dueDate,
  students = [],
  progress = 0,
  onClick,
  className,
}) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
      <Card
        variant="interactive"
        radius="lg"
        padding="none"
        onClick={onClick}
        className={cn('overflow-hidden', className)}
      >
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-muted text-primary-strong">
              <FileText className="size-5" />
            </span>
            <Badge variant={STATUS_VARIANTS[status] ?? 'neutral'} size="sm">
              {status}
            </Badge>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold leading-5 text-foreground">{title}</h3>
            <span className="text-xs text-muted">{subject}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {dueDate ? `Due ${formatDate(dueDate)}` : 'No due date'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5" />
              {students.length} students
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <LinearProgress value={progress} variant={status === 'published' ? 'success' : 'primary'} size="sm" />
            <div className="flex items-center justify-between">
              {students.length ? <AvatarGroup users={students} size="xs" max={4} /> : <span />}
              <span className="text-[11px] font-medium text-muted">{Math.round(progress)}% graded</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default AssignmentCard
