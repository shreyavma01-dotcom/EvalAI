import { cn } from '@/utils/cn'

/**
 * Divider with orientation, style and optional centered label.
 */
export function Divider({ className, orientation = 'horizontal', variant = 'solid', label, labelClassName }) {
  const isHorizontal = orientation === 'horizontal'

  const line = cn(
    'bg-border',
    variant === 'dashed' &&
      'bg-[repeating-linear-gradient(90deg,rgb(var(--border))_0_6px,transparent_6px_12px)]',
    isHorizontal ? 'h-px flex-1' : 'w-px self-stretch',
  )

  if (!label) {
    return (
      <div
        role="separator"
        aria-orientation={orientation}
        className={cn(isHorizontal ? 'flex w-full items-center' : 'flex h-full items-center', className)}
      >
        <div className={cn(line, isHorizontal ? 'w-full flex-1' : 'h-full flex-1')} />
      </div>
    )
  }

  return (
    <div role="separator" aria-orientation={orientation} className={cn('flex items-center gap-3', className)}>
      <div className={line} />
      <span className={cn('text-xs font-medium uppercase tracking-wide text-muted', labelClassName)}>{label}</span>
      <div className={line} />
    </div>
  )
}

export default Divider
