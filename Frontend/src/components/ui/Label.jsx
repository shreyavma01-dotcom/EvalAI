import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

/**
 * Form label with optional required marker.
 */
export const Label = forwardRef(function Label({ className, children, required = false, ...props }, ref) {
  return (
    <label
      ref={ref}
      className={cn('text-sm font-medium text-foreground', className)}
      {...props}
    >
      {children}
      {required ? (
        <span className="ml-0.5 text-danger" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  )
})

export default Label
