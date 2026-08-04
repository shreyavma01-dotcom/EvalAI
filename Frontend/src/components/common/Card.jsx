import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'

export const cardVariants = cva('flex flex-col text-card-foreground', {
  variants: {
    variant: {
      default: 'border border-border/60 bg-surface shadow-card',
      elevated: 'border border-border/50 bg-surface shadow-medium',
      outline: 'border border-border bg-transparent',
      glass: 'glass text-foreground shadow-glass',
      'glass-strong': 'glass-strong text-foreground shadow-floating',
      gradient: 'border border-transparent bg-gradient-to-br from-primary-muted via-surface to-secondary-muted',
      interactive: 'border border-border/60 bg-surface shadow-card cursor-pointer transition-all duration-300 ease-[var(--ease-expo-out)] hover:-translate-y-1 hover:shadow-hover',
    },
    radius: {
      none: 'rounded-none',
      sm: 'rounded-lg',
      md: 'rounded-xl',
      lg: 'rounded-2xl',
      xl: 'rounded-3xl',
    },
    padding: {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
      xl: 'p-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    radius: 'lg',
    padding: 'md',
  },
})

export const Card = forwardRef(function Card(
  { className, variant = 'default', radius = 'lg', padding = 'md', ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn(cardVariants({ variant, radius, padding }), className)} {...props} />
  )
})

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('type-subtitle text-foreground', className)} {...props} />
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm text-muted', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('flex-1', className)} {...props} />
}

export function CardFooter({ className, ...props }) {
  return <div className={cn('flex items-center', className)} {...props} />
}

export default Card
