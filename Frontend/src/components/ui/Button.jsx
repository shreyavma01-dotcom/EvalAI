import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'
import { Spinner } from '@/components/feedback/Spinner'

export const buttonVariants = cva(
  [
    'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg',
    'font-medium transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
    '[&>svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-primary text-primary-foreground shadow-medium',
          'hover:bg-primary-strong hover:shadow-large',
          'dark:hover:bg-primary-soft',
        ].join(' '),
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-strong',
        ghost: 'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
        outline: 'border border-border bg-transparent text-foreground hover:bg-accent hover:border-border-strong',
        danger: 'bg-danger text-danger-foreground shadow-medium hover:bg-danger-strong',
        soft: 'bg-primary-muted text-primary-strong hover:bg-primary/15 dark:text-primary-soft',
        'soft-danger': 'bg-danger-muted text-danger-strong hover:bg-danger/10',
        'soft-success': 'bg-success-muted text-success-strong hover:bg-success/10',
        success: 'bg-success text-success-foreground shadow-medium hover:bg-success-strong',
        warning: 'bg-warning text-warning-foreground shadow-medium hover:bg-warning-strong',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
        sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
        md: 'h-9 px-4 text-sm gap-2 rounded-lg',
        lg: 'h-10 px-5 text-sm gap-2 rounded-lg',
        xl: 'h-12 px-6 text-base gap-2.5 rounded-xl',
        'icon-xs': 'size-7 rounded-md p-0',
        'icon-sm': 'size-8 rounded-lg p-0',
        icon: 'size-9 rounded-lg p-0',
        'icon-lg': 'size-10 rounded-lg p-0',
        'icon-xl': 'size-12 rounded-xl p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

/**
 * Premium button with variants, sizes, loading and icon support.
 */
export const Button = forwardRef(function Button(
  { className, variant = 'primary', size = 'md', loading = false, disabled = false, leftIcon: LeftIcon, rightIcon: RightIcon, children, ...props },
  ref,
) {
  const spinnerSize = {
    xs: 'xs',
    sm: 'sm',
    md: 'sm',
    lg: 'md',
    xl: 'md',
    'icon-xs': 'xs',
    'icon-sm': 'sm',
    icon: 'sm',
    'icon-lg': 'md',
    'icon-xl': 'md',
  }[size]

  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size={spinnerSize} variant="current" /> : LeftIcon ? <LeftIcon className={size.startsWith('icon') ? '' : 'size-4'} /> : null}
      {children}
      {!loading && RightIcon ? <RightIcon className="size-4" /> : null}
    </button>
  )
})

export default Button
