import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'

export const skeletonVariants = cva('relative overflow-hidden bg-background-soft', {
  variants: {
    shape: {
      text: 'h-3.5 rounded',
      circle: 'rounded-full',
      rect: 'rounded-lg',
    },
  },
  defaultVariants: {
    shape: 'rect',
  },
})

/**
 * Base shimmer skeleton block.
 */
export function Skeleton({ className, shape = 'rect', ...props }) {
  return (
    <span className={cn(skeletonVariants({ shape }), 'animate-pulse', className)} {...props}>
      <span className="sr-only">Loading…</span>
    </span>
  )
}

/**
 * Multi-line text skeleton.
 */
export function SkeletonText({ lines = 3, className, lastLineWidth = '60%' }) {
  return (
    <span className={cn('flex flex-col gap-2.5', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          shape="text"
          className="h-3.5 w-full"
          style={index === lines - 1 ? { width: lastLineWidth } : undefined}
        />
      ))}
    </span>
  )
}

/**
 * Card-shaped skeleton for loading grids.
 */
export function SkeletonCard({ className, lines = 3 }) {
  return (
    <span className={cn('flex flex-col gap-4 rounded-2xl border border-border/60 bg-surface p-5 shadow-sm', className)}>
      <span className="flex items-center justify-between">
        <Skeleton shape="circle" className="size-10" />
        <Skeleton shape="rect" className="h-6 w-16" />
      </span>
      <Skeleton shape="text" className="h-8 w-2/3" />
      <SkeletonText lines={lines} lastLineWidth="80%" />
    </span>
  )
}

export default Skeleton
