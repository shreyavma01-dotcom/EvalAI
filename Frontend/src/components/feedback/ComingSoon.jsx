import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import { FloatingGradient } from '@/components/animations/FloatingGradient'

/**
 * Shared "Coming Soon" state for features that are announced in the
 * navigation but not implemented yet. Keeps the route alive with an
 * intentional, polished placeholder — no fake data, no dead ends.
 */
export function ComingSoon({ icon: Icon, title = 'Coming Soon', description, className }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center',
        className,
      )}
    >
      <FloatingGradient variant="primary" className="opacity-60" intensity={0.7} />
      <div className="relative flex flex-col items-center gap-4">
        {Icon ? (
          <span className="grid size-16 place-items-center rounded-2xl bg-primary-muted text-primary-strong shadow-inner">
            <Icon className="size-8" />
          </span>
        ) : null}
        <h2 className="type-subtitle text-foreground">{title}</h2>
        {description ? <p className="type-caption max-w-md">{description}</p> : null}
      </div>
    </motion.section>
  )
}

export default ComingSoon