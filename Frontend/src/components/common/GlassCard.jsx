import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

/**
 * Convenience glass surface — use <Card variant="glass"> for full composition.
 */
export const GlassCard = forwardRef(function GlassCard({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'glass rounded-2xl p-6 text-foreground shadow-glass transition-all duration-300 ease-[var(--ease-expo-out)] hover:shadow-hover',
        className,
      )}
      {...props}
    />
  )
})

export default GlassCard
