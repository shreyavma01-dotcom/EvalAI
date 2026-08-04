import { forwardRef, useId } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'
import { Label } from './Label'

export const textareaVariants = cva(
  [
    'w-full rounded-lg border bg-surface text-foreground shadow-xs',
    'transition-all duration-[var(--duration-fast)]',
    'placeholder:text-muted-foreground/70',
    'focus:outline-none focus:ring-4 focus:ring-ring/15 focus:border-ring/60',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'aria-[invalid=true]:border-danger/70 aria-[invalid=true]:focus:ring-danger/15 aria-[invalid=true]:focus:border-danger',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'border-border',
        filled: 'border-transparent bg-background-soft',
        ghost: 'border-transparent bg-transparent hover:bg-background-soft',
      },
      size: {
        sm: 'px-2.5 py-2 text-sm rounded-md min-h-16',
        md: 'px-3.5 py-2.5 text-sm rounded-lg min-h-24',
        lg: 'px-4 py-3 text-base rounded-lg min-h-32',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

/**
 * Multi-line text area with label, hint, error and optional counter.
 */
export const Textarea = forwardRef(function Textarea(
  { className, variant = 'default', size = 'md', label, hint, error, required = false, id, maxLength, showCounter = false, ...props },
  ref,
) {
  const autoId = useId()
  const textareaId = id ?? autoId
  const messageId = `${textareaId}-message`
  const valueLength = typeof props.value === 'string' ? props.value.length : 0

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <div className="flex items-center justify-between">
          <Label htmlFor={textareaId} required={required}>
            {label}
          </Label>
          {showCounter && maxLength ? (
            <span className="text-xs tabular-nums text-muted">
              {valueLength}/{maxLength}
            </span>
          ) : null}
        </div>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        className={cn(textareaVariants({ variant, size }), className)}
        required={required}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? messageId : undefined}
        {...props}
      />
      {error || hint ? (
        <p id={messageId} className={cn('text-xs leading-4', error ? 'text-danger' : 'text-muted')}>
          {error ?? hint}
        </p>
      ) : null}
    </div>
  )
})

export default Textarea
