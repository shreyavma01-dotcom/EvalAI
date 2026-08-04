import { forwardRef, useEffect, useId, useRef } from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Animated checkbox with indeterminate support.
 */
export const Checkbox = forwardRef(function Checkbox(
  {
    className,
    id,
    label,
    description,
    checked = false,
    indeterminate = false,
    onCheckedChange,
    disabled = false,
    ...props
  },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const inputRef = useRef(null)

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = Boolean(indeterminate)
  }, [indeterminate])

  const handleChange = (event) => {
    onCheckedChange?.(event.target.checked, event)
  }

  const box = (
    <span
      className={cn(
        'grid size-4.5 shrink-0 place-items-center rounded-[5px] border transition-all duration-[var(--duration-fast)]',
        checked || indeterminate
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border-strong bg-surface group-hover:border-primary/60',
        disabled && 'opacity-50',
      )}
    >
      {indeterminate ? (
        <Minus className="size-3" strokeWidth={3} />
      ) : checked ? (
        <Check className="size-3" strokeWidth={3} />
      ) : null}
    </span>
  )

  if (!label && !description) {
    return (
      <label className={cn('group inline-flex cursor-pointer items-center', disabled && 'cursor-not-allowed', className)}>
        <input
          ref={(node) => {
            inputRef.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
          }}
          id={inputId}
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          {...props}
        />
        {box}
      </label>
    )
  }

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'group inline-flex cursor-pointer items-start gap-3',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <input
        ref={(node) => {
          inputRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        id={inputId}
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        {...props}
      />
      {box}
      {label || description ? (
        <span className="flex flex-col gap-0.5">
          {label ? <span className="text-sm font-medium leading-5 text-foreground">{label}</span> : null}
          {description ? <span className="text-xs leading-4 text-muted">{description}</span> : null}
        </span>
      ) : null}
    </label>
  )
})

export default Checkbox
