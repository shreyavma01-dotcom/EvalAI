import { forwardRef, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'
import { Label } from './Label'

export const selectVariants = cva(
  [
    'w-full appearance-none rounded-lg border bg-surface text-foreground shadow-xs',
    'transition-all duration-[var(--duration-fast)]',
    'placeholder:text-muted-foreground/70',
    'focus:outline-none focus:ring-4 focus:ring-ring/15 focus:border-ring/60',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'aria-[invalid=true]:border-danger/70 aria-[invalid=true]:focus:ring-danger/15',
    'cursor-pointer',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'border-border',
        filled: 'border-transparent bg-background-soft',
        glass: 'glass border-transparent',
      },
      size: {
        sm: 'h-8 pl-2.5 pr-8 text-sm rounded-md',
        md: 'h-10 pl-3.5 pr-9 text-sm rounded-lg',
        lg: 'h-12 pl-4 pr-10 text-base rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

/**
 * Styled native select (accessible, keyboard friendly).
 */
export const Select = forwardRef(function Select(
  { className, variant = 'default', size = 'md', label, hint, error, required = false, id, children, placeholder, ...props },
  ref,
) {
  const autoId = useId()
  const selectId = id ?? autoId
  const messageId = `${selectId}-message`

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <Label htmlFor={selectId} required={required}>
          {label}
        </Label>
      ) : null}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(selectVariants({ variant, size }), className)}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? messageId : undefined}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          ) : null}
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
      {error || hint ? (
        <p id={messageId} className={cn('text-xs leading-4', error ? 'text-danger' : 'text-muted')}>
          {error ?? hint}
        </p>
      ) : null}
    </div>
  )
})

export default Select
