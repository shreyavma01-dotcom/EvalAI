import { forwardRef, useId } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'
import { Label } from './Label'

export const inputVariants = cva(
  [
    'w-full rounded-lg border bg-surface text-foreground shadow-xs',
    'transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)]',
    'placeholder:text-muted-foreground/70',
    'focus:outline-none focus:ring-4 focus:ring-ring/15 focus:border-ring/60',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'aria-[invalid=true]:border-danger/70 aria-[invalid=true]:focus:ring-danger/15 aria-[invalid=true]:focus:border-danger',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'border-border bg-surface',
        filled: 'border-transparent bg-background-soft',
        ghost: 'border-transparent bg-transparent hover:bg-background-soft',
        glass: 'glass border-transparent',
      },
      size: {
        sm: 'h-8 px-2.5 text-sm rounded-md',
        md: 'h-10 px-3.5 text-sm rounded-lg',
        lg: 'h-12 px-4 text-base rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

/**
 * Text input with optional label, hint, error and icon adornments.
 */
export const Input = forwardRef(function Input(
  {
    className,
    variant = 'default',
    size = 'md',
    label,
    hint,
    error,
    required = false,
    id,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    onRightIconClick,
    containerClassName,
    ...props
  },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const messageId = `${inputId}-message`

  const right = RightIcon ? (
    <button
      type="button"
      tabIndex={-1}
      onClick={onRightIconClick}
      className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted transition-colors hover:bg-background-soft hover:text-foreground"
    >
      <RightIcon className="size-4" />
    </button>
  ) : null

  return (
    <div className={cn('flex w-full flex-col gap-1.5', containerClassName)}>
      {label ? (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      ) : null}
      <div className="relative">
        {LeftIcon ? (
          <LeftIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            inputVariants({ variant, size }),
            LeftIcon && 'pl-9',
            RightIcon && 'pr-10',
            className,
          )}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? messageId : undefined}
          {...props}
        />
        {right}
      </div>
      {error || hint ? (
        <p
          id={messageId}
          className={cn('text-xs leading-4', error ? 'text-danger' : 'text-muted')}
        >
          {error ?? hint}
        </p>
      ) : null}
    </div>
  )
})

export default Input
