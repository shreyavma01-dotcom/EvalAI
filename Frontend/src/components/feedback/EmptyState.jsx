import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import { FloatingGradient } from '@/components/animations/FloatingGradient'
import { Button } from '@/components/ui/Button'

/**
 * Premium empty state.
 */
export function EmptyState({
  icon: Icon,
  title = 'Nothing here yet',
  description,
  action,
  actionLabel,
  onAction,
  size = 'md',
  className,
  gradient = true,
}) {
  const iconSize = { sm: 'size-10', md: 'size-12', lg: 'size-16' }[size]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-border-strong bg-surface px-6 py-12 text-center',
        className,
      )}
    >
      {gradient ? (
        <FloatingGradient variant="primary" className="opacity-60" intensity={0.7} />
      ) : null}
      <div className="relative flex flex-col items-center gap-4">
        <div
          className={cn(
            'grid place-items-center rounded-2xl bg-primary-muted text-primary-strong shadow-inner',
            iconSize,
          )}
        >
          {Icon ? <Icon className={size === 'lg' ? 'size-8' : size === 'sm' ? 'size-5' : 'size-6'} /> : null}
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <h3 className="type-subtitle text-foreground">{title}</h3>
          {description ? <p className="type-caption max-w-sm">{description}</p> : null}
        </div>
        {action ?? (actionLabel && onAction ? (
          <Button onClick={onAction} size="md">
            {actionLabel}
          </Button>
        ) : null)}
      </div>
    </motion.div>
  )
}

export default EmptyState
