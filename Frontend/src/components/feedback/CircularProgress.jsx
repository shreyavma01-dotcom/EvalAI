import { useEffect, useState } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'
import { clamp } from '@/utils/format'

const circleVariants = cva('', {
  variants: {
    variant: {
      primary: 'stroke-primary',
      success: 'stroke-success',
      warning: 'stroke-warning',
      danger: 'stroke-danger',
      info: 'stroke-info',
      muted: 'stroke-muted',
      gradient: 'stroke-primary',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
})

const TRACK_VARIANTS = {
  primary: 'stroke-primary/15',
  success: 'stroke-success/15',
  warning: 'stroke-warning/15',
  danger: 'stroke-danger/15',
  info: 'stroke-info/15',
  muted: 'stroke-muted/15',
  gradient: 'stroke-primary/15',
}

/**
 * Circular progress ring. Animates to `value` when it becomes visible.
 */
export function CircularProgress({
  value = 0,
  size = 56,
  strokeWidth = 6,
  variant = 'primary',
  showValue = true,
  label,
  className,
  children,
}) {
  const [progress, setProgress] = useState(0)
  const safeValue = clamp(Number(value) || 0, 0, 100)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  useEffect(() => {
    const id = window.setTimeout(() => setProgress(safeValue), 100)
    return () => window.clearTimeout(id)
  }, [safeValue])

  const gradientId = variant === 'gradient' ? `circular-gradient-${size}` : undefined

  return (
    <div className={cn('relative inline-grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={TRACK_VARIANTS[variant]}
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(var(--primary))" />
            <stop offset="100%" stopColor="rgb(var(--secondary))" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={gradientId ? `url(#${gradientId})` : undefined}
          className={cn(circleVariants({ variant }), 'transition-[stroke-dashoffset] duration-700 ease-[var(--ease-expo-out)]')}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        {children ?? (showValue ? (
          <span className="text-sm font-semibold tabular-nums text-foreground">{Math.round(progress)}%</span>
        ) : null)}
        {label ? <span className="sr-only">{label}</span> : null}
      </div>
    </div>
  )
}

export default CircularProgress
