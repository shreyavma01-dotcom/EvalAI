import { cn } from '@/utils/cn'

/**
 * EvalAI brand mark — gradient rounded square with spark + wordmark.
 */
export function Logo({ size = 'md', showWordmark = true, className }) {
  const box = { sm: 'size-7 rounded-lg', md: 'size-8 rounded-xl', lg: 'size-10 rounded-xl' }[size]
  const glyph = { sm: 'size-3.5', md: 'size-4', lg: 'size-5' }[size]
  const word = { sm: 'text-base', md: 'text-lg', lg: 'text-xl' }[size]

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'grid place-items-center bg-gradient-to-br from-primary via-primary-soft to-secondary text-white shadow-glow-primary',
          box,
        )}
      >
        <svg viewBox="0 0 24 24" fill="none" className={glyph} aria-hidden="true">
          <path
            d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z"
            fill="currentColor"
          />
          <path d="M19 2l.7 2.3L22 5l-2.3.7L19 8l-.7-2.3L16 5l2.3-.7L19 2z" fill="currentColor" opacity="0.8" />
        </svg>
      </span>
      {showWordmark ? (
        <span className={cn('font-display font-bold tracking-tight text-foreground', word)}>
          Eval<span className="text-gradient-brand">AI</span>
        </span>
      ) : null}
    </span>
  )
}

export default Logo
